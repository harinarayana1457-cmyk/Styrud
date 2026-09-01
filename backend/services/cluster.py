import math
import random
import re

# A standard short list of stop words
STOP_WORDS = {
    'the', 'a', 'and', 'of', 'to', 'in', 'is', 'that', 'it', 'for', 'on', 'with', 
    'as', 'at', 'by', 'an', 'be', 'this', 'are', 'from', 'or', 'was', 'were', 
    'but', 'not', 'he', 'she', 'they', 'we', 'you', 'i', 'our', 'their', 'his', 
    'her', 'which', 'who', 'has', 'have', 'had', 'been', 'about', 'can', 'will',
    'would', 'should', 'more', 'some', 'there', 'their'
}

def decompose_documents(documents: list[dict]) -> list[dict]:
    """If there are few documents, break them down into conceptual sections for a rich knowledge graph."""
    if len(documents) > 4:
        return documents
    
    concept_docs = []
    for doc in documents:
        lines = doc["text"].split("\n")
        current_title = doc["title"]
        current_chunk = []
        chunk_idx = 1
        
        for line in lines:
            stripped = line.strip()
            # Match section headers like "1. COURSE CONTENT:", "3. GENERATION OF COMPUTERS:"
            if stripped and re.match(r'^[0-9]+\.\s+[A-Z0-9\s\(\)\,\-\&]+:', stripped):
                if current_chunk:
                    chunk_text = "\n".join(current_chunk).strip()
                    if len(chunk_text) > 40:
                        concept_docs.append({
                            "id": f"{doc['id']}_sec_{chunk_idx}",
                            "title": current_title,
                            "text": chunk_text,
                            "parent_id": doc["id"]
                        })
                        chunk_idx += 1
                current_title = stripped.rstrip(":")
                current_chunk = [line]
            else:
                current_chunk.append(line)
                
        if current_chunk:
            chunk_text = "\n".join(current_chunk).strip()
            if len(chunk_text) > 40:
                concept_docs.append({
                    "id": f"{doc['id']}_sec_{chunk_idx}",
                    "title": current_title,
                    "text": chunk_text,
                    "parent_id": doc["id"]
                })
                
    return concept_docs if len(concept_docs) >= 3 else documents

def tokenize(text: str) -> list[str]:
    """Basic clean tokenization."""
    # Convert to lowercase and remove non-alphabetic chars
    words = []
    for word in text.lower().split():
        clean = ''.join(c for c in word if c.isalpha())
        if clean and clean not in STOP_WORDS:
            words.append(clean)
    return words

def compute_tfidf(documents: list[dict]) -> list[dict]:
    """
    Computes TF-IDF vector dict for each document:
    documents: [{"id": "...", "text": "..."}]
    returns list of tfidf dicts: [{"word": score}]
    """
    n_docs = len(documents)
    doc_tokens = [tokenize(doc["text"]) for doc in documents]
    
    # Vocabulary and document frequencies
    df = {}
    for tokens in doc_tokens:
        unique_tokens = set(tokens)
        for token in unique_tokens:
            df[token] = df.get(token, 0) + 1
            
    # Calculate IDF
    idf = {}
    for word, count in df.items():
        # Smooth IDF
        idf[word] = math.log((1 + n_docs) / (1 + count)) + 1
        
    # Calculate TF-IDF
    tfidf_vectors = []
    for tokens in doc_tokens:
        if not tokens:
            tfidf_vectors.append({})
            continue
            
        tf = {}
        for token in tokens:
            tf[token] = tf.get(token, 0) + 1
            
        vector = {}
        for word, count in tf.items():
            # Normalized term frequency
            term_freq = count / len(tokens)
            vector[word] = term_freq * idf[word]
            
        tfidf_vectors.append(vector)
        
    return tfidf_vectors

def cosine_similarity(v1: dict, v2: dict) -> float:
    """Calculates cosine similarity between two tfidf vector dicts."""
    # Intersection of words
    common_words = set(v1.keys()) & set(v2.keys())
    if not common_words:
        return 0.0
        
    dot_product = sum(v1[w] * v2[w] for w in common_words)
    
    sum_v1 = sum(val**2 for val in v1.values())
    sum_v2 = sum(val**2 for val in v2.values())
    
    if sum_v1 == 0 or sum_v2 == 0:
        return 0.0
        
    return dot_product / (math.sqrt(sum_v1) * math.sqrt(sum_v2))

def run_kmeans(vectors: list[dict], n_clusters: int = 3, max_iter: int = 10) -> tuple[list[int], dict]:
    """Runs a basic KMeans clustering on sparse dict vectors."""
    n_docs = len(vectors)
    if n_docs == 0:
        return [], {}
        
    n_clusters = min(n_clusters, n_docs)
    
    # Initialize random centroids by choosing document vectors
    random.seed(42)
    centroid_indices = random.sample(range(n_docs), n_clusters)
    centroids = [{**vectors[idx]} for idx in centroid_indices]
    
    assignments = [0] * n_docs
    
    for _ in range(max_iter):
        # 1. Assignment step
        for doc_idx, vec in enumerate(vectors):
            best_sim = -1.0
            best_cluster = 0
            for c_idx, centroid in enumerate(centroids):
                sim = cosine_similarity(vec, centroid)
                if sim > best_sim:
                    best_sim = sim
                    best_cluster = c_idx
            assignments[doc_idx] = best_cluster
            
        # 2. Update step: compute new centroids as vector average
        for c_idx in range(n_clusters):
            assigned_docs = [vectors[j] for j, label in enumerate(assignments) if label == c_idx]
            if not assigned_docs:
                continue
                
            new_centroid = {}
            for doc in assigned_docs:
                for word, val in doc.items():
                    new_centroid[word] = new_centroid.get(word, 0.0) + val
                    
            for word in new_centroid:
                new_centroid[word] /= len(assigned_docs)
                
            centroids[c_idx] = new_centroid
            
    # Generate cluster names from top centroid terms
    cluster_names = {}
    for c_idx, centroid in enumerate(centroids):
        # Sort terms by value
        sorted_terms = sorted(centroid.items(), key=lambda item: item[1], reverse=True)
        top_terms = [word for word, score in sorted_terms[:3]]
        if top_terms:
            cluster_names[c_idx] = " • ".join(top_terms).title()
        else:
            cluster_names[c_idx] = f"Cluster {c_idx + 1}"
            
    return assignments, cluster_names

def run_spring_layout(documents: list[dict], similarity_matrix: list[list[float]], iterations: int = 60) -> list[tuple[float, float]]:
    """Calculates 2D coordinates using a force-directed spring layout."""
    n = len(documents)
    
    # Initialize positions on a circle
    positions = []
    for i in range(n):
        angle = (2 * math.pi * i) / n if n > 1 else 0
        r = 120.0
        positions.append([r * math.cos(angle), r * math.sin(angle)])
        
    for _ in range(iterations):
        forces = [[0.0, 0.0] for _ in range(n)]
        
        # 1. Repulsion forces between ALL nodes (to keep them spaced)
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                dx = positions[i][0] - positions[j][0]
                dy = positions[i][1] - positions[j][1]
                dist_sq = dx**2 + dy**2
                dist = math.sqrt(dist_sq)
                if dist < 1.0:
                    dist = 1.0
                    
                # Repulsion magnitude
                f_rep = 2500.0 / dist
                forces[i][0] += (dx / dist) * f_rep
                forces[i][1] += (dy / dist) * f_rep
                
        # 2. Attraction forces between similar nodes (spring pulls them close)
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                sim = similarity_matrix[i][j]
                if sim > 0.05:
                    dx = positions[j][0] - positions[i][0]
                    dy = positions[j][1] - positions[i][1]
                    dist = math.sqrt(dx**2 + dy**2)
                    if dist < 1.0:
                        dist = 1.0
                    # Pull force proportional to similarity
                    f_att = sim * 0.15 * dist
                    forces[i][0] += (dx / dist) * f_att
                    forces[i][1] += (dy / dist) * f_att
                    
        # Update positions
        for i in range(n):
            # Limit maximum step size
            step_limit = 10.0
            fx = max(-step_limit, min(step_limit, forces[i][0]))
            fy = max(-step_limit, min(step_limit, forces[i][1]))
            positions[i][0] += fx
            positions[i][1] += fy
            
    return positions

def cluster_and_project(documents: list[dict], n_clusters: int = 4) -> dict:
    """
    Groups documents into clusters and projects them onto a 2D plane.
    pure Python implementation.
    """
    processed_docs = decompose_documents(documents)
    n = len(processed_docs)
    if n == 0:
        return {"nodes": [], "edges": [], "clusters": []}
        
    if n == 1:
        doc = processed_docs[0]
        return {
            "nodes": [{
                "id": doc["id"],
                "title": doc["title"],
                "x": 0.0,
                "y": 0.0,
                "cluster_id": 0,
                "cluster_label": "General Knowledge"
            }],
            "edges": [],
            "clusters": [{"id": 0, "label": "General Knowledge", "color": "#4F46E5"}]
        }
        
    # Calculate tfidf vectors
    vectors = compute_tfidf(processed_docs)
    
    # Compute similarity matrix
    similarity_matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i == j:
                similarity_matrix[i][j] = 1.0
            elif j > i:
                sim = cosine_similarity(vectors[i], vectors[j])
                similarity_matrix[i][j] = sim
                similarity_matrix[j][i] = sim
                
    # Run clustering
    actual_clusters = min(n_clusters, max(2, n // 2))
    assignments, cluster_labels = run_kmeans(vectors, n_clusters=actual_clusters)
    
    # Calculate layout positions
    positions = run_spring_layout(processed_docs, similarity_matrix)
    
    # Scale coordinates to fit viewbox nicely (approx -200 to 200)
    x_coords = [p[0] for p in positions]
    y_coords = [p[1] for p in positions]
    
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)
    
    x_span = max_x - min_x
    y_span = max_y - min_y
    
    nodes = []
    colors = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"]
    
    for idx, doc in enumerate(processed_docs):
        # Normalize and center
        x = ((x_coords[idx] - min_x) / x_span * 400 - 200) if x_span > 1 else x_coords[idx]
        y = ((y_coords[idx] - min_y) / y_span * 400 - 200) if y_span > 1 else y_coords[idx]
        
        c_id = assignments[idx]
        nodes.append({
            "id": doc.get("parent_id", doc["id"]),
            "node_id": doc["id"],
            "title": doc["title"],
            "x": float(x),
            "y": float(y),
            "cluster_id": int(c_id),
            "cluster_label": cluster_labels.get(c_id, f"Cluster {c_id + 1}")
        })
        
    # Generate edges list
    edges = []
    edge_idx = 0
    for i in range(n):
        for j in range(i + 1, n):
            sim = similarity_matrix[i][j]
            if sim > 0.08: # Threshold to form a link
                edges.append({
                    "id": f"edge_{edge_idx}",
                    "source": processed_docs[i]["id"],
                    "target": processed_docs[j]["id"],
                    "similarity": float(sim)
                })
                edge_idx += 1
                
    # Format clusters list
    unique_cluster_ids = set(assignments)
    clusters = []
    for c_id in sorted(unique_cluster_ids):
        clusters.append({
            "id": int(c_id),
            "label": cluster_labels.get(c_id, f"Cluster {c_id + 1}"),
            "color": colors[c_id % len(colors)]
        })
        
    return {
        "nodes": nodes,
        "edges": edges,
        "clusters": clusters
    }
