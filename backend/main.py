import os
import json
import uuid
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List

# Services imports
from backend.services.parser import parse_pdf, parse_text, clean_text
from backend.services.cluster import cluster_and_project
from backend.services import ai, audio

app = FastAPI(title="Styrud API", description="NotebookLM + Recall study tool backend")

# Setup CORS so React frontend can call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_DIR = os.path.join(BASE_DIR, "static")
DB_FILE = os.path.join(BASE_DIR, "db.json")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# Mount static folder for audio files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Helper for database persistence
def load_db() -> dict:
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"assets": []}

def save_db(db: dict):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=4)

# Models
class LinkPayload(BaseModel):
    title: str
    url: str
    content: Optional[str] = None

class AskPayload(BaseModel):
    question: str
    history: List[dict]
    asset_id: Optional[str] = None # If None, query all assets

class AudioPayload(BaseModel):
    language: str
    asset_id: Optional[str] = None

class KeysPayload(BaseModel):
    gemini_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None


# Initial seed database if empty, to make the mock mode work beautifully out of the box!
def seed_if_empty():
    db = load_db()
    if not db.get("assets"):
        # Let's insert a couple of mock documents
        biology_text = """
        Cell biology is a branch of biology that studies the structure, function, and behavior of cells. 
        All living organisms are made of cells. A cell is the basic unit of life that is responsible for the living and functioning of organisms. 
        mitosis is a part of the cell cycle in which replicated chromosomes are separated into two new nuclei. 
        Cell division gives rise to genetically identical cells in which the total number of chromosomes is maintained. 
        Mitochondria are double-membrane-bound organelles found in most eukaryotic organisms. 
        They generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy. 
        DNA, or deoxyribonucleic acid, is the hereditary material in humans and almost all other organisms. 
        Nearly every cell in a person's body has the same DNA. Ribosomes are macromolecular machines, 
        found within all living cells, that perform biological protein synthesis (translation).
        """
        quantum_text = """
        Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles. 
        It is the foundation of all quantum physics including quantum chemistry, quantum field theory, quantum technology, and quantum information science.
        Superposition is a principle of quantum mechanics where physical systems can exist in multiple states or configurations simultaneously until they are observed.
        Quantum entanglement is a physical phenomenon that occurs when a group of particles are generated, interact, or share spatial proximity in a way such that the quantum state of each particle cannot be described independently.
        Wave-particle duality is the concept in quantum mechanics that every particle or quantum entity may be described as either a particle or a wave.
        Schrodinger's cat is a thought experiment that illustrates the paradox of quantum superposition in macroscopic objects.
        """
        db["assets"] = [
            {
                "id": "mock-bio",
                "title": "Introduction to Cell Biology.pdf (Sample)",
                "type": "file",
                "content": clean_text(biology_text),
                "created_at": "2026-08-27T12:00:00Z"
            },
            {
                "id": "mock-quantum",
                "title": "Quantum Mechanics & Superposition (Sample Link)",
                "type": "url",
                "content": clean_text(quantum_text),
                "created_at": "2026-08-27T12:05:00Z"
            }
        ]
        save_db(db)

seed_if_empty()

@app.get("/api/status")
def get_status():
    keys = ai.has_keys()
    db = load_db()
    return {
        "status": "online",
        "api_keys_configured": keys,
        "is_fallback_mode": not keys["gemini"],
        "assets_count": len(db["assets"])
    }

@app.get("/api/assets")
def get_assets():
    db = load_db()
    # Return assets list without sending entire content body to save bandwidth (unless requested)
    return [
        {
            "id": a["id"],
            "title": a["title"],
            "type": a["type"],
            "created_at": a["created_at"],
            "content_preview": a["content"][:200] + "..." if a["content"] else ""
        }
        for a in db["assets"]
    ]

@app.post("/api/upload")
def upload_file(file: UploadFile = File(...)):
    db = load_db()
    
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1].lower()
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse content
        content = ""
        if ext == ".pdf":
            content = parse_pdf(save_path)
        elif ext in [".txt", ".md", ".json"]:
            content = parse_text(save_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or text files.")
            
        if not content.strip():
            raise HTTPException(status_code=400, detail="File appeared to be empty or unparseable.")
            
        content_cleaned = clean_text(content)
        
        new_asset = {
            "id": file_id,
            "title": file.filename,
            "type": "file",
            "content": content_cleaned,
            "created_at": "2026-08-27T19:53:00Z"
        }
        
        db["assets"].append(new_asset)
        save_db(db)
        
        return {"id": file_id, "title": file.filename, "message": "Uploaded successfully"}
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/add-link")
def add_link(payload: LinkPayload):
    db = load_db()
    file_id = str(uuid.uuid4())
    
    # In a full-blown app, we'd fetch URL HTML and scrape text, 
    # but here we can accept either direct input text or write a lightweight scrape logic, 
    # or let the user paste text. If no content provided, we use a mock placeholder summary of the URL
    content = payload.content
    if not content:
        content = f"This is scraped/retrieved content from the URL: {payload.url}. It covers various topics related to {payload.title}."
        
    new_asset = {
        "id": file_id,
        "title": payload.title,
        "type": "url",
        "content": clean_text(content),
        "created_at": "2026-08-27T19:53:00Z"
    }
    
    db["assets"].append(new_asset)
    save_db(db)
    return {"id": file_id, "title": payload.title, "message": "Link added successfully"}

@app.delete("/api/delete-asset/{asset_id}")
def delete_asset(asset_id: str):
    db = load_db()
    initial_len = len(db["assets"])
    db["assets"] = [a for a in db["assets"] if a["id"] != asset_id]
    
    if len(db["assets"]) == initial_len:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    save_db(db)
    return {"message": "Asset deleted successfully"}

@app.get("/api/cluster")
def get_clusters():
    db = load_db()
    if not db["assets"]:
        return {"nodes": [], "edges": [], "clusters": []}
        
    # Map database assets to clustering format
    documents = [{"id": a["id"], "title": a["title"], "text": a["content"]} for a in db["assets"]]
    return cluster_and_project(documents)

@app.get("/api/generate/{tool_type}")
def generate_tool(tool_type: str, asset_id: Optional[str] = None):
    db = load_db()
    if not db["assets"]:
        raise HTTPException(status_code=400, detail="No assets uploaded yet.")
        
    # Get relevant content
    if asset_id:
        selected = [a for a in db["assets"] if a["id"] == asset_id]
        if not selected:
            raise HTTPException(status_code=404, detail="Selected asset not found")
        content = selected[0]["content"]
    else:
        # Merge all asset content
        content = "\n\n".join([a["content"] for a in db["assets"]])
        
    # Call matching service
    if tool_type == "summary":
        return {"data": ai.get_summary(content)}
    elif tool_type == "report":
        return {"data": ai.get_report(content)}
    elif tool_type == "quiz":
        return ai.get_quiz(content)
    elif tool_type == "flashcards":
        return ai.get_flashcards(content)
    elif tool_type == "slides":
        return ai.get_slides(content)
    elif tool_type == "infographic":
        return ai.get_infographic(content)
    elif tool_type == "mindmap":
        return ai.get_mindmap(content)
    elif tool_type == "datatable":
        return ai.get_data_table(content)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown tool type: {tool_type}")

@app.post("/api/audio-overview")
def generate_audio(payload: AudioPayload):
    db = load_db()
    if not db["assets"]:
        raise HTTPException(status_code=400, detail="No assets uploaded yet.")
        
    if payload.asset_id:
        selected = [a for a in db["assets"] if a["id"] == payload.asset_id]
        if not selected:
            raise HTTPException(status_code=404, detail="Selected asset not found")
        content = selected[0]["content"]
    else:
        content = "\n\n".join([a["content"] for a in db["assets"]])
        
    try:
        filename = audio.generate_audio_overview(content, payload.language)
        return {
            "audio_url": f"/static/audio/{filename}",
            "language": payload.language,
            "message": "Audio overview generated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ask")
def ask_question(payload: AskPayload):
    db = load_db()
    if not db["assets"]:
        raise HTTPException(status_code=400, detail="No assets uploaded yet.")
        
    if payload.asset_id:
        selected = [a for a in db["assets"] if a["id"] == payload.asset_id]
        if not selected:
            raise HTTPException(status_code=404, detail="Selected asset not found")
        content = selected[0]["content"]
    else:
        content = "\n\n".join([a["content"] for a in db["assets"]])
        
    answer = ai.ask_question(content, payload.history, payload.question)
    return {"answer": answer}

@app.post("/api/save-keys")
def save_keys(payload: KeysPayload):
    # 1. Update the env file
    env_path = os.path.join(os.path.dirname(BASE_DIR), ".env")
    
    # Read existing env lines
    env_lines = []
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            env_lines = f.readlines()
            
    # Filter out existing keys
    new_lines = []
    for line in env_lines:
        if not line.startswith("GEMINI_API_KEY=") and not line.startswith("ANTHROPIC_API_KEY="):
            new_lines.append(line)
            
    # Add new values if present
    if payload.gemini_api_key:
        new_lines.append(f"GEMINI_API_KEY={payload.gemini_api_key.strip()}\n")
    if payload.anthropic_api_key:
        new_lines.append(f"ANTHROPIC_API_KEY={payload.anthropic_api_key.strip()}\n")
        
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
        
    # 2. Hot-update in memory variables
    if payload.gemini_api_key:
        ai.GEMINI_KEY = payload.gemini_api_key.strip()
    if payload.anthropic_api_key:
        ai.CLAUDE_KEY = payload.anthropic_api_key.strip()
        
    return {"status": "success", "message": "API keys saved and configured in memory."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
