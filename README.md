# Styrud: Premium NotebookLM + Recall Study Workspace

**Styrud** is a premium, macOS-inspired study workspace combining the multi-speaker research synthesis of Google's **NotebookLM** with the force-directed semantic clustering map of **Recall**. Built on a React (TypeScript) + Vite frontend and a FastAPI backend, Styrud transforms your PDFs, text files, and link bookmarks into a customized, animated visual study galaxy.


---

## 🚀 Key Features

### 1. Resizable Multi-Pane Interface
- **Fluid Panel Dragging**: Drag the glowing separator bars to resize the Left Sidebar (Lime Glow) and Right Reasoning Assistant (Purple Glow) to fit your screen.
- **Glassmorphism Panels**: Ultra-dark surfaces (`#0B0B0C` canvas, `#141416` panels) with delicate translucent borders (`rgba(255, 255, 255, 0.08)`) and thin scrollbars.

### 2. Framer Motion Magnification Dock
- **macOS-Style Deck**: A floating bottom navigation deck utilizing spring physics for fluid magnification scaling on hover.
- **Visual Color Sync**: Dock circles are styled with custom bubble gradients matching their active visualizer cards.
- **Capsule Tooltips**: Elegant floating label badges rendered in the custom *Bagnard Sans* font.

### 3. Visual Study Visualizers
- **Audio Overview**: Multi-speaker podcaster briefings synthesized in 10 Indian regional languages (English, Hindi, Bengali, Gujarati, Kannada, Marathi, Malayalam, Punjabi, Tamil, Telugu).
- **Video Overview**: Animated slideshow reader linking active bullet points to the synchronized speech audio.
- **Recall Cluster Graph**: A pitch-black 2D force-directed canvas displaying document nodes as radial 3D glossy bubbles connected by similarity edges.
- **Mind Map**: Bouncy hierarchical logic trees with expandable nodes.
- **Reports**: Synthesized markdown study briefs with clean formatting.
- **Flashcards**: Flipping study cards with mastery metrics tracking slides.
- **Quiz**: Multiple-choice evaluations with detailed reasoning explanations and glowing status overlays.
- **Infographic**: Structured process timelines and statistical grid summaries.
- **Data Table**: Parameter matrices extracting key factors for comparative reviews.

### 4. Dual-Mode Backend
- **Key-Driven Mode**: Full logic generation using the Google Gemini Developer API (Reasoning & Audio synthesis) and Anthropic Claude (Visual structuring).
- **Seeded Mock Mode**: If API credentials are not set, the application launches with seeded biology and physics topics to ensure immediate testability.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React (v18), Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: FastAPI (Python), Uvicorn, gTTS (Google Text-to-Speech).
- **Clustering Logic**: Hand-written pure Python TF-IDF and K-Means algorithms, ensuring 100% compatibility with Python 3.14+ without relying on compiler-dependent packages.

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Secure Credentials Management

Styrud manages API keys securely in accordance with the safe credentials protocol:
- Input keys through the **Model Credentials Config** modal (opens automatically on startup if missing, or by clicking the **Model Config** panel in the bottom-left sidebar).
- Keys are written to the root `.env` file, which is excluded from remote version tracking via `.gitignore`.
- Keys are hot-reloaded in FastAPI memory immediately without service restarts.

---

## 📝 License
Licensed under the [SIL Open Font License (OFL)](https://github.com/sebsan/Bagnard-Sans/blob/master/OFL.txt) (Bagnard Sans Typography) and open-source standards.
