import json
import os
import sys

# Add project root to path to import localizer
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'VaaniPath-Localizer')))

from localizer.translation import translate_text

# Paths
FRONTEND_LOCALES = r"c:\DO-Or-Die\SIH-final\project-1\SIH-fresh\VaaniPath-Frontend\src\i18n\locales"
SOURCE_FILE = os.path.join(FRONTEND_LOCALES, "en-IN.json")

# Target keys to translate (only the new ones)
SECTIONS_TO_UPDATE = ["coursePlayer", "profile", "myCourses"] 

def translate_ui():
    print(f"Loading source: {SOURCE_FILE}")
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        source_data = json.load(f)

    # Identify files to update
    target_files = [f for f in os.listdir(FRONTEND_LOCALES) if f.endswith(".json") and f != "en-IN.json" and f != "en-IN.json.backup"]
    
    for filename in target_files:
        lang_code = filename.split('-')[0] # hi, bn, etc.
        filepath = os.path.join(FRONTEND_LOCALES, filename)
        
        print(f"Processing {filename} ({lang_code})...")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                target_data = json.load(f)
        except Exception:
            target_data = {}

        # Update specific sections
        modified = False
        for section in SECTIONS_TO_UPDATE:
            if section in source_data:
                # If section missing or we want to overwrite/merge
                if section not in target_data:
                    target_data[section] = {}
                    modified = True
                
                for key, text in source_data[section].items():
                    # Translate if key missing
                    if key not in target_data[section]:
                        print(f"  Translating '{section}.{key}': {text[:20]}...")
                        translated = translate_text(text, lang_code)
                        target_data[section][key] = translated
                        modified = True
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(target_data, f, indent=2, ensure_ascii=False)
            print(f"  Updated {filename}")
        else:
            print(f"  No changes needed for {filename}")

if __name__ == "__main__":
    translate_ui()
