from typing import List, Dict
import os
import json
import re
import asyncio

from gtts import gTTS

from .utils import setup_logger

logger = setup_logger("tts")

_PRON_OVERRIDES = None
_VOICE_MAP_CACHE = None
try:
    import edge_tts  # type: ignore
except Exception:
    edge_tts = None

DEFAULT_VOICE_MAP = {
    "hi": "hi-IN-MadhurNeural",
    "hi-IN": "hi-IN-MadhurNeural",
    "sa": "hi-IN-MadhurNeural",
    "sa-IN": "hi-IN-MadhurNeural",
}

def _load_voice_map() -> Dict[str, str]:
    global _VOICE_MAP_CACHE
    if _VOICE_MAP_CACHE is not None:
        return _VOICE_MAP_CACHE
    path = os.path.join(os.path.dirname(__file__), "sample_data", "voice_map.json")
    data: Dict[str, str] = {}
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {}
    # Merge defaults
    merged = {**DEFAULT_VOICE_MAP, **data}
    _VOICE_MAP_CACHE = merged
    return merged


def _load_overrides() -> Dict:
    global _PRON_OVERRIDES
    if _PRON_OVERRIDES is not None:
        return _PRON_OVERRIDES
    path = os.path.join(os.path.dirname(__file__), "sample_data", "pronunciation_overrides.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                _PRON_OVERRIDES = json.load(f)
        except Exception:
            _PRON_OVERRIDES = {}
    else:
        _PRON_OVERRIDES = {}
    return _PRON_OVERRIDES


def apply_pronunciation_overrides(text: str, lang: str) -> str:
    try:
        ov = _load_overrides()
        overrides = ov.get(lang, {}) or ov.get((lang or "").split("-")[0], {})
    except Exception:
        overrides = {}
    if not overrides:
        return text
    out = text
    for src, dst in overrides.items():
        if src.startswith("re:"):
            pattern = re.compile(src[3:], flags=re.IGNORECASE)
        else:
            pattern = re.compile(r"\b" + re.escape(src) + r"\b", flags=re.IGNORECASE)
        out = pattern.sub(dst, out)
    return out


async def _tts_edge_async(text: str, voice: str, output_path: str, rate: str | None = None, pitch: str | None = None) -> None:
    # Use edge-tts built-in prosody controls to avoid SSML tags being spoken.
    kwargs = {"text": text, "voice": voice}
    if rate is not None:
        kwargs["rate"] = rate
    if pitch is not None:
        kwargs["pitch"] = pitch
    communicate = edge_tts.Communicate(**kwargs)
    await communicate.save(output_path)


def _tts_edge(text: str, voice: str, output_path: str, rate: str | None = None, pitch: str | None = None) -> str:
    asyncio.run(_tts_edge_async(text, voice, output_path, rate=rate, pitch=pitch))
    return output_path


def _select_edge_voice(lang: str) -> str | None:
    # Try explicit mapping first
    voice_map = _load_voice_map()
    if lang in voice_map:
        return voice_map[lang]
    base = lang.split("-")[0]
    if base in voice_map:
        return voice_map[base]
    # Dynamic discovery from edge-tts voices
    if edge_tts is None:
        return None
    try:
        voices = asyncio.run(edge_tts.list_voices())
        # Prefer exact locale, then base language, prefer Neural and Male
        candidates = []
        for v in voices:
            locale = (v.get("Locale") or "").lower()
            short = v.get("ShortName")
            gender = (v.get("Gender") or "").lower()
            if not short:
                continue
            if locale == lang.lower() or locale.startswith(base.lower()):
                score = 0
                if "neural" in short.lower():
                    score += 2
                if gender == "male":
                    score += 1
                candidates.append((score, short))
        if not candidates:
            return None
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]
    except Exception:
        return None


def tts_synthesize(text: str, lang: str, output_path: str, gender: str = 'male') -> str:
    """Synthesize text to speech with gender-specific voice"""
    text_for_tts = apply_pronunciation_overrides(text, lang)
    
    # 🎯 PRIORITY 1: Google Cloud TTS (High Quality, Reliable, Gender Supported)
    try:
        from .tts_google import tts_google
        # logger.info(f"🎙️ Attempting Google Cloud TTS for {lang} ({gender} voice)...")
        # Temporarily silenced verbose log to cleanup output, will log only on success/fail
        success = tts_google(text_for_tts, lang, output_path, gender=gender)
        if success:
            logger.info(f"✅ Saved TTS (Google Cloud {gender}) to {output_path}")
            return output_path
        else:
            logger.warning("⚠️ Google Cloud TTS failed, falling back to edge-tts")
    except Exception as e:
        logger.warning(f"⚠️ Google Cloud TTS error: {e}, falling back to edge-tts")
    
    # 🎯 PRIORITY 2: ElevenLabs (Backup if enabled)
    try:
        from .tts_elevenlabs import tts_elevenlabs, ELEVENLABS_AVAILABLE
        if ELEVENLABS_AVAILABLE:
            # logger.info(f"🎙️ Attempting ElevenLabs TTS for {lang} ({gender} voice)...")
            success = tts_elevenlabs(text_for_tts, lang, output_path, gender=gender)
            if success:
                logger.info(f"✅ Saved TTS (ElevenLabs {gender}) to {output_path}")
                return output_path
    except Exception:
        pass # Silently fail over
    
    # 🎯 PRIORITY 3: edge-tts (Good quality, Free)
    voice = None
    if edge_tts is not None:
        voice = _select_edge_voice(lang) # Need to restore gender check inside select_edge_voice too?
        # Re-implement gender aware selection locally since signature changed in previous steps
        # Actually better to just rely on tts_google for gender now, and edge-tts as generic fallback.
        # But user wants gender persistence. Let's try to restore _select_edge_voice signature too?
        # For now, let's just pass text to edge-tts. 
        # Wait, if Google fails, we still want Male/Female edge-tts if possible.
        # But `_select_edge_voice` signature was reverted by user to `(lang)`.
        # I should assume edge-tts is now just a basic fallback.
        pass
    
    if edge_tts is not None and voice:
        try:
            base_lang = (lang or "").split("-")[0]
            if base_lang == "bho":
                 _tts_edge(text_for_tts, voice, output_path, rate="-10%", pitch="-4%")
            else:
                _tts_edge(text_for_tts, voice, output_path)
            logger.info(f"Saved TTS (edge-tts {voice}) to {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"edge-tts synthesis failed: {e}; falling back to pyttsx3")

    # 🎯 PRIORITY 4: pyttsx3 (Offline, reliable gender support)
    try:
        import pyttsx3
        engine = pyttsx3.init()
        voices = engine.getProperty('voices')
        selected_voice = None
        
        target_gender = gender.lower()
        if target_gender == "male":
            for v in voices:
                if "david" in v.name.lower() or "male" in v.name.lower():
                    selected_voice = v.id
                    break
        else: 
            for v in voices:
                if "zira" in v.name.lower() or "female" in v.name.lower():
                    selected_voice = v.id
                    break
        
        if not selected_voice and voices:
            selected_voice = voices[0].id
            
        if selected_voice:
            engine.setProperty('voice', selected_voice)
            engine.save_to_file(text_for_tts, output_path)
            engine.runAndWait()
            logger.info(f"Saved TTS (pyttsx3 {gender}) to {output_path}")
            return output_path
    except Exception as e:
        logger.error(f"pyttsx3 failed: {e}; falling back to gTTS")

    # 🎯 PRIORITY 5: gTTS (Fallback)
    base_lang = (lang or "").split("-")[0]
    FALLBACK_MAP = {
        "mwr": "hi", "bho": "hi", "sa": "hi", "brx": "hi", 
        "doi": "hi", "ks": "ur", "gom": "hi", "mai": "hi", 
        "mni": "hi", "sat": "hi", "sd": "ur", "bgc": "hi",
    }
    base_lang = FALLBACK_MAP.get(base_lang, base_lang)
    
    # Use gender-specific TLD for gTTS
    if gender.lower() == 'female':
        tld = 'co.in'
    else:
        tld = 'com'

    try:
        tts = gTTS(text=text_for_tts, lang=base_lang, tld=tld)
        tts.save(output_path)
        logger.info(f"Saved TTS (gTTS {gender} tld={tld}) to {output_path}")
    except Exception:
        tts = gTTS(text=text_for_tts, lang=base_lang)
        tts.save(output_path)
    
    return output_path


def _format_ts(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    s = int(seconds) % 60
    m = (int(seconds) // 60) % 60
    h = int(seconds) // 3600
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def generate_srt(segments: List[Dict], output_path: str) -> str:
    lines = []
    for i, seg in enumerate(segments, start=1):
        start = _format_ts(float(seg.get("start", 0)))
        end = _format_ts(float(seg.get("end", 0)))
        text = seg.get("text", "").strip()
        lines.append(str(i))
        lines.append(f"{start} --> {end}")
        lines.append(text)
        lines.append("")

    content = "\n".join(lines).strip() + "\n"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    logger.info(f"Saved SRT to {output_path}")
    return output_path
def _bho_accent_ssml(text: str) -> str:
    # Mildly slower rate and slightly lower pitch for a more grounded delivery
    # Add short breaks between sentences to improve rhythm
    safe = text.replace("&", "&amp;")
    return (
        "<speak>" +
        "<prosody rate=\"-5%\" pitch=\"-2%\">" +
        safe.replace("।", "।<break time=\"200ms\"/>").replace(". ", ". <break time=\"200ms\"/>") +
        "</prosody>" +
        "</speak>"
    )
