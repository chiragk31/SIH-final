from deep_translator import GoogleTranslator

def test_beep_translation():
    text = "This is a BEEP test message."
    target = "hi"
    
    try:
        translator = GoogleTranslator(source='auto', target=target)
        translated = translator.translate(text)
        print(f"Original: {text}")
        print(f"Translated: {translated}")
        
        if "BEEP" in translated:
            print("SUCCESS: BEEP preserved.")
        else:
            print("FAILURE: BEEP translated or lost.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_beep_translation()
