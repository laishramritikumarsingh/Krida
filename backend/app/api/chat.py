import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, Profile, WorkoutLog, ChatMessage
from app.schemas.schemas import ChatRequest, ChatResponse, ChatMessageItem
from app.utils.auth import get_current_user
from app.rag.retriever import retrieve_fitness_knowledge
from app.ai.provider import llm_provider

router = APIRouter(prefix="/chat", tags=["AI Coach Chat"])

@router.post("", response_model=ChatResponse)
def chat_with_krida_ai(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate input length
    clean_msg = req.message.strip()
    if not clean_msg:
        raise HTTPException(status_code=400, detail="Chat message cannot be empty")
    if len(clean_msg) > 1500:
        raise HTTPException(status_code=400, detail="Message exceeds maximum allowed length (1500 characters)")

    # Rate limiting: max 20 messages in last 60 seconds per user
    one_min_ago = datetime.datetime.utcnow() - datetime.timedelta(seconds=60)
    recent_msg_count = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id,
        ChatMessage.role == "user",
        ChatMessage.created_at >= one_min_ago
    ).count()
    if recent_msg_count >= 20:
        raise HTTPException(
            status_code=429,
            detail="Rate limit reached: Maximum 20 coach messages per minute. Please wait a moment."
        )

    # 1. Fetch user profile context
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    profile_data = {}
    if profile:
        profile_data = {
            "age": profile.age,
            "gender": profile.gender,
            "fitness_level": profile.fitness_level,
            "primary_goal": profile.primary_goal,
            "training_experience": profile.training_experience,
            "available_equipment": json.loads(profile.available_equipment) if profile.available_equipment else ["Dumbbells"],
            "training_preference": profile.training_preference,
            "dietary_preference": profile.dietary_preference,
            "sports_interests": json.loads(profile.sports_interests) if profile.sports_interests else ["General Fitness"]
        }

    # 2. Fetch recent workout logs
    recent_logs = db.query(WorkoutLog).filter(
        WorkoutLog.user_id == current_user.id
    ).order_by(WorkoutLog.completed_at.desc()).limit(4).all()

    logs_context = []
    for l in recent_logs:
        logs_context.append({
            "exercise": l.exercise_name,
            "sets": l.sets_completed,
            "weights": l.weight_kg,
            "rpe": l.rpe
        })

    # 3. Retrieve relevant scientific documents using RAG vector search
    rag_chunks = retrieve_fitness_knowledge(req.message, top_k=3)

    # 4. Generate AI response (using LLM or intelligent sports science fallback)
    ai_result = llm_provider.generate_chat_response(
        user_message=req.message,
        user_profile=profile_data,
        rag_chunks=rag_chunks,
        recent_logs=logs_context
    )

    # 5. Persist to chat database
    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=req.message,
        sources="[]",
        created_at=datetime.datetime.utcnow()
    )
    db.add(user_msg)

    assistant_msg = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=ai_result["reply"],
        sources=json.dumps(ai_result["sources"]),
        created_at=datetime.datetime.utcnow()
    )
    db.add(assistant_msg)
    db.commit()

    return {
        "reply": ai_result["reply"],
        "sources": ai_result["sources"],
        "suggested_followups": ai_result.get("suggested_followups", [])
    }

@router.get("/history")
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc()).limit(50).all()

    results = []
    for m in messages:
        try:
            sources = json.loads(m.sources) if isinstance(m.sources, str) else m.sources
        except Exception:
            sources = []
        results.append({
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "sources": sources,
            "created_at": m.created_at.strftime("%H:%M")
        })

    return {"messages": results}

@router.delete("/history")
def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success", "message": "Chat history cleared."}
