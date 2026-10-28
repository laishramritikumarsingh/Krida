import json
from typing import List, Dict, Any, Optional
from datetime import datetime

def calculate_estimated_1rm(weight_kg: float, reps: int) -> float:
    """Calculate estimated 1RM using the validated Epley formula."""
    if reps <= 0 or weight_kg <= 0:
        return 0.0
    if reps == 1:
        return weight_kg
    return round(weight_kg * (1.0 + reps / 30.0), 1)

def analyze_exercise_progression(
    exercise_name: str,
    recent_logs: List[Any]
) -> Optional[Dict[str, Any]]:
    """
    Analyzes historical workout logs for a given exercise to determine
    progressive overload recommendations or fatigue deload adaptations.
    """
    if not recent_logs or len(recent_logs) < 1:
        return None

    # Parse latest log
    latest_log = recent_logs[0]
    try:
        latest_reps = json.loads(latest_log.reps_completed) if isinstance(latest_log.reps_completed, str) else latest_log.reps_completed
        latest_weights = json.loads(latest_log.weight_kg) if isinstance(latest_log.weight_kg, str) else latest_log.weight_kg
    except Exception:
        latest_reps = [10, 10, 10]
        latest_weights = [20.0, 20.0, 20.0]

    if not latest_weights or not latest_reps:
        return None

    curr_avg_weight = sum(latest_weights) / len(latest_weights)
    curr_avg_reps = sum(latest_reps) / len(latest_reps)
    curr_1rm = calculate_estimated_1rm(curr_avg_weight, int(curr_avg_reps))

    # If only 1 log exists, baseline established
    if len(recent_logs) == 1:
        next_target = round(curr_avg_weight + (2.5 if curr_avg_weight >= 30 else 1.0), 1)
        return {
            "type": "overload",
            "title": f"Baseline Established: {exercise_name}",
            "message": f"Solid first session for {exercise_name}! You completed {curr_avg_weight:.1f} kg × {int(curr_avg_reps)} reps.",
            "why_explanation": f"To initiate neuromuscular adaptation via the size principle, KRIDA establishes your target for next session at {next_target:.1f} kg for 8–10 reps.",
            "next_weight_kg": next_target,
            "next_reps": "8-10",
            "delta_kg": next_target - curr_avg_weight,
            "status": "baseline"
        }

    # Compare with previous log
    prev_log = recent_logs[1]
    try:
        prev_reps = json.loads(prev_log.reps_completed) if isinstance(prev_log.reps_completed, str) else prev_log.reps_completed
        prev_weights = json.loads(prev_log.weight_kg) if isinstance(prev_log.weight_kg, str) else prev_log.weight_kg
    except Exception:
        prev_reps = [10, 10, 10]
        prev_weights = [curr_avg_weight - 2.5] * 3

    prev_avg_weight = sum(prev_weights) / len(prev_weights) if prev_weights else curr_avg_weight
    prev_avg_reps = sum(prev_reps) / len(prev_reps) if prev_reps else curr_avg_reps
    prev_1rm = calculate_estimated_1rm(prev_avg_weight, int(prev_avg_reps))

    # Assessment
    rpe = getattr(latest_log, 'rpe', 8.0) or 8.0

    # Case 1: Significant Improvement
    if curr_1rm > prev_1rm or (curr_avg_weight >= prev_avg_weight and curr_avg_reps >= prev_avg_reps):
        increment = 2.5 if curr_avg_weight >= 25 else 1.25
        next_weight = round(curr_avg_weight + increment, 1)
        return {
            "type": "overload",
            "title": f"Progressive Overload Triggered: {exercise_name}",
            "message": (
                f"Your {exercise_name} improved from {prev_avg_weight:.1f} kg × {int(prev_avg_reps)} reps "
                f"to {curr_avg_weight:.1f} kg × {int(curr_avg_reps)} reps. "
                f"KRIDA recommends increasing your target load to {next_weight:.1f} kg × 8–10 reps."
            ),
            "why_explanation": (
                f"Adaptive Progressive Overload: You satisfied the double-progression threshold with stable exertion (RPE {rpe:.1f}). "
                f"Increasing the external load by {increment:.1f} kg stimulates greater high-threshold motor unit recruitment and mechanical tension."
            ),
            "next_weight_kg": next_weight,
            "next_reps": "8-10",
            "delta_kg": increment,
            "status": "increased"
        }

    # Case 2: Fatigue or Performance Drop
    elif curr_1rm < prev_1rm * 0.90 or rpe >= 9.5:
        reduced_weight = round(max(prev_avg_weight * 0.85, 5.0), 1)
        return {
            "type": "recovery",
            "title": f"Adaptive Volume Adjustment: {exercise_name}",
            "message": (
                f"Your performance on {exercise_name} decreased from {prev_avg_weight:.1f} kg to {curr_avg_weight:.1f} kg "
                f"(high exertion RPE {rpe:.1f}). KRIDA recommends temporary volume reduction to {reduced_weight:.1f} kg."
            ),
            "why_explanation": (
                "Fatigue Management: High sympathetic nervous fatigue impairs force production. Reducing load by ~15% for one microcycle "
                "allows muscular supercompensation without accumulating systemic overtraining."
            ),
            "next_weight_kg": reduced_weight,
            "next_reps": "10-12 (controlled tempo)",
            "delta_kg": reduced_weight - curr_avg_weight,
            "status": "deload"
        }

    # Case 3: Consolidation
    else:
        return {
            "type": "overload",
            "title": f"Load Consolidation: {exercise_name}",
            "message": f"Solid execution at {curr_avg_weight:.1f} kg. Keep the same weight and aim for 1 additional repetition next session.",
            "why_explanation": (
                "Density & Rep Progression: Before stepping up external load, mastering the top end of the rep bracket (10–12 reps) "
                "reinforces tendon remodeling and motor pattern stability."
            ),
            "next_weight_kg": curr_avg_weight,
            "next_reps": f"{int(curr_avg_reps) + 1}",
            "delta_kg": 0.0,
            "status": "consolidate"
        }
