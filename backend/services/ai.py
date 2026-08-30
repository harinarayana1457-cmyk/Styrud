import os
import json
import re
import requests
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# Setup API keys
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
CLAUDE_KEY = os.environ.get("ANTHROPIC_API_KEY")
GEMINI_AVAILABLE = True


# Helper function to query Gemini via REST API (Python 3.14+ compatible, zero protobuf dependency)
def query_gemini(prompt: str, json_mode: bool = False) -> str:
    if not GEMINI_KEY:
        raise ValueError("GEMINI_API_KEY is not set")
    
    models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-pro-latest"]
    last_error = None
    
    for model_name in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_KEY}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }
        if json_mode:
            payload["generationConfig"] = {
                "responseMimeType": "application/json"
            }
            
        try:
            res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=60)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                    parts = candidates[0]["content"]["parts"]
                    text_parts = [p.get("text", "") for p in parts]
                    return "".join(text_parts)
            else:
                last_error = f"HTTP {res.status_code}: {res.text}"
        except Exception as e:
            last_error = str(e)
            
    raise Exception(f"Gemini API failure: {last_error}")

# Helper function to query Claude
def query_claude(prompt: str, system_prompt: str = "") -> str:
    if not CLAUDE_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not set")
    
    try:
        client = Anthropic(api_key=CLAUDE_KEY)
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=4000,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        # Handle different response block types in Anthropic SDK v0.21+
        if isinstance(message.content, list):
            return message.content[0].text
        return message.content
    except Exception as e:
        raise Exception(f"Claude API failure: {e}")

# Check if keys are active
def has_keys() -> dict:
    return {
        "gemini": bool(GEMINI_KEY),
        "claude": bool(CLAUDE_KEY)
    }

# ----------------- Fallback Mock Generators -----------------
def generate_mock_data(tool_type: str, content: str) -> dict | str:
    """Generates realistic mock data based on keywords in content."""
    content_lower = content.lower()
    
    # Identify topic
    if "quantum" in content_lower or "physics" in content_lower or "schrodinger" in content_lower:
        topic = "Quantum Physics"
        facts = [
            ("Superposition", "Particles can exist in multiple states simultaneously until measured."),
            ("Entanglement", "Spooky action at a distance; state of one particle instantly determines another."),
            ("Wave-Particle Duality", "Light and matter exhibit behaviors of both waves and particles."),
            ("Quantum Tunneling", "Particles pass through potential energy barriers they classically shouldn't."),
            ("Schrödinger's Cat", "A thought experiment showing the paradox of superposition at macroscopic scales.")
        ]
        q_and_a = [
            ("What is superposition?", "Superposition is a fundamental principle of quantum mechanics where physical systems can exist in multiple states or configurations simultaneously until they are observed or measured, collapsing them into a single state."),
            ("Explain Quantum Entanglement simply.", "Entanglement occurs when pairs or groups of particles are generated or interact in ways such that the quantum state of each particle cannot be described independently. Measuring one instantly reveals the state of the other, no matter the distance."),
            ("What is Schrödinger's Cat?", "It is a thought experiment by Erwin Schrödinger illustrating the problem of the Copenhagen interpretation of quantum mechanics applied to everyday objects, where a cat in a closed box can be considered both alive and dead until opened.")
        ]
    elif "cell" in content_lower or "biology" in content_lower or "mitosis" in content_lower or "dna" in content_lower:
        topic = "Cell Biology"
        facts = [
            ("Mitochondria", "The powerhouse of the cell, generating chemical energy (ATP)."),
            ("Mitosis", "A process of cell division resulting in two genetically identical daughter cells."),
            ("DNA Structure", "Double helix structure containing genetic instructions for all living things."),
            ("Ribosomes", "Molecular machines responsible for protein synthesis by translating mRNA."),
            ("Photosynthesis", "Process used by plants and other organisms to convert light energy into chemical energy.")
        ]
        q_and_a = [
            ("What does the mitochondria do?", "Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions, stored as adenosine triphosphate (ATP)."),
            ("What are the stages of mitosis?", "Mitosis is divided into four main stages: Prophase (chromatin condenses), Metaphase (chromosomes line up), Anaphase (sister chromatids separate), and Telophase (nuclei reform)."),
            ("What is transcription?", "Transcription is the process of copying a segment of DNA into RNA (mRNA) by the enzyme RNA polymerase, which is the first step of gene expression.")
        ]
    else:
        topic = "General Study Material"
        facts = [
            ("Active Recall", "A learning strategy where you test yourself instead of passively rereading."),
            ("Spaced Repetition", "Reviewing information at increasing intervals to improve retention."),
            ("Feynman Technique", "Explaining a concept in simple terms to identify gaps in your understanding."),
            ("Pomodoro Technique", "Study method using 25-minute focused intervals followed by 5-minute breaks."),
            ("Cognitive Load", "The total amount of mental effort being used in the working memory.")
        ]
        q_and_a = [
            ("What is active recall?", "Active recall involves testing your memory by retrieving information rather than passively rereading textbooks. It strengthens neural connections."),
            ("How does spaced repetition work?", "It leverages the spacing effect: information is reviewed at expanding intervals (e.g., 1 day, 3 days, 1 week, 1 month) to combat the forgetting curve."),
            ("What is the Feynman Technique?", "It is a learning framework where you explain a complex concept in plain English as if teaching a child, highlighting details you don't fully understand.")
        ]

    if tool_type == "summary":
        return f"# Summary: {topic}\n\nThis material covers fundamental concepts of **{topic}** and highlights key scientific or pedagogical principles. Active learning strategies like retrieval practice are crucial for mastering these topics.\n\n## Key Takeaways\n" + "\n".join([f"- **{title}**: {desc}" for title, desc in facts])

    elif tool_type == "report":
        report_sections = [
            f"# Comprehensive Report on {topic}\n",
            "## Executive Summary",
            f"This detailed research report synthesizes current understanding of {topic}, examining its history, core mechanisms, applications, and educational implications.",
            "## Detailed Analysis of Core Pillars"
        ]
        for title, desc in facts:
            report_sections.append(f"### {title}\n{desc} Research shows that understanding {title.lower()} is essential to mastering {topic}. Practically, this has major applications in scientific fields and technology development.")
        
        report_sections.append("## Conclusion & Strategic Recommendations")
        report_sections.append(f"Mastering {topic} requires iterative study, interactive visual tools (such as memory maps), and continuous self-assessment. Future study sessions should prioritize active testing of these specific pillars.")
        return "\n\n".join(report_sections)

    elif tool_type == "quiz":
        quiz_list = []
        for i, (title, desc) in enumerate(facts):
            opts = [desc, "A type of cognitive bias related to learning.", "A technique developed in the early 19th century.", "An obsolete theory discredited by modern research."]
            # Shuffle options deterministically
            opts_shuffled = sorted(opts, key=lambda x: len(x))
            correct_letter = chr(65 + opts_shuffled.index(desc)) # A, B, C, or D
            quiz_list.append({
                "question": f"Which of the following best describes the concept of '{title}' in the context of {topic}?",
                "options": opts_shuffled,
                "answer": correct_letter,
                "explanation": f"Correct answer is {correct_letter}. {desc}"
            })
        return {"quiz": quiz_list}

    elif tool_type == "flashcards":
        return {
            "flashcards": [{"front": f"What is {title} in {topic}?", "back": desc} for title, desc in facts]
        }

    elif tool_type == "slides":
        slides_list = [
            {
                "title": f"Introduction to {topic}",
                "bullets": [
                    f"Overview of core structures in {topic}",
                    "Understanding fundamental definitions",
                    "Practical applications in academia and industry"
                ],
                "visualCue": f"A title slide with a sleek, minimalist diagram representing {topic}."
            }
        ]
        for title, desc in facts:
            slides_list.append({
                "title": title,
                "bullets": [
                    desc,
                    "Key underlying mechanics and components",
                    "Common misconceptions and clarifications"
                ],
                "visualCue": f"An illustration showing the process of {title} in detail."
            })
        return {"slides": slides_list}

    elif tool_type == "infographic":
        items = []
        for idx, (title, desc) in enumerate(facts):
            items.append({
                "label": title,
                "value": f"0{idx+1}",
                "description": desc
            })
        return {
            "infographics": [
                {
                    "title": f"Key Pillars of {topic}",
                    "type": "process",
                    "items": items
                }
            ]
        }

    elif tool_type == "mindmap":
        children = []
        for title, desc in facts:
            children.append({
                "name": title,
                "children": [{"name": desc[:30] + "..."}]
            })
        return {
            "name": topic,
            "children": children
        }

    elif tool_type == "datatable":
        rows = []
        for idx, (title, desc) in enumerate(facts):
            rows.append([f"Pillar-{idx+1}", title, desc, "High Significance"])
        return {
            "headers": ["Index", "Core Concept", "Description", "Priority / Impact"],
            "rows": rows
        }

    # Q&A Fallback
    return f"I've searched your workspace items regarding **{topic}**:\n\n" + "\n\n".join([f"**Q: {q}**\n*A: {a}*" for q, a in q_and_a])


# ----------------- Main Interface Functions -----------------

def get_summary(content: str) -> str:
    if not GEMINI_KEY:
        return generate_mock_data("summary", content)
    
    prompt = f"Summarize the following text in clean Markdown format with a title, executive overview, and key bullet points:\n\n{content}"
    return query_gemini(prompt)

def get_report(content: str) -> str:
    if not GEMINI_KEY:
        return generate_mock_data("report", content)
        
    prompt = f"Create a comprehensive, academic-style research report in Markdown based on the following content. Include sections like Executive Summary, In-Depth Analysis, Structural Breakdown, and Conclusion:\n\n{content}"
    return query_gemini(prompt)

def get_quiz(content: str) -> dict:
    if not GEMINI_KEY:
        return generate_mock_data("quiz", content)
        
    prompt = """Based on the text below, generate 5 multiple-choice questions. 
    Respond ONLY with a JSON object containing a "quiz" key, which is a list of question objects. 
    Each question object must have: "question" (string), "options" (list of 4 strings), "answer" (string like "A", "B", "C", "D"), and "explanation" (string explaining why it is correct).
    Do not wrap in markdown quotes.
    
    Text:
    """ + content
    
    try:
        response_text = query_gemini(prompt, json_mode=True)
        # Parse it
        return json.loads(response_text)
    except Exception as e:
        print(f"Error parsing Gemini quiz JSON: {e}. Fallback to mock.")
        return generate_mock_data("quiz", content)

def get_flashcards(content: str) -> dict:
    if not GEMINI_KEY:
        return generate_mock_data("flashcards", content)
        
    prompt = """Based on the text below, generate 5 flashcards for active recall.
    Respond ONLY with a JSON object containing a "flashcards" key, which is a list of card objects.
    Each card object must have: "front" (the question/concept, string) and "back" (the answer/explanation, string).
    Do not wrap in markdown quotes.
    
    Text:
    """ + content
    
    try:
        response_text = query_gemini(prompt, json_mode=True)
        return json.loads(response_text)
    except Exception as e:
        print(f"Error parsing Gemini flashcards JSON: {e}. Fallback to mock.")
        return generate_mock_data("flashcards", content)

def get_slides(content: str) -> dict:
    # Use Claude for visual schemas if possible, else Gemini
    use_claude = bool(CLAUDE_KEY)
    
    prompt = """Based on the text below, generate a 5-slide deck presentation structure.
    Respond ONLY with a JSON object containing a "slides" key, which is a list of slide objects.
    Each slide object must have: "title" (string), "bullets" (list of 3 strings), and "visualCue" (a string description of what graphics/illustrations should accompany this slide).
    Do not wrap in markdown quotes.
    
    Text:
    """ + content

    if use_claude:
        try:
            response_text = query_claude(prompt, system_prompt="You are a graphic design and presentation expert. Output ONLY valid JSON.")
            # Strip markdown quotes if any
            clean_json = re.sub(r"```json|```", "", response_text).strip()
            return json.loads(clean_json)
        except Exception as e:
            print(f"Claude slide generation failed: {e}. Falling back to Gemini.")
    
    if GEMINI_KEY:
        try:
            response_text = query_gemini(prompt, json_mode=True)
            return json.loads(response_text)
        except Exception as e:
            print(f"Gemini slide generation failed: {e}. Fallback to mock.")
            
    return generate_mock_data("slides", content)

def get_infographic(content: str) -> dict:
    use_claude = bool(CLAUDE_KEY)
    prompt = """Based on the text below, extract the key steps, metrics, or comparative timeline to build a visual infographic.
    Respond ONLY with a JSON object containing an "infographics" key, which is a list of infographic segments.
    Each segment must have: "title" (string), "type" (string, either "stat", "timeline", "process", or "key-value"), and "items" (list of items).
    Each item in "items" must have: "label" (string), "value" (string, e.g. a stat number or stage number like "01", "50%"), and "description" (string details).
    Do not wrap in markdown quotes.
    
    Text:
    """ + content

    if use_claude:
        try:
            response_text = query_claude(prompt, system_prompt="You are an expert information designer. Output ONLY valid JSON matching the schema.")
            clean_json = re.sub(r"```json|```", "", response_text).strip()
            return json.loads(clean_json)
        except Exception as e:
            print(f"Claude infographic failed: {e}. Falling back to Gemini.")
            
    if GEMINI_KEY:
        try:
            response_text = query_gemini(prompt, json_mode=True)
            return json.loads(response_text)
        except Exception as e:
            print(f"Gemini infographic failed: {e}. Fallback to mock.")
            
    return generate_mock_data("infographic", content)

def get_mindmap(content: str) -> dict:
    if not GEMINI_KEY:
        return generate_mock_data("mindmap", content)
        
    prompt = """Based on the text below, build a hierarchical mind map structure.
    Respond ONLY with a JSON tree representing the hierarchical nodes.
    The schema is: {"name": "Root Concept", "children": [{"name": "Sub-Concept 1", "children": [...]}, {"name": "Sub-Concept 2"}]}.
    Limit hierarchy to 3 levels deep and max 4 children per node.
    Do not wrap in markdown quotes.
    
    Text:
    """ + content
    
    try:
        response_text = query_gemini(prompt, json_mode=True)
        return json.loads(response_text)
    except Exception as e:
        print(f"Error parsing Gemini mindmap JSON: {e}. Fallback to mock.")
        return generate_mock_data("mindmap", content)

def get_data_table(content: str) -> dict:
    if not GEMINI_KEY:
        return generate_mock_data("datatable", content)
        
    prompt = """Identify structured data, parameters, values, classifications or metrics in the text below, and organize them into a clean comparison table.
    Respond ONLY with a JSON object containing "headers" (list of strings) and "rows" (list of lists, where each list is a row of strings).
    Do not wrap in markdown quotes.
    
    Text:
    """ + content
    
    try:
        response_text = query_gemini(prompt, json_mode=True)
        return json.loads(response_text)
    except Exception as e:
        print(f"Error parsing Gemini data table JSON: {e}. Fallback to mock.")
        return generate_mock_data("datatable", content)

def ask_question(content: str, history: list, question: str) -> str:
    if not GEMINI_KEY:
        return generate_mock_data("qa", content) + f"\n\n*(Mock Answer to: \"{question}\")*"
        
    # Build prompt with history
    history_str = ""
    for turn in history:
        role = "User" if turn["role"] == "user" else "Assistant"
        history_str += f"{role}: {turn['content']}\n"
        
    prompt = f"""You are an advanced reasoning study assistant. Answer the user's question accurately using ONLY the provided reference documents below.
    If the answer cannot be derived from the documents, explain that you are answering from general knowledge but note the limitation.
    
    Reference Documents Content:
    {content}
    
    Conversation History:
    {history_str}
    
    User Question: {question}
    
    Answer (in clean Markdown format):"""
    
    try:
        return query_gemini(prompt)
    except Exception as e:
        return f"Error executing Q&A search: {e}"
