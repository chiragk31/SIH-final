from localizer.tts_google import tts_google
import os

def test_pipeline():
    text = "This is a BEEP message."
    lang = "hi"
    output = "test_beep.mp3"
    
    print(f"Testing TTS with text: {text}")
    path, regions = tts_google(text, lang, output, gender="male")
    
    print(f"Path: {path}")
    print(f"Regions: {regions}")
    
    if len(regions) > 0:
        print("SUCCESS: Regions detected.")
    else:
        print("FAILURE: No regions detected.")

if __name__ == "__main__":
    test_pipeline()
