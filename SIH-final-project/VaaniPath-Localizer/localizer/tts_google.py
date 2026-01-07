import os
import logging
from typing import Dict, Optional

from google.cloud import texttospeech
from google.oauth2 import service_account

from .utils import setup_logger

logger = setup_logger("tts_google")

# Path to the service account key file
KEY_FILE = os.path.join(os.path.dirname(__file__), "gcp_key.json")

# Voice Mapping Strategies for Indian Languages
# Gender mapping strategy:
# - Male: Usually ends in 'B' or 'D' in Google TTS naming convention (e.g., hi-IN-Neural2-B)
# - Female: Usually ends in 'A' or 'C' (e.g., hi-IN-Neural2-A)
# We will use explicit mapping for key languages and fallback logic.

VOICE_MAP = {
    "hi": {
        "male": "hi-IN-Neural2-B",
        "female": "hi-IN-Neural2-A"
    },
    "hi-IN": {
        "male": "hi-IN-Neural2-B",
        "female": "hi-IN-Neural2-A"
    },
    "bn": {
        "male": "bn-IN-Wavenet-B",
        "female": "bn-IN-Wavenet-A"
    },
    "bn-IN": {
        "male": "bn-IN-Wavenet-B",
        "female": "bn-IN-Wavenet-A"
    },
    "gu": {
        "male": "gu-IN-Wavenet-B",
        "female": "gu-IN-Wavenet-A"
    },
    "gu-IN": {
        "male": "gu-IN-Wavenet-B",
        "female": "gu-IN-Wavenet-A"
    },
    "kn": {
        "male": "kn-IN-Wavenet-B",
        "female": "kn-IN-Wavenet-A"
    },
    "kn-IN": {
        "male": "kn-IN-Wavenet-B",
        "female": "kn-IN-Wavenet-A"
    },
    "ml": {
        "male": "ml-IN-Wavenet-B",
        "female": "ml-IN-Wavenet-A"
    },
    "ml-IN": {
        "male": "ml-IN-Wavenet-B",
        "female": "ml-IN-Wavenet-A"
    },
    "mr": {
        "male": "mr-IN-Wavenet-B",
        "female": "mr-IN-Wavenet-A"
    },
    "mr-IN": {
        "male": "mr-IN-Wavenet-B",
        "female": "mr-IN-Wavenet-A"
    },
    "pa": {
        "male": "pa-IN-Wavenet-B",
        "female": "pa-IN-Wavenet-A"
    },
    "pa-IN": {
        "male": "pa-IN-Wavenet-B",
        "female": "pa-IN-Wavenet-A"
    },
    "ta": {
        "male": "ta-IN-Wavenet-B",
        "female": "ta-IN-Wavenet-A"
    },
    "ta-IN": {
        "male": "ta-IN-Wavenet-B",
        "female": "ta-IN-Wavenet-A"
    },
    "te": {
        "male": "te-IN-Standard-B",
        "female": "te-IN-Standard-A"
    },
    "te-IN": {
        "male": "te-IN-Standard-B",
        "female": "te-IN-Standard-A"
    },
    "en": {
        "male": "en-IN-Neural2-B",
        "female": "en-IN-Neural2-A"
    },
    "en-IN": {
        "male": "en-IN-Neural2-B",
        "female": "en-IN-Neural2-A"
    }
}

_client = None

def get_client():
    global _client
    if _client:
        return _client
    
    if not os.path.exists(KEY_FILE):
        logger.error(f"GCP Key file not found at: {KEY_FILE}")
        return None
        
    try:
        credentials = service_account.Credentials.from_service_account_file(KEY_FILE)
        _client = texttospeech.TextToSpeechClient(credentials=credentials)
        logger.info("Initialized Google Cloud TTS Client")
        return _client
    except Exception as e:
        logger.error(f"Failed to initialize GCP TTS client: {e}")
        return None

def get_voice_params(lang_code: str, gender: str) -> Optional[texttospeech.VoiceSelectionParams]:
    """Select the best voice based on language and gender"""
    normalized_lang = lang_code
    # Ensure -IN suffix for Indian languages if missing (common input pattern)
    if len(lang_code) == 2 and lang_code in ['hi', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ta', 'te']:
         normalized_lang = f"{lang_code}-IN"

    # Default logic: Male -> B, Female -> A
    # Some languages have Neural2 (much better), others only Wavenet/Standard
    
    voice_name = None
    
    # Check manual map first
    if lang_code in VOICE_MAP:
        voice_name = VOICE_MAP[lang_code].get(gender.lower(), VOICE_MAP[lang_code].get("female")) # default female
    elif normalized_lang in VOICE_MAP:
        voice_name = VOICE_MAP[normalized_lang].get(gender.lower(), VOICE_MAP[normalized_lang].get("female"))

    ssml_gender = texttospeech.SsmlVoiceGender.MALE if gender.lower() == 'male' else texttospeech.SsmlVoiceGender.FEMALE

    if voice_name:
        return texttospeech.VoiceSelectionParams(
            language_code=normalized_lang,
            name=voice_name,
            ssml_gender=ssml_gender
        )
    
    # Fallback to general selection
    return texttospeech.VoiceSelectionParams(
        language_code=normalized_lang,
        ssml_gender=ssml_gender
    )

def tts_google(text: str, lang: str, output_path: str, gender: str = 'male') -> bool:
    """Synthesize speech using Google Cloud TTS"""
    client = get_client()
    if not client:
        return False

    try:
        input_text = texttospeech.SynthesisInput(text=text)
        
        voice_params = get_voice_params(lang, gender)
        
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0, # Normal speed
            pitch=0.0
        )

        response = client.synthesize_speech(
            input=input_text,
            voice=voice_params,
            audio_config=audio_config
        )

        with open(output_path, "wb") as out:
            out.write(response.audio_content)
            
        return True
        
    except Exception as e:
        logger.error(f"Google TTS synthesis failed: {e}")
        return False
