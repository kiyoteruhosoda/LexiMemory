#!/usr/bin/env python3
"""
Clean up test users from users.json
"""
import json
import shutil
from pathlib import Path

def cleanup_test_users():
    data_dir = Path(__file__).parent.parent / "data"
    users_file = data_dir / "users" / "users.json"
    vault_dir = data_dir / "vault"
    
    if not users_file.exists():
        print("No users.json found")
        return
    
    # Read current users
    with open(users_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    original_count = len(data.get("users", []))
    
    # Filter out test users
    real_users = []
    removed_users = []
    
    for user in data.get("users", []):
        username = user.get("username", "")
        if username.startswith("testuser_"):
            removed_users.append(user)
            # Remove user vault directory
            user_id = user.get("userId")
            if user_id:
                vault_path = vault_dir / f"u_{user_id}"
                if vault_path.exists():
                    shutil.rmtree(vault_path)
                    print(f"Removed vault: {vault_path}")
        else:
            real_users.append(user)
    
    # Update users.json
    data["users"] = real_users
    
    with open(users_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Cleaned up {len(removed_users)} test users (from {original_count} to {len(real_users)})")
    for user in removed_users:
        print(f"  - {user.get('username')}")

if __name__ == "__main__":
    cleanup_test_users()
