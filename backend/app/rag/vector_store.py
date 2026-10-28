import re
import math
from typing import List, Dict, Any, Optional
from app.rag.knowledge_corpus import DOCUMENTS

STOP_WORDS = {
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were', 'been',
    'have', 'has', 'had', 'what', 'which', 'who', 'whom', 'whose', 'when', 'where',
    'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'into', 'onto',
    'about', 'above', 'again', 'also', 'then', 'there', 'their', 'they', 'them',
    'these', 'those', 'you', 'your', 'yours', 'she', 'her', 'hers', 'him', 'his', 'our', 'ours',
    'does', 'did', 'doing', 'would', 'could', 'might'
}

class Chunk:
    def __init__(self, doc_id: str, title: str, category: str, text: str, chunk_index: int):
        self.doc_id = doc_id
        self.title = title
        self.category = category
        self.text = text.strip()
        self.chunk_index = chunk_index
        self.vector: Dict[str, float] = {}

class LocalVectorStore:
    def __init__(self):
        self.chunks: List[Chunk] = []
        self.idf: Dict[str, float] = {}
        self.vocabulary: set = set()
        self.is_initialized = False

    def _tokenize(self, text: str) -> List[str]:
        """Convert text to normalized tokens and bigrams for semantic keyword capture, filtering stop words."""
        clean = re.sub(r'[^a-zA-Z0-9\s-]', ' ', text.lower())
        tokens = [w for w in clean.split() if len(w) > 2 and w not in STOP_WORDS]
        
        # generate word bigrams for compound terms (e.g. "progressive overload", "zone 2", "wall balls")
        bigrams = []
        for i in range(len(tokens) - 1):
            bigrams.append(f"{tokens[i]}_{tokens[i+1]}")
        return tokens + bigrams

    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
        """Split document text into structured paragraphs or overlapping chunks."""
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
        if not paragraphs:
            # fallback to fixed size
            chunks = []
            start = 0
            while start < len(text):
                end = min(start + chunk_size, len(text))
                chunks.append(text[start:end])
                start += chunk_size - overlap
            return chunks
        return paragraphs

    def build_index(self):
        """Index all knowledge base documents into vectorized chunks."""
        self.chunks = []
        raw_chunks: List[Chunk] = []

        for doc in DOCUMENTS:
            text_chunks = self._chunk_text(doc["text"])
            for idx, chunk_text in enumerate(text_chunks):
                chunk = Chunk(
                    doc_id=doc["id"],
                    title=doc["title"],
                    category=doc["category"],
                    text=chunk_text,
                    chunk_index=idx
                )
                raw_chunks.append(chunk)

        self.chunks = raw_chunks
        total_docs = len(self.chunks)
        if total_docs == 0:
            self.is_initialized = True
            return

        # Calculate Document Frequency (DF)
        doc_freq: Dict[str, int] = {}
        chunk_token_lists = []
        for chunk in self.chunks:
            tokens = self._tokenize(chunk.title + " " + chunk.category + " " + chunk.text)
            chunk_token_lists.append(tokens)
            unique_tokens = set(tokens)
            for t in unique_tokens:
                doc_freq[t] = doc_freq.get(t, 0) + 1
                self.vocabulary.add(t)

        # Calculate IDF with smoothing
        self.idf = {
            t: math.log((1 + total_docs) / (1 + df)) + 1.0
            for t, df in doc_freq.items()
        }

        # Vectorize each chunk and normalize to unit length
        for i, chunk in enumerate(self.chunks):
            tokens = chunk_token_lists[i]
            tf: Dict[str, float] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0.0) + 1.0

            # Title and category get additional semantic weight
            title_tokens = self._tokenize(chunk.title + " " + chunk.category)
            for t in title_tokens:
                tf[t] = tf.get(t, 0.0) + 2.5

            vector: Dict[str, float] = {}
            norm_sq = 0.0
            for t, count in tf.items():
                tfidf = (count / len(tokens)) * self.idf.get(t, 1.0)
                vector[t] = tfidf
                norm_sq += tfidf * tfidf

            norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
            chunk.vector = {t: val / norm for t, val in vector.items()}

        self.is_initialized = True

    def query(self, query_text: str, top_k: int = 4, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Perform semantic cosine similarity search against indexed vector chunks."""
        if not self.is_initialized:
            self.build_index()

        q_tokens = self._tokenize(query_text)
        if not q_tokens:
            return []

        q_tf: Dict[str, float] = {}
        for t in q_tokens:
            q_tf[t] = q_tf.get(t, 0.0) + 1.0

        q_vector: Dict[str, float] = {}
        norm_sq = 0.0
        for t, count in q_tf.items():
            if t in self.idf:
                tfidf = (count / len(q_tokens)) * self.idf[t]
                q_vector[t] = tfidf
                norm_sq += tfidf * tfidf

        if norm_sq == 0:
            # Query terms didn't match vocabulary or were out of domain
            return []

        q_norm = math.sqrt(norm_sq)
        normalized_q = {t: val / q_norm for t, val in q_vector.items()}

        scores = []
        for chunk in self.chunks:
            if category and chunk.category.lower() != category.lower():
                continue

            dot_product = 0.0
            for t, q_val in normalized_q.items():
                if t in chunk.vector:
                    dot_product += q_val * chunk.vector[t]

            # Require positive semantic similarity
            if dot_product >= 0.04:
                scores.append((dot_product, chunk))

        # Sort descending by cosine similarity
        scores.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, chunk in scores[:top_k]:
            results.append({
                "doc_id": chunk.doc_id,
                "title": chunk.title,
                "category": chunk.category,
                "text": chunk.text,
                "score": round(float(score), 4)
            })

        return results

# Singleton instance
vector_store = LocalVectorStore()
vector_store.build_index()
