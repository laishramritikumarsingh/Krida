import json
import urllib.request
import urllib.error
import time

BASE_URL = "http://127.0.0.1:8000/api"

def make_req(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as res:
            body = res.read().decode("utf-8")
            return res.getcode(), json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8")
            return e.code, json.loads(body) if body else {"error": str(e)}
        except Exception:
            return e.code, {"error": str(e)}
    except Exception as e:
        return 500, {"error": str(e)}

def run_isolation_tests():
    print("==================================================")
    print("      KRIDA MULTI-TENANT ISOLATION TEST SUITE     ")
    print("==================================================")
    
    ts = int(time.time())
    email_a = f"tenant_a_{ts}@krida.ai"
    email_b = f"tenant_b_{ts}@krida.ai"

    # 1. Register User A
    code_a, res_a = make_req("/auth/register", method="POST", data={
        "email": email_a,
        "username": "Athlete Alpha",
        "password": "Password123!"
    })
    assert code_a == 200, f"Failed to register User A: {res_a}"
    token_a = res_a["access_token"]
    user_a_id = res_a["user"]["id"]
    print(f"[OK] Registered User A (ID: {user_a_id}, Email: {email_a})")

    # 2. Register User B
    code_b, res_b = make_req("/auth/register", method="POST", data={
        "email": email_b,
        "username": "Athlete Beta",
        "password": "Password123!"
    })
    assert code_b == 200, f"Failed to register User B: {res_b}"
    token_b = res_b["access_token"]
    user_b_id = res_b["user"]["id"]
    print(f"[OK] Registered User B (ID: {user_b_id}, Email: {email_b})")

    # 3. User A creates private records across entities
    # 3a. Goal
    code_g, res_g = make_req("/goals", method="POST", data={
        "title": "Alpha Private Squat Target 200kg",
        "category": "strength",
        "current_value": 150.0,
        "target_value": 200.0,
        "unit": "kg",
        "deadline": "12 Weeks"
    }, token=token_a)
    assert code_g == 200 and "id" in res_g, f"Goal creation failed: {res_g}"
    goal_a_id = res_g["id"]

    # 3b. Nutrition Entry
    code_nut, res_nut = make_req("/nutrition/entry", method="POST", data={
        "food_name": "Alpha Private Protein Shake",
        "meal_type": "Snack",
        "quantity_servings": 2.0,
        "calories": 480.0,
        "protein_g": 50.0,
        "carbs_g": 10.0,
        "fat_g": 4.0,
        "logged_date": "2026-10-28"
    }, token=token_a)
    assert code_nut == 200 and "id" in res_nut, f"Nutrition entry failed: {res_nut}"
    nut_a_id = res_nut["id"]

    # 3c. Progress Record
    code_pr, res_pr = make_req("/progress/record", method="POST", data={
        "weight_kg": 85.5,
        "bench_press_1rm": 120.0,
        "notes": "Alpha secret notes"
    }, token=token_a)
    assert code_pr == 200 and "record_id" in res_pr, f"Progress record failed: {res_pr}"
    prog_a_id = res_pr["record_id"]

    # 3d. Workout Log
    code_wl, res_wl = make_req("/workouts/log", method="POST", data={
        "exercise_name": "Alpha Overhead Press",
        "sets_completed": 4,
        "weight_kg": [60.0, 60.0, 60.0, 60.0],
        "reps_completed": [8, 8, 8, 8],
        "notes": "Alpha session confidential",
        "rpe": 8.5
    }, token=token_a)
    assert code_wl == 200, f"Workout log failed: {res_wl}"

    # 3e. Chat message
    code_chat, res_chat = make_req("/chat", method="POST", data={
        "message": "Alpha private health question: how to treat mild knee patella stiffness?"
    }, token=token_a)
    assert code_chat == 200, f"Chat failed: {res_chat}"

    # 3f. HYROX session
    code_hy, res_hy = make_req("/hyrox/session", method="POST", data={
        "session_type": "Alpha Sled Test",
        "title": "Alpha 50m Heavy Sled",
        "distance_meters": 1000.0,
        "duration_seconds": 900,
        "rounds_completed": 2,
        "notes": "Alpha private HYROX session"
    }, token=token_a)
    assert code_hy == 200 and "id" in res_hy, f"HYROX session failed: {res_hy}"
    hyrox_a_id = res_hy["id"]

    print("[OK] User A created records in Goals, Nutrition, Progress, Workouts, Chat, and HYROX.")

    # 4. TEST USER B CANNOT ACCESS OR TAMPER WITH USER A'S DATA
    print("\n--- Testing Cross-Tenant Security & Isolation ---")

    # 4a. User B lists goals -> Goal A must NOT appear
    code_bg, res_bg = make_req("/goals", token=token_b)
    assert code_bg == 200
    goal_ids_b = [g["id"] for g in res_bg]
    assert goal_a_id not in goal_ids_b, f"LEAK: User B can see User A's goal: {res_bg}"
    print("[PASS] User B goal list does NOT contain User A's goal.")

    # 4b. User B tries to update User A's goal -> Must fail 404
    code_b_up, res_b_up = make_req(f"/goals/{goal_a_id}", method="PUT", data={
        "title": "Hacked Goal by User B"
    }, token=token_b)
    assert code_b_up == 404, f"SECURITY VIOLATION: User B modified User A's goal! Code: {code_b_up}"
    print("[PASS] User B cannot modify User A's goal (HTTP 404 returned).")

    # 4c. User B tries to delete User A's goal -> Must fail 404
    code_b_del, res_b_del = make_req(f"/goals/{goal_a_id}", method="DELETE", token=token_b)
    assert code_b_del == 404, f"SECURITY VIOLATION: User B deleted User A's goal! Code: {code_b_del}"
    print("[PASS] User B cannot delete User A's goal (HTTP 404 returned).")

    # 4d. User B tries to delete User A's nutrition entry -> Must fail 404
    code_b_nut_del, res_b_nut_del = make_req(f"/nutrition/entry/{nut_a_id}", method="DELETE", token=token_b)
    assert code_b_nut_del == 404, f"SECURITY VIOLATION: User B deleted User A's nutrition entry! Code: {code_b_nut_del}"
    print("[PASS] User B cannot delete User A's nutrition entry (HTTP 404 returned).")

    # 4e. User B tries to delete User A's progress record -> Must fail 404
    code_b_prog_del, res_b_prog_del = make_req(f"/progress/record/{prog_a_id}", method="DELETE", token=token_b)
    assert code_b_prog_del == 404, f"SECURITY VIOLATION: User B deleted User A's progress record! Code: {code_b_prog_del}"
    print("[PASS] User B cannot delete User A's progress record (HTTP 404 returned).")

    # 4f. User B requests chat history -> Must NOT see User A's messages
    code_b_chat, res_b_chat = make_req("/chat/history", token=token_b)
    assert code_b_chat == 200
    chat_contents = [m["content"] for m in res_b_chat.get("messages", [])]
    for c in chat_contents:
        assert "Alpha private health question" not in c, f"LEAK: User B saw User A's private chat: {c}"
    print("[PASS] User B chat history does NOT contain User A's conversation.")

    # 4g. User B requests workout history -> Must NOT see User A's workouts
    code_b_wh, res_b_wh = make_req("/workouts/history", token=token_b)
    assert code_b_wh == 200
    b_exercises = [l["exercise_name"] for l in res_b_wh.get("logs", [])]
    assert "Alpha Overhead Press" not in b_exercises, f"LEAK: User B saw User A's workout: {b_exercises}"
    print("[PASS] User B workout history does NOT contain User A's logs.")

    # 4h. User B requests reports summary -> Must reflect User B's metrics, not User A's
    code_b_rep, res_b_rep = make_req("/reports/summary", token=token_b)
    assert code_b_rep == 200
    assert res_b_rep["total_workouts_completed"] == 0, f"LEAK: User B summary counted User A's workouts: {res_b_rep}"
    print("[PASS] User B reports summary is strictly isolated (0 workouts vs User A's).")

    # 4i. User B requests HYROX sessions -> Must NOT see User A's session
    code_b_hy, res_b_hy = make_req("/hyrox/sessions", token=token_b)
    assert code_b_hy == 200
    hyrox_titles = [s["title"] for s in res_b_hy]
    assert "Alpha 50m Heavy Sled" not in hyrox_titles, f"LEAK: User B saw User A's HYROX session: {hyrox_titles}"
    print("[PASS] User B HYROX sessions list does NOT contain User A's session.")

    # 5. VERIFY USER A'S DATA PERSISTS INTACT
    print("\n--- Testing Data Persistence for User A ---")
    code_a_g, res_a_g = make_req("/goals", token=token_a)
    assert code_a_g == 200 and any(g["id"] == goal_a_id for g in res_a_g)
    print(f"[PASS] User A goal {goal_a_id} persisted cleanly.")

    code_a_wh, res_a_wh = make_req("/workouts/history", token=token_a)
    assert code_a_wh == 200 and any(l["exercise_name"] == "Alpha Overhead Press" for l in res_a_wh.get("logs", []))
    print("[PASS] User A workout log persisted cleanly.")

    print("\n==================================================")
    print(" ALL MULTI-TENANT ISOLATION TESTS PASSED CLEANLY! ")
    print("==================================================")

if __name__ == "__main__":
    run_isolation_tests()
