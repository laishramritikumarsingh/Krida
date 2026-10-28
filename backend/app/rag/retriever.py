from typing import List, Dict, Any, Optional
from app.rag.vector_store import vector_store

def retrieve_fitness_knowledge(query: str, top_k: int = 3, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    RAG Retrieval Pipeline step:
    Extracts semantic nearest neighbor fitness documents matching the user query or context.
    """
    results = vector_store.query(query_text=query, top_k=top_k, category=category)
    return results

def format_rag_context(chunks: List[Dict[str, Any]]) -> str:
    """Format retrieved knowledge chunks into structured prompt context with citations."""
    if not chunks:
        return "No specific research documents retrieved. Use foundational exercise physiology principles."
    
    context_lines = []
    for idx, c in enumerate(chunks, 1):
        context_lines.append(
            f"--- [Knowledge Source {idx}: {c['title']} | Category: {c['category']} (Relevance Score: {c['score']})] ---\n"
            f"{c['text']}\n"
        )
    return "\n".join(context_lines)
