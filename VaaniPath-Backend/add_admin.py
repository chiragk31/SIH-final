import traceback
try:
    import asyncio
    import sys
    from app.db.supabase_client import supabase
    from app.core.security import get_password_hash

    async def add_admin():
        email = "chirag@gmail.com"
        password = "123456"
        full_name = "Chirag Admin"
        
        hashed_password = get_password_hash(password)
        
        user_data = {
            "email": email,
            "full_name": full_name,
            "password_hash": hashed_password,
            "is_admin": True,
            "is_teacher": False,
        }
        
        # check if exists
        existing = supabase.table("users").select("*").eq("email", email).execute()
        if existing.data:
            print("User already exists!")
            return
            
        print("Inserting user...")
        response = supabase.table("users").insert(user_data).execute()
        print("Response:", response)

    asyncio.run(add_admin())
except Exception as e:
    with open("error_log.txt", "w", encoding="utf-8") as f:
        traceback.print_exc(file=f)
