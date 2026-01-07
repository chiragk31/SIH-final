from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Form, File, UploadFile
from app.models.user import UserCreate, UserLogin, UserResponse, Token
from app.core.security import create_access_token, verify_password, get_password_hash
from app.api.deps import get_current_user
from app.db.supabase_client import supabase
from app.config import settings
from datetime import datetime
from pydantic import BaseModel, EmailStr
import logging
import uuid
import shutil
import os

router = APIRouter()
logger = logging.getLogger(__name__)


class LanguageUpdate(BaseModel):
    """Model for updating user's preferred language"""
    language: str


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    email: EmailStr = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    preferred_language: str = Form("en"),
    is_admin: bool = Form(False),
    profile_image: UploadFile = File(None)
):
    """
    Register a new user with optional profile image
    """
    try:
        # Check if Supabase is configured
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            logger.warning("Supabase not configured, returning mock response")
            # Return mock user for frontend testing
            user_id = str(uuid.uuid4())
            return {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "is_admin": is_admin,
                "created_at": datetime.utcnow().isoformat(),
                "message": "Database not configured - mock response",
                "avatar_url": None
            }
        
        # Check if user already exists
        existing = supabase.table("users").select("*").eq("email", email).execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Handle Profile Image Upload
        avatar_url = None
        if profile_image:
            try:
                # Create upload directory
                upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "static", "profiles")
                os.makedirs(upload_dir, exist_ok=True)
                
                # Generate unique filename
                file_ext = os.path.splitext(profile_image.filename)[1]
                filename = f"{uuid.uuid4()}{file_ext}"
                file_path = os.path.join(upload_dir, filename)
                
                # Save file
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(profile_image.file, buffer)
                
                # Construct URL (Assuming served relative to root /static)
                # In production this should be a full URL
                avatar_url = f"/static/profiles/{filename}"
                logger.info(f"Saved profile image to {file_path}")
            except Exception as e:
                logger.error(f"Failed to upload profile image: {e}")
                # Continue without image
        
        # Hash password
        hashed_password = get_password_hash(password)
        
        # Create user - let Supabase generate UUID
        user_data = {
            "email": email,
            "full_name": full_name,
            "password_hash": hashed_password,
            "is_admin": is_admin is True or is_admin == "true", # Handle form boolean often sent as string
            "is_teacher": False,
            "preferred_language": preferred_language,
            "avatar_url": avatar_url # Store in DB
        }
        
        try:
            response = supabase.table("users").insert(user_data).execute()
            
            if not response.data:
                logger.error(f"Supabase insert returned no data: {response}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user"
                )
            
            logger.info(f"✅ User created: {email}")
            return response.data[0]
        except Exception as db_error:
            logger.error(f"❌ Database error during signup: {db_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(db_error)}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"❌ Signup error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """
    Login and get access token
    """
    try:
        # Check if Supabase is configured
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            logger.warning("Supabase not configured, returning mock token")
            # Create mock token for frontend testing
            mock_user_id = str(uuid.uuid4())
            access_token = create_access_token(data={"sub": mock_user_id})
            return {
                "access_token": access_token,
                "token_type": "bearer"
            }
        
        # Get user by email - select only needed fields to avoid JSON serialization issues
        try:
            response = supabase.table("users").select("id, email, password_hash, is_admin, is_teacher, full_name, preferred_language, avatar_url").eq("email", credentials.email).execute()
            
            if not response.data:
                logger.warning(f"User not found: {credentials.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )
            
            user = response.data[0]
            
            # Verify password
            if not verify_password(credentials.password, user["password_hash"]):
                logger.warning(f"Invalid password for user: {credentials.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )
            
            # Create access token
            access_token = create_access_token(data={"sub": user["id"]})
            logger.info(f"✅ User logged in: {credentials.email}")
            
            # Construct response
            user_response = {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "user_type": "admin" if user.get("is_admin") else ("teacher" if user.get("is_teacher") else "student"),
                "is_teacher": user.get("is_teacher", False),
                "is_admin": user.get("is_admin", False),
                "avatar_url": user.get("avatar_url"),
                "preferred_language": user.get("preferred_language", "en"),  # User's preferred UI language
                "created_at": datetime.utcnow() # user.get("created_at", datetime.utcnow())
            }
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user_response
            }
        except HTTPException:
            raise
        except Exception as db_error:
            logger.error(f"❌ Database error during login: {db_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Login failed: {str(db_error)}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user information
    """
    return current_user


@router.patch("/me/language")
async def update_preferred_language(
    language_data: LanguageUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user's preferred UI language
    
    The language will be used to automatically set the interface language on login.
    """
    try:
        response = supabase.table("users")\
            .update({"preferred_language": language_data.language})\
            .eq("id", current_user["id"])\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"✅ Language updated for user {current_user['email']}: {language_data.language}")
        return {
            "message": "Language preference updated successfully",
            "language": language_data.language
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating language for user {current_user.get('id')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update language preference"
        )


@router.patch("/me/avatar", response_model=UserResponse)
async def update_avatar(
    profile_image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Update user's profile picture
    """
    try:
        # Create upload directory
        # Go up from: app/api/v1/endpoints/auth.py -> endpoints -> v1 -> api -> app -> root
        # Base dir is app/../
        # Safer to use the one defined in signup or main
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "static", "profiles")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_ext = os.path.splitext(profile_image.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(profile_image.file, buffer)
        
        # Construct URL
        avatar_url = f"/static/profiles/{filename}"
        
        # Update DB
        response = supabase.table("users")\
            .update({"avatar_url": avatar_url})\
            .eq("id", current_user["id"])\
            .execute()
            
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        user = response.data[0]
        
        user_response = {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "user_type": "admin" if user.get("is_admin") else ("teacher" if user.get("is_teacher") else "student"),
            "is_teacher": user.get("is_teacher", False),
            "is_admin": user.get("is_admin", False),
            "avatar_url": user.get("avatar_url"),
            "preferred_language": user.get("preferred_language", "en"),
            "created_at": datetime.utcnow()
        }
        
        logger.info(f"✅ Avatar updated for user {current_user['email']}")
        return user_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating avatar: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update avatar: {str(e)}"
        )


@router.patch("/me/profile", response_model=UserResponse)
def update_profile(
    profile_image: Optional[UploadFile] = File(None),
    full_name: Optional[str] = Form(None),
    contact_number: Optional[str] = Form(None),
    qualification: Optional[str] = Form(None),
    specialization: Optional[str] = Form(None),
    domain_expertise: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Update user's comprehensive profile details
    """
    print(f"DEBUG: update_profile called for user {current_user.get('id')}")
    print(f"DEBUG: Received profile_image: {profile_image}, full_name: {full_name}")
    try:
        updates = {}
        
        # Handle Text Fields
        if full_name is not None:
            updates["full_name"] = full_name
        if contact_number is not None:
            updates["contact_number"] = contact_number
        if qualification is not None:
            updates["qualification"] = qualification
        if specialization is not None:
            updates["specialization"] = specialization
        if domain_expertise is not None:
            updates["domain_expertise"] = domain_expertise
            
        # Handle File Upload
        if profile_image:
             upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "static", "profiles")
             os.makedirs(upload_dir, exist_ok=True)
             
             file_ext = os.path.splitext(profile_image.filename)[1]
             filename = f"{uuid.uuid4()}{file_ext}"
             file_path = os.path.join(upload_dir, filename)
             
             with open(file_path, "wb") as buffer:
                 shutil.copyfileobj(profile_image.file, buffer)
                 
             updates["avatar_url"] = f"/static/profiles/{filename}"
        
        # Update DB
        if updates:
            response = supabase.table("users")\
                .update(updates)\
                .eq("id", current_user["id"])\
                .execute()
                
            if not response.data:
                raise HTTPException(status_code=404, detail="User not found")
            user = response.data[0]
        else:
             # Just fetch
             response = supabase.table("users").select("*").eq("id", current_user["id"]).execute()
             user = response.data[0]

        return {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "user_type": "admin" if user.get("is_admin") else ("teacher" if user.get("is_teacher") else "student"),
            "is_teacher": user.get("is_teacher", False),
            "is_admin": user.get("is_admin", False),
            "avatar_url": user.get("avatar_url"),
            "contact_number": user.get("contact_number"),
            "qualification": user.get("qualification"),
            "specialization": user.get("specialization"),
            "domain_expertise": user.get("domain_expertise"),
            "preferred_language": user.get("preferred_language", "en"),
            "created_at": datetime.utcnow()
        }
            
    except Exception as e:
        logger.error(f"❌ Error updating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )
