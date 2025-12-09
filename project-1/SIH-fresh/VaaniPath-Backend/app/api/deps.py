from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.config import settings
from app.db.supabase_client import supabase

security = HTTPBearer(auto_error=False)


import time

# ... imports ...

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Validate JWT token and return current user
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        
        if user_id is None or not isinstance(user_id, str):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        
        # If Supabase is not configured, return mock user
        if supabase is None:
            return {
                "id": user_id,
                "email": "mock@user.com",
                "full_name": "Mock User",
                "is_admin": True  # Mock user is admin for testing
            }
        
        # Get user from Supabase with Retry Logic for Windows socket errors
        retries = 3
        response = None
        last_exception = None
        
        for attempt in range(retries):
            try:
                response = supabase.table("users").select("*").eq("id", user_id).execute()
                break # Success
            except Exception as e:
                last_exception = e
                if attempt < retries - 1:
                    time.sleep(0.1) # Wait briefly before retry
                else:
                    print(f"Supabase auth failed after {retries} retries: {e}")
        
        if not response:
             # If we exhausted retries and have an exception, re-raise or handle
             if last_exception:
                 # Check if it looks like a connection error, otherwise 500
                 print(f"Auth Error Details: {last_exception}")
                 raise HTTPException(status_code=500, detail="Authentication service unavailable")
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        user_data = response.data[0]
        
        # Return only safe, serializable fields
        return {
            "id": user_data.get("id"),
            "email": user_data.get("email"),
            "full_name": user_data.get("full_name"),
            "is_admin": user_data.get("is_admin", False),
            "is_teacher": user_data.get("is_teacher", False),
            "avatar_url": user_data.get("avatar_url"),
            "contact_number": user_data.get("contact_number"),
            "qualification": user_data.get("qualification"),
            "specialization": user_data.get("specialization"),
            "domain_expertise": user_data.get("domain_expertise"),
            "bio": user_data.get("bio"),
            "preferred_language": user_data.get("preferred_language", "en"),
            "created_at": str(user_data.get("created_at")) if user_data.get("created_at") else None
        }
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


async def get_current_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Check if current user is admin
    """
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user


async def get_current_teacher(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Check if current user is admin or teacher (tutor)
    Allows both admins and teachers to access endpoints
    """
    if not (current_user.get("is_admin", False) or current_user.get("is_teacher", False)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher or admin access required"
        )
    
    return current_user


async def get_current_tutor_only(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Check if current user is a teacher (tutor only, not admin)
    Used for tutor-specific endpoints
    """
    if not current_user.get("is_teacher", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher access required"
        )
    
    return current_user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    Get current user if token provided, otherwise return None
    """
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None
