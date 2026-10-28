import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, ProgressRecord, WorkoutLog
from app.schemas.schemas import ProgressRecordCreate, ProgressAnalyticsResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/progress", tags=["Progress Analytics"])

@router.get("/analytics", response_model=ProgressAnalyticsResponse)
def get_progress_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id
    ).order_by(ProgressRecord.recorded_at.asc()).all()

    weight_history = []
    strength_history = []
    volume_history = []
    max_bench = 0.0
    max_squat = 0.0
    max_deadlift = 0.0
    best_5k = None

    for r in records:
        d_str = r.recorded_at.strftime("%b %d")
        weight_history.append({"date": d_str, "weight": r.weight_kg})
        volume_history.append({"date": d_str, "volume": r.volume_kg})

        try:
            e1rm = json.loads(r.estimated_1rm) if isinstance(r.estimated_1rm, str) else r.estimated_1rm
        except Exception:
            e1rm = {}

        bench = e1rm.get("Bench Press") or e1rm.get("Flat Dumbbell Press", 0)
        squat = e1rm.get("Squat") or e1rm.get("Barbell Back Squat", 0)
        deadlift = e1rm.get("Deadlift") or e1rm.get("Barbell Romanian Deadlift", 0)

        if bench > max_bench: max_bench = bench
        if squat > max_squat: max_squat = squat
        if deadlift > max_deadlift: max_deadlift = deadlift

        if r.running_5k_mins:
            if best_5k is None or r.running_5k_mins < best_5k:
                best_5k = r.running_5k_mins

        strength_history.append({
            "date": d_str,
            "bench": round(bench, 1),
            "squat": round(squat, 1),
            "deadlift": round(deadlift, 1)
        })

    # Also inspect actual WorkoutLogs for real PR calculations
    workout_logs = db.query(WorkoutLog).filter(WorkoutLog.user_id == current_user.id).all()
    total_logs = len(workout_logs)
    for wl in workout_logs:
        try:
            w_list = json.loads(wl.weight_kg) if isinstance(wl.weight_kg, str) else wl.weight_kg
            r_list = json.loads(wl.reps_completed) if isinstance(wl.reps_completed, str) else wl.reps_completed
            if w_list and r_list:
                m_w = max(float(x) for x in w_list)
                m_r = max(float(x) for x in r_list)
                calc_1rm = m_w * (1.0 + m_r / 30.0)
                name_l = wl.exercise_name.lower()
                if "bench" in name_l or "press" in name_l:
                    if calc_1rm > max_bench: max_bench = calc_1rm
                elif "squat" in name_l:
                    if calc_1rm > max_squat: max_squat = calc_1rm
                elif "deadlift" in name_l or "rdl" in name_l:
                    if calc_1rm > max_deadlift: max_deadlift = calc_1rm
        except Exception:
            pass

    # Consistency rate based on actual workout frequency
    consistency_rate = round(min((total_logs / 4.0) * 100.0, 100.0), 1) if total_logs > 0 else (92.5 if current_user.is_demo else 0.0)

    # Return real stored PR values or honest None/empty for new users without records
    bench_val = round(max_bench, 1) if max_bench > 0 else (80.0 if current_user.is_demo else None)
    squat_val = round(max_squat, 1) if max_squat > 0 else (115.0 if current_user.is_demo else None)
    deadlift_val = round(max_deadlift, 1) if max_deadlift > 0 else (140.0 if current_user.is_demo else None)
    run_5k_val = f"{int(best_5k)}:{int((best_5k % 1) * 60):02d}" if best_5k else ("24:15" if current_user.is_demo else None)

    return {
        "weight_history": weight_history,
        "strength_history": strength_history,
        "volume_history": volume_history,
        "consistency_rate": consistency_rate,
        "total_workouts_completed": total_logs,
        "personal_records": {
            "bench_press_1rm": bench_val,
            "squat_1rm": squat_val,
            "deadlift_1rm": deadlift_val,
            "running_5k_mins": run_5k_val
        }
    }

@router.post("/record")
def add_progress_record(
    rec_in: ProgressRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    est_1rm = {}
    if rec_in.bench_press_1rm:
        est_1rm["Bench Press"] = rec_in.bench_press_1rm
    if rec_in.squat_1rm:
        est_1rm["Squat"] = rec_in.squat_1rm
    if rec_in.deadlift_1rm:
        est_1rm["Deadlift"] = rec_in.deadlift_1rm

    new_rec = ProgressRecord(
        user_id=current_user.id,
        recorded_at=datetime.datetime.utcnow(),
        weight_kg=rec_in.weight_kg,
        estimated_1rm=json.dumps(est_1rm),
        volume_kg=0.0,
        running_5k_mins=rec_in.running_5k_mins,
        consistency_score=94.0,
        notes=rec_in.notes or ""
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)

    return {"status": "success", "record_id": new_rec.id}

@router.get("/records")
def get_user_progress_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id
    ).order_by(ProgressRecord.recorded_at.desc()).limit(30).all()

    result = []
    for r in records:
        try:
            e1rm = json.loads(r.estimated_1rm) if isinstance(r.estimated_1rm, str) else (r.estimated_1rm or {})
        except Exception:
            e1rm = {}
        result.append({
            "id": r.id,
            "recorded_at": r.recorded_at.strftime("%Y-%m-%d %H:%M"),
            "date": r.recorded_at.strftime("%b %d, %Y"),
            "weight_kg": r.weight_kg,
            "estimated_1rm": e1rm,
            "running_5k_mins": r.running_5k_mins,
            "notes": r.notes or ""
        })
    return result

@router.delete("/record/{record_id}")
def delete_progress_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(ProgressRecord).filter(
        ProgressRecord.id == record_id,
        ProgressRecord.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Progress record not found")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": "Record deleted"}

