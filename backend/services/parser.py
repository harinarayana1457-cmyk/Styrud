import re
from pypdf import PdfReader

def parse_pdf(file_path: str) -> str:
    """Extracts text from a PDF file."""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error parsing PDF {file_path}: {e}")
        return ""

def parse_text(file_path: str) -> str:
    """Extracts text from a plain text file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()
    except Exception as e:
        print(f"Error parsing text file {file_path}: {e}")
        return ""

def clean_text(text: str) -> str:
    """Cleans up whitespaces and redundant newlines."""
    # Replace multiple spaces with a single space
    text = re.sub(r"[ \t]+", " ", text)
    # Replace more than two newlines with double newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    """Splits text into chunks of roughly chunk_size characters with overlap."""
    if not text:
        return []
    
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0
    
    for word in words:
        current_chunk.append(word)
        current_length += len(word) + 1 # +1 for space
        
        if current_length >= chunk_size:
            chunks.append(" ".join(current_chunk))
            # Keep overlap: back up by sliding window
            overlap_words = current_chunk[-max(1, int(len(current_chunk) * (chunk_overlap / chunk_size))):]
            current_chunk = overlap_words
            current_length = sum(len(w) + 1 for w in current_chunk)
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return chunks
