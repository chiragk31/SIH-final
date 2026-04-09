from typing import List, Tuple, Dict
from better_profanity import profanity

class VulgarDetector:
    def __init__(self):
        profanity.load_censor_words()
        
        # 🇮🇳 Common Hindi vulgar words (transliterated & devanagari)
        # We MUST include Devanagari because Whisper transcribes Hindi in Devanagari.
        self.hindi_vulgar_words = [
            # Transliterated
            "madarchod", "bhenchod", "bhosdike", "chutiya", "gand", "gandu", 
            "randi", "haramkhor", "behenchod", "mc", "bc", "bsdk", "kamine", "saala",
            "kuttiya", "harami", "gaand", "lauda", "loda", "choot", "bhosda",
            # Devanagari
            "मादरचोद", "भेंचोद", "बहनचोद", "भोसड़ीके", "चूतिया", "गांड", "गांडू",
            "रंडी", "हरामखोर", "कमीने", "साला", "कुत्तिया", "हरामी", "लौड़ा", "लोड़ा", "चूत", "भोसड़ा"
        ]
        profanity.add_censor_words(self.hindi_vulgar_words)

    def detect_regions(self, words_with_timestamps: List[Dict]) -> List[Tuple[float, float]]:
        """
        Scans words with timestamps and returns a list of (start, end) tuples
        for words identified as vulgar.
        """
        vulgar_regions = []
        
        for word_info in words_with_timestamps:
            text = word_info.get("word", "").strip()
            # Whisper often attaches punctuation like "fuck," or "shit!"
            # We should strip common punctuation for better detection
            clean_text = text.strip(".,!?\"':;")
            
            # Check if likely profane
            if profanity.contains_profanity(clean_text) or profanity.contains_profanity(text):
                start = word_info.get("start", 0.0)
                end = word_info.get("end", 0.0)
                vulgar_regions.append((start, end))
                
        return vulgar_regions

    def mask_text(self, text: str) -> str:
        """
        Replaces vulgar words in the text with 'BEEP' to be read by TTS.
        """
        # We use a custom censor character/string. 
        # better_profanity by default censors with '*'
        # We can implement a custom censor logic or rely on better_profanity's `censor`
        # But `censor` replaces characters. We want to replace the whole word with "BEEP".
        
        # Simple approach: split and check (naive), or just use simple replacement if we don't care about perfect grammar preservation
        # For TTS to say "BEEP", we want "This is BEEP amazing"
        
        # We replace with 'BEEP' so we can track this token through Translation and TTS.
        # We will use TTS timestamps to find exactly when this is spoken.
        censored_text = profanity.censor(text, 'BEEP')
        if censored_text != text:
            print(f"🚫 [VULGAR DETECTED] Masked content: {censored_text}")
        return censored_text
