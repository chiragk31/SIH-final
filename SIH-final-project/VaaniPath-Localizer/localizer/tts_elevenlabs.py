"""
ElevenLabs TTS Integration

High-quality TTS using ElevenLabs API with multilingual support.
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Try to import elevenlabs library
try:
    from elevenlabs import VoiceSettings
    from elevenlabs.client import ElevenLabs
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False
    logger.warning("elevenlabs library not available - install with: pip install elevenlabs")

# ElevenLabs API Key
ELEVENLABS_API_KEY = "sk_f8194626e74bdf87e79f17594ec1e0d3e2cf69c7909e211a"

# Voice IDs for different languages (multilingual v2 model)
# Using Rachel voice (multilingual) for all languages
VOICE_MAP = {
    'hi': 'pNInz6obpgDQGcFmaJgB',  # Adam (multilingual)
    'hi-IN': 'pNInz6obpgDQGcFmaJgB',
    'ta': 'pNInz6obpgDQGcFmaJgB',
    'ta-IN': 'pNInz6obpgDQGcFmaJgB',
    'te': 'pNInz6obpgDQGcFmaJgB',
    'te-IN': 'pNInz6obpgDQGcFmaJgB',
    'bn': 'pNInz6obpgDQGcFmaJgB',
    'bn-IN': 'pNInz6obpgDQGcFmaJgB',
    'mr': 'pNInz6obpgDQGcFmaJgB',
    'mr-IN': 'pNInz6obpgDQGcFmaJgB',
    'gu': 'pNInz6obpgDQGcFmaJgB',
    'gu-IN': 'pNInz6obpgDQGcFmaJgB',
    'en': 'pNInz6obpgDQGcFmaJgB',
    'en-IN': 'pNInz6obpgDQGcFmaJgB',
}

# Global client instance
_elevenlabs_client = None


def get_elevenlabs_client():
    """Get or create ElevenLabs client"""
    global _elevenlabs_client
    if _elevenlabs_client is None and ELEVENLABS_AVAILABLE:
        _elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    return _elevenlabs_client


def get_voice_id(lang: str) -> str:
    """
    Get ElevenLabs voice ID for language
    
    Args:
        lang: Language code (e.g., 'hi-IN', 'ta')
        
    Returns:
        Voice ID string
    """
    lang_normalized = lang.lower().strip()
    
    # Try exact match
    if lang_normalized in VOICE_MAP:
        return VOICE_MAP[lang_normalized]
    
    # Try base language
    base_lang = lang_normalized.split('-')[0]
    if base_lang in VOICE_MAP:
        return VOICE_MAP[base_lang]
    
    # Default to Adam (multilingual)
    return VOICE_MAP['hi']


def tts_elevenlabs(
    text: str,
    lang: str,
    output_path: str,
    stability: float = 0.5,
    similarity_boost: float = 0.75
) -> bool:
    """
    Generate TTS using ElevenLabs API
    
    Args:
        text: Text to synthesize
        lang: Language code
        output_path: Output audio file path
        stability: Voice stability (0.0 to 1.0)
        similarity_boost: Voice similarity boost (0.0 to 1.0)
        
    Returns:
        True if successful, False otherwise
    """
    if not ELEVENLABS_AVAILABLE:
        logger.warning("ElevenLabs library not available")
        return False
    
    try:
        client = get_elevenlabs_client()
        if client is None:
            logger.error("Failed to initialize ElevenLabs client")
            return False
        
        voice_id = get_voice_id(lang)
        
        logger.info(f"🎙️ Calling ElevenLabs API for {lang}...")
        
        # Generate audio using text_to_speech.convert() method
        audio = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_multilingual_v2",  # Best model for Indian languages
            voice_settings=VoiceSettings(
                stability=stability,
                similarity_boost=similarity_boost,
                style=0.0,
                use_speaker_boost=True
            )
        )
        
        # Save audio to file
        with open(output_path, 'wb') as f:
            for chunk in audio:
                if chunk:
                    f.write(chunk)
        
        logger.info(f"✅ ElevenLabs TTS saved to {output_path}")
        return True
        
    except Exception as e:
        logger.error(f"❌ ElevenLabs TTS failed: {e}")
        return False
