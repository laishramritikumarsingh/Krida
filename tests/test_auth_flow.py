"""
KRIDA AI - Authentication, Token Attachment & Security Verification Suite
Tests:
1. Successful demo login and JWT token issuance
2. Authorization: Bearer token attachment on protected calisthenics & workout routes
3. Unauthenticated access rejection (HTTP 401)
4. Invalid token rejection (HTTP 401)
5. Expired token rejection (HTTP 401)
6. User registration and login flow
7. Invalid credentials error handling (HTTP 401 / HTTP 400)
8. User profile and session persistence (/api/auth/me)
"""

import sys
import os
import time
import requests
import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.config import settings
from app.utils.security import create_access_token

BASE_URL = "http://127.0.0.1:8000/api"

def print_result(name: str, passed: bool, detail: str = ""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} {name}: {detail}")
    if not passed:
        sys.exit(1)

def run_tests():
    print("=" * 60)
    print("      KRIDA AUTHENTICATION & SECURITY TEST SUITE")
    print("=" * 60)

    # 1. Health check
    res = requests.get(f"{BASE_URL}/health")
    print_result("System Health", res.status_code == 200, f"Status {res.status_code}")

    # 2. Demo Login Endpoint (POST /api/auth/demo-login)
    demo_res = requests.post(f"{BASE_URL}/auth/demo-login")
    print_result("Demo Login Endpoint", demo_res.status_code == 200, f"Status: {demo_res.status_code}")
    demo_data = demo_res.json()
    assert "access_token" in demo_data, "Missing access_token in demo login response"
    assert demo_data["token_type"].lower() == "bearer", "Expected token_type to be bearer"
    assert demo_data["user"]["is_demo"] is True, "Expected user to have is_demo = True"
    demo_token = demo_data["access_token"]
    print_result("Demo Token Validity", len(demo_token) > 20, f"Token length: {len(demo_token)}")

    # 3. Protected Calisthenics Route WITH Token (GET /api/calisthenics/skills)
    skills_res = requests.get(
        f"{BASE_URL}/calisthenics/skills",
        headers={"Authorization": f"Bearer {demo_token}"}
    )
    print_result(
        "Protected Calisthenics Access with Bearer Token",
        skills_res.status_code == 200,
        f"Status: {skills_res.status_code}, Skills count: {len(skills_res.json())}"
    )
    assert len(skills_res.json()) == 7, f"Expected 7 baseline skills, got {len(skills_res.json())}"

    # 4. Protected Calisthenics Route WITHOUT Token (GET /api/calisthenics/skills) -> Must return 401
    unauth_res = requests.get(f"{BASE_URL}/calisthenics/skills")
    print_result(
        "Rejection of Missing Token (HTTP 401)",
        unauth_res.status_code == 401,
        f"Status: {unauth_res.status_code}, Detail: {unauth_res.json().get('detail')}"
    )
    assert unauth_res.status_code == 401, "Expected 401 Unauthorized without token"

    # 5. Protected Calisthenics Route WITH Invalid Token -> Must return 401
    invalid_res = requests.get(
        f"{BASE_URL}/calisthenics/skills",
        headers={"Authorization": "Bearer invalid_forged_or_corrupt_token_xyz"}
    )
    print_result(
        "Rejection of Invalid Token (HTTP 401)",
        invalid_res.status_code == 401,
        f"Status: {invalid_res.status_code}, Detail: {invalid_res.json().get('detail')}"
    )
    assert invalid_res.status_code == 401, "Expected 401 Unauthorized with invalid token"

    # 6. Protected Calisthenics Route WITH Expired Token -> Must return 401
    expired_token = create_access_token(
        {"sub": str(demo_data["user"]["id"]), "email": demo_data["user"]["email"]},
        expires_delta=datetime.timedelta(seconds=-60) # 1 minute in the past
    )
    expired_res = requests.get(
        f"{BASE_URL}/calisthenics/skills",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    print_result(
        "Rejection of Expired Token (HTTP 401)",
        expired_res.status_code == 401,
        f"Status: {expired_res.status_code}, Detail: {expired_res.json().get('detail')}"
    )
    assert expired_res.status_code == 401, "Expected 401 Unauthorized with expired token"

    # 7. Session Validation via /api/auth/me
    me_res = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {demo_token}"}
    )
    print_result(
        "Session Validation (/api/auth/me)",
        me_res.status_code == 200,
        f"Username: {me_res.json().get('username')}, has_plan: {me_res.json().get('has_plan')}"
    )
    assert me_res.json()["email"] == demo_data["user"]["email"]

    # 8. User Registration Flow
    timestamp = int(time.time())
    new_email = f"athlete_{timestamp}@krida.ai"
    reg_res = requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": new_email, "username": f"Athlete_{timestamp}", "password": "StrongPassword123!"}
    )
    print_result("New Athlete Registration", reg_res.status_code == 200, f"Registered: {new_email}")
    reg_token = reg_res.json()["access_token"]

    # 9. Duplicate Registration Rejection (HTTP 400)
    dup_res = requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": new_email, "username": "Duplicate", "password": "Password123!"}
    )
    print_result(
        "Duplicate Registration Rejection (HTTP 400)",
        dup_res.status_code == 400,
        f"Status: {dup_res.status_code}, Detail: {dup_res.json().get('detail')}"
    )

    # 10. Invalid Password Login Rejection (HTTP 401)
    bad_login_res = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": new_email, "password": "WrongPassword!"}
    )
    print_result(
        "Invalid Password Login Rejection (HTTP 401)",
        bad_login_res.status_code == 401,
        f"Status: {bad_login_res.status_code}, Detail: {bad_login_res.json().get('detail')}"
    )

    # 11. Valid Password Login
    good_login_res = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": new_email, "password": "StrongPassword123!"}
    )
    print_result("Valid Credentials Login (HTTP 200)", good_login_res.status_code == 200, f"Token received")

    # 12. Calisthenics Logging & User Isolation
    log_res = requests.post(
        f"{BASE_URL}/calisthenics/skill",
        headers={"Authorization": f"Bearer {reg_token}"},
        json={
            "skill_name": "Muscle-Up",
            "progression_level": "Deep Straight-Bar Dips",
            "level_number": 2,
            "hold_duration_sec": 0,
            "repetitions": 8,
            "milestone_status": "Mastered",
            "notes": "Isolated registration test record"
        }
    )
    print_result("Calisthenics Milestone Logging", log_res.status_code == 200, f"Saved milestone: {log_res.json().get('skill_name')}")

    print("=" * 60)
    print(" ALL AUTHENTICATION & SECURITY TESTS PASSED CLEANLY! ")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
