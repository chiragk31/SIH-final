import os
from typing import List, Tuple
from pydub import AudioSegment
from pydub.generators import Sine
from ..utils import setup_logger

logger = setup_logger("beeper")

def generate_beep(duration_ms: int = 500, frequency: int = 1000) -> AudioSegment:
    """Generates a sine wave beep."""
    beep = Sine(frequency).to_audio_segment(duration=duration_ms)
    # Reduce volume slightly to not be ear-piercing
    beep = beep - 3 
    return beep

def overlay_beeps(
    original_audio_path: str,
    output_path: str,
    regions: List[Tuple[float, float]],
    frequency: int = 1000
) -> str:
    """
    Overlays beeps on the audio at the specified time regions.
    regions: List of (start_sec, end_sec)
    """
    if not regions:
        # No beeps needed, just copy or return path if checks passed
        # But to be safe (and ensuring consistent output format), loading and saving is better or just copy
        # We assume the caller might want the output_path specifically
        if original_audio_path != output_path:
            import shutil
            shutil.copy2(original_audio_path, output_path)
        return output_path

    try:
        audio = AudioSegment.from_file(original_audio_path)
        
        for start_sec, end_sec in regions:
            start_ms = int(start_sec * 1000)
            end_ms = int(end_sec * 1000)
            duration_ms = end_ms - start_ms
            
            if duration_ms <= 0:
                continue
                
            beep = generate_beep(duration_ms, frequency)
            
            # Simple overlay might mix. We usually want to REPLACE (silence + beep) or just Overlay (loud beep)
            # The prompt asked for "beep it out", implying replacement or strong masking.
            # Let's silence the original region first, then overlay beep.
            
            silence = AudioSegment.silent(duration=duration_ms)
            
            # Crossfade=0 to keep it precise
            audio = audio[:start_ms] + beep + audio[end_ms:]
            
        # Export
        # Determine format from extension
        fmt = "mp3"
        if output_path.lower().endswith(".wav"):
            fmt = "wav"
        
        audio.export(output_path, format=fmt)
        logger.info(f"Overlaid {len(regions)} beeps into {output_path}")
        return output_path
        
    except Exception as e:
        logger.error(f"Failed to overlay beeps: {e}")
        # Fallback: copy original
        if original_audio_path != output_path:
            import shutil
            shutil.copy2(original_audio_path, output_path)
        return output_path

def silence_regions(
    audio_path: str,
    output_path: str,
    regions: List[Tuple[float, float]]
) -> str:
    """
    Silences the specified regions in the audio file.
    Used to remove the spoken "BEEP" voice before overlaying the sound.
    """
    if not regions:
        if audio_path != output_path:
            import shutil
            shutil.copy2(audio_path, output_path)
        return output_path

    try:
        audio = AudioSegment.from_file(audio_path)
        
        for start_sec, end_sec in regions:
            start_ms = int(start_sec * 1000)
            end_ms = int(end_sec * 1000)
            
            if end_ms > len(audio):
                end_ms = len(audio)
                
            if start_ms >= end_ms:
                continue

            # Create silence of exact duration
            silence_duration = end_ms - start_ms
            silence_segment = AudioSegment.silent(duration=silence_duration)
            
            # Splice
            audio = audio[:start_ms] + silence_segment + audio[end_ms:]
            
        fmt = "mp3"
        if output_path.lower().endswith(".wav"):
            fmt = "wav"
            
        audio.export(output_path, format=fmt)
        logger.info(f"Silenced {len(regions)} regions in {output_path}")
        return output_path
        
    except Exception as e:
        logger.error(f"Failed to silence regions: {e}")
        if audio_path != output_path:
            import shutil
            shutil.copy2(audio_path, output_path)
        return output_path
