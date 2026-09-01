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


# Initial seed database if empty, to make the workspace work beautifully out of the box!
def seed_if_empty():
    db = load_db()
    if not db.get("assets"):
        lec1_text = """
        VIT-AP UNIVERSITY - MODULE-I : LECTURE-1: INTRODUCTION TO MICROPROCESSORS
        Faculty: Dr. Aruru Sai Kumar, Dr. Subhasish Mahapatra (School of Electronics Engineering - SENSE)
        
        1. COURSE CONTENT:
        - Generation of Computers (1st to 5th Generation)
        - Definition of Micro-processor
        - Definition of Micro-controller
        - Definition of Embedded System
        
        2. GENERAL PURPOSE COMPUTER (GPC) ARCHITECTURE:
        The basic blocks of a general purpose computer are:
        - Input Device
        - Output Device
        - Central Processing Unit (CPU): Consists of Control Unit, Arithmetic/Logic Unit (ALU), and Registers.
        - Memory Block: Divided into Main Memory (RAM) and Secondary Memory (Hard Disk, Magnetic Tape, Magnetic Drum).
        
        3. GENERATION OF COMPUTERS:
        - First Generation (1946 – 1954): Vacuum Tubes as CPU and main memory; Magnetic Tapes/Drums for secondary memory. Machine language only. Examples: ENIAC (1946), EDSAC (1949), EDVAC (1950), UNIVAC-1 (1951). Very large size, high energy consumption, fast heating, slow speed.
        - Second Generation (1955 – 1964): Transistors replaced vacuum tubes; Magnetic ferrite-core main memory; Magnetic disks/tapes secondary memory. Assembly language. Examples: Honeywell 400, IBM 7094, CDC 1604, UNIVAC 1108.
        - Third Generation (1965 – 1974): ICs (SSI & MSI) for CPU/logic; Semiconductor RAM/ROM replaced magnetic core; Mouse and keyboard input. Examples: IBM 360/370, CDC 6600, PDP, TDC-316.
        - Fourth Generation (1975 – 1990): LSI Technology; true single-chip Microprocessors; GUI OS. Examples: IBM PC, Apple II, VAX 9000.
        - Fifth Generation (1991 – Present): VLSI and ULSI technologies; single-chip Microcontrollers with integrated memory, timers, I/O ports; Windows and Linux OS.
        
        4. SEMICONDUCTOR INTEGRATION SCALES:
        - SSI (1963): < 100 components
        - MSI (1970): 100 – 1,000 components
        - LSI (1975): 1,000 – 10,000 components
        - VLSI (1980): 10,000 – 10^9 components
        - ULSI (1990): > 10^6 components
        - GSI (2010): > 10^10 components
        
        5. DEFINITIONS & APPLICATIONS:
        - Microprocessor: Semiconductor device containing ALU, Control Unit, and Registers on a single chip, fabricated using LSI technology.
        - Microcontroller: Semiconductor device combining CPU, Memory (RAM/ROM), Timers, and I/O ports on a single chip, fabricated using VLSI technology.
        - Embedded System: Combination of hardware and software designed for a specific dedicated function within a larger system.
        - Applications: Automotive (ABS, electronic ignition), Medical (ECG, dialysis, cancer treatments), Avionics/Military (missile guidance, GPS, surveillance), Consumer electronics (washing machines, clocks, toys, AV electronics), Communication (routers, smartphones, radios).
        - Embedded Design Parameters: Power consumption, speed of execution, system size/weight, performance accuracy. Selection criteria: processing rate/size, I/O interfaces, memory capacity.
        """
        
        lec2_text = """
        VIT-AP UNIVERSITY - MODULE-I : LECTURE-2: BASICS OF MICROPROCESSORS, MICROCONTROLLERS & MEMORY
        Faculty: Dr. Aruru Sai Kumar, Dr. Subhasish Mahapatra (School of Electronics Engineering - SENSE)
        
        1. BASICS OF MICROPROCESSOR:
        - Definition: Central Processing Unit (CPU) built on a single Integrated Circuit (IC). Known as the "brain of the computer", capable of processing 8, 16, 32, or 64 bits simultaneously at extremely high speed.
        - Building Blocks: Arithmetic Logic Unit (ALU), Control Unit (CU), Bank of Registers (Register File), Program Counter (PC), Timing/Clock Unit, and Interconnection Buses.
        
        2. INTEL MICROPROCESSOR EVOLUTION:
        - 4004 (1971): 4-bit Data Bus, 8-bit Address Bus
        - 8008 (1972): 8-bit Data Bus, 8-bit Address Bus
        - 8080 (1974): 8-bit Data Bus, 16-bit Address Bus
        - 8085 (1977): 8-bit Data Bus, 16-bit Address Bus
        - 8086 (1978): 16-bit Data Bus, 20-bit Address Bus (1 MB addressable)
        - 80186 (1982) & 80286 (1983): 16-bit Data Bus, 20/24-bit Address Bus
        - 80386 (1986) & 80486 (1989): 32-bit Data Bus, 32-bit Address Bus (4 GB addressable)
        - Pentium (1993+), Core 2 Duo (2006), Core 2 Quad (2008): 32-bit
        - Core i3, i5, i7 (2010 onwards): 64-bit Data Bus
        
        3. SYSTEM BUS ARCHITECTURE:
        - Data Bus: Bidirectional, transfers actual data. Bus width determines data throughput.
        - Address Bus: Unidirectional (CPU -> Memory/IO), transfers memory addresses. Bus width N determines max addressable memory (2^N bytes).
        - Control Bus: Transfers control and timing commands (Read RD, Write WR, Interrupt, Clock, Reset).
        
        4. INSTRUCTION EXECUTION CYCLE (FETCH - DECODE - EXECUTE):
        - 3 Phases: Fetch opcode from memory using PC address & RD signal -> Decode opcode in Control Unit -> Execute ALU operation and writeback to register/memory.
        - Example (R = X + Y): Fetch addition instruction -> CU decodes opcode -> Fetch X into Reg 1, fetch Y into Reg 2 -> ALU executes addition -> Store sum into accumulator -> Write sum back to memory address R.
        
        5. MICROCONTROLLER ARCHITECTURES & COMPARISON:
        - 8-bit Microcontrollers: AVR, PIC, HCS12, 8051 (1-byte ALU operations).
        - 16-bit Microcontrollers: Extended 8051XA, Intel 8096, MC68HC12 (2-byte ALU operations).
        - 32-bit Microcontrollers: ARM Cortex-M, PIC32, Intel 80960, Atmel 251 (4-byte ALU operations).
        - Microcontroller vs Microcomputer (PC): PC integrates CPU, RAM, ROM, and I/O on separate chips on a motherboard for general purpose tasks; Microcontroller integrates all components on a single chip for dedicated embedded control with lower latency and higher specialized speed.
        
        6. MEMORY SYSTEMS (RAM VS ROM):
        - Digital electronic circuits built with CMOS cells for binary storage.
        - RAM: Read and Write memory, volatile.
        - ROM: Read-only memory, non-volatile.
        - Operations: Memory Write (storing new data) and Memory Read (transferring stored data out).
        """
        
        db["assets"] = [
            {
                "id": "vit-ap-lec-1",
                "title": "VIT-AP Lecture 1: Introduction to Microprocessors & Computer Generations",
                "type": "file",
                "content": clean_text(lec1_text),
                "created_at": "2026-09-01T10:00:00Z"
            },
            {
                "id": "vit-ap-lec-2",
                "title": "VIT-AP Lecture 2: Microprocessor Architecture, Instruction Cycles & Microcontrollers",
                "type": "file",
                "content": clean_text(lec2_text),
                "created_at": "2026-09-01T10:15:00Z"
            }
        ]
        save_db(db)

seed_if_empty()

@app.get("/")
def root():
    return {
        "message": "Styrud API is running",
        "frontend_url": "http://localhost:5173",
        "docs_url": "http://127.0.0.1:8001/docs",
        "status_url": "http://127.0.0.1:8001/api/status"
    }

@app.get("/api/health")
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

@app.get("/api/export-sources")
def export_sources(asset_id: Optional[str] = None):
    db = load_db()
    if not db["assets"]:
        raise HTTPException(status_code=400, detail="No assets in workspace")
    
    if asset_id:
        selected = [a for a in db["assets"] if a["id"] == asset_id]
        if not selected:
            raise HTTPException(status_code=404, detail="Asset not found")
        assets = selected
    else:
        assets = db["assets"]
        
    combined_text = ""
    for a in assets:
        combined_text += f"========================================\n"
        combined_text += f"SOURCE: {a['title']}\n"
        combined_text += f"TYPE: {a['type']} | DATE: {a['created_at']}\n"
        combined_text += f"========================================\n\n"
        combined_text += a['content'] + "\n\n\n"
        
    return {
        "filename": "Styrud_NotebookLM_Sources.txt",
        "content": combined_text.strip(),
        "assets_count": len(assets),
        "notebooklm_url": "https://notebooklm.google.com"
    }

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


# ==========================================
# Google NotebookLM Playwright Bot Endpoints
# ==========================================

from backend.services.notebooklm_bot import bot as nlm_bot

class BotExecutePayload(BaseModel):
    tool_id: str
    asset_id: Optional[str] = None
    custom_prompt: Optional[str] = None
    visible: bool = True

@app.get("/api/notebooklm-bot/status")
async def get_bot_status():
    return await nlm_bot.check_status()

@app.post("/api/notebooklm-bot/login")
async def launch_bot_login():
    return await nlm_bot.launch_login_session()

@app.post("/api/notebooklm-bot/execute")
async def execute_bot_task(payload: BotExecutePayload):
    db = load_db()
    if not db["assets"]:
        raise HTTPException(status_code=400, detail="No assets in workspace to upload.")
        
    if payload.asset_id:
        selected = [a for a in db["assets"] if a["id"] == payload.asset_id]
        if not selected:
            raise HTTPException(status_code=404, detail="Selected asset not found")
        assets = selected
    else:
        assets = db["assets"]
        
    # Combine all active sources
    combined_sources = ""
    for a in assets:
        combined_sources += f"========================================\n"
        combined_sources += f"SOURCE: {a['title']}\n"
        combined_sources += f"TYPE: {a['type']} | DATE: {a['created_at']}\n"
        combined_sources += f"========================================\n\n"
        combined_sources += a['content'] + "\n\n\n"
        
    # Standard prompts per task
    default_prompts = {
        "audio": "Generate an Audio Overview deep dive",
        "reports": "Please create an in-depth, academic-grade research briefing report with executive summary, technical breakdown, comparative analysis, and key study takeaways based strictly on these uploaded sources.",
        "quiz": "Please generate a 5-question multiple choice evaluation quiz with 4 distinct options and detailed concept explanations for each correct answer based on these uploaded sources.",
        "flashcards": "Please create 8 high-yield active recall flashcards for exam preparation covering core definitions, formulas, component functions, and architectures from these sources.",
        "slides": "Please generate a structured 6-slide presentation deck with clear headlines, high-impact bullet points, and visual illustration cues based on these uploaded sources.",
        "video": "Please create a video overview presentation script with synchronized narration cues and key bullet points based on these uploaded sources.",
        "mindmap": "Please construct a hierarchical concept map and knowledge tree breaking down all main themes, subtopics, and granular definitions from these uploaded sources.",
        "infographic": "Please extract the key evolutionary milestones, hardware generations, and engineering design parameters into a structured infographic timeline and process map.",
        "datatable": "Please build a structured comparative data matrix distinguishing architectures, technical specifications, and processor categories from these uploaded sources.",
        "summary": "Please provide a high-yield executive summary and core takeaways from these uploaded sources."
    }
    
    prompt = payload.custom_prompt or default_prompts.get(payload.tool_id, default_prompts["reports"])
    
    result = await nlm_bot.execute_task(
        task_id=payload.tool_id,
        sources_text=combined_sources,
        prompt=prompt,
        visible=payload.visible
    )
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8001, reload=True)
