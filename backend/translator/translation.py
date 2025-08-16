import os
import sys
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

# Try to import google.generativeai, but don't crash if it's missing
try:
    from google import genai
    if GEMINI_API_KEY:
        # Configure Gemini only if API key is available
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')
        GEMINI_AVAILABLE = True
    else:
        print("⚠️ GOOGLE_API_KEY not set - translation will use fallback methods")
        GEMINI_AVAILABLE = False
except ImportError:
    print("⚠️ google-generativeai not installed - translation will use fallback methods")
    GEMINI_AVAILABLE = False
except Exception as e:
    print(f"⚠️ Error configuring Gemini: {e} - translation will use fallback methods")
    GEMINI_AVAILABLE = False


def parse_script_file(script_path):
    dialogue = []
    with open(script_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if ':' in line:
                speaker, text = line.split(':', 1)
                dialogue.append({'speaker': speaker.strip(), 'text': text.strip()})
            else:
                dialogue.append({'speaker': 'Unknown', 'text': line})
    return dialogue

def parse_srt_file(srt_path):
    subtitles = []
    with open(srt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    blocks = re.split(r'\n\s*\n', content.strip())
    for block in blocks:
        lines = block.split('\n')
        if len(lines) >= 3:
            idx = lines[0].strip()
            times = lines[1].strip()
            text = ' '.join(lines[2:]).strip()
            start, end = times.split(' --> ')
            subtitles.append({'index': int(idx), 'start': start, 'end': end, 'text': text})
    return subtitles

def generate_translation_prompt(dialogue, target_lang):
    dialogue_text = "\n".join([f"{d['speaker']}: {d['text']}" for d in dialogue])
    prompt = f"""
You are a professional subtitler and translator like Netflix's best localization experts. Translate the following scene dialogue into {target_lang}, preserving emotional tone, idioms, slang, and context. The translation should be natural and sound like a native speaker.

Translate all lines in the format:
SpeakerName: Translated dialogue

Here is the dialogue to translate:
{dialogue_text}

Output only the translated dialogue lines in the same format.
"""
    return prompt

def translate_scene(dialogue, target_lang):
    if not GOOGLE_AI_AVAILABLE:
        # Fallback: return original text with warning
        print(f"⚠️ Translation service not available - returning original text")
        return "\n".join([f"{d['speaker']}: {d['text']}" for d in dialogue])
    
    try:
        prompt = generate_translation_prompt(dialogue, target_lang)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"⚠️ Google AI translation failed: {e} - returning original text")
        return "\n".join([f"{d['speaker']}: {d['text']}" for d in dialogue])

def parse_translated_dialogue(translated_text):
    dialogue = []
    for line in translated_text.split('\n'):
        line = line.strip()
        if not line:
            continue
        if ':' in line:
            speaker, text = line.split(':', 1)
            dialogue.append({'speaker': speaker.strip(), 'text': text.strip()})
        else:
            dialogue.append({'speaker': 'Unknown', 'text': line})
    return dialogue

def clean_japanese_text(text):
    """
    Removes spaces between Japanese characters to improve translation accuracy.
    Japanese text with spaces between characters can confuse translation models.
    """
    # Check if text contains Japanese characters
    import re
    japanese_pattern = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]')
    
    if japanese_pattern.search(text):
        # Remove spaces between Japanese characters
        cleaned = re.sub(r'([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF])\s+([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF])', r'\1\2', text)
        # Remove multiple spaces
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        if cleaned != text:
            print(f"[DEBUG] Cleaned Japanese text: '{text[:50]}...' -> '{cleaned[:50]}...'")
        return cleaned
    return text

def translate_line(text, target_lang, max_retries=3):
    """
    Translates a single line of text to the target language.
    Used as fallback when script dialogue runs out.
    Includes retry logic for better reliability.
    """
    if not GOOGLE_AI_AVAILABLE:
        # Fallback: return original text with warning
        print(f"⚠️ Translation service not available - returning original text")
        return text
    
    # Clean Japanese text first for better translation
    cleaned_text = clean_japanese_text(text)
    
    for attempt in range(max_retries):
        try:
            prompt = f"""
You are a professional translator. Translate this text into {target_lang}, keeping its emotional tone, idioms, slang, and context.

Original: "{cleaned_text}"
Output (only translation, no extras):
"""
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            translated = response.text.strip()
            
            # Validate that we got a proper translation
            if translated and len(translated) > 0 and translated != cleaned_text:
                return translated
            else:
                print(f"[WARNING] Attempt {attempt + 1}: Empty or identical translation, retrying...")
                
        except Exception as e:
            print(f"[WARNING] Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                import time
                time.sleep(1)  # Wait before retry
            else:
                print(f"[ERROR] All {max_retries} attempts failed for: '{cleaned_text}'")
                return f"[TRANSLATION FAILED] {cleaned_text}"
    
    return f"[TRANSLATION FAILED] {cleaned_text}"

def choose_best_variant(original_text, variants_text, target_lang):
    if not GOOGLE_AI_AVAILABLE:
        # Fallback: return first variant or original text
        variants = [v.strip() for v in variants_text.split('/') if v.strip()]
        if variants:
            return variants[0]
        return original_text
    
    variants = [v.strip() for v in variants_text.split('/') if v.strip()]
    if len(variants) == 1:
        return variants[0]

    try:
        prompt = f"""
You are a subtitle expert and native {target_lang} speaker. Given the original English sentence:
"{original_text}"

Here are multiple translation options:
{chr(10).join(f'- {v}' for v in variants)}

Please choose the best single subtitle translation option that is clear, natural, and appropriate for viewers.
Reply ONLY with the chosen variant, no explanations.
"""
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"⚠️ Google AI variant selection failed: {e} - returning first variant")
        return variants[0] if variants else original_text

def align_translations_to_srt(srt_subtitles, translated_dialogue, target_lang):
    """
    Aligns translated dialogue lines to .srt subtitle lines by order.
    Returns list of dicts with keys: index, start, end, translated_text
    """
    aligned = []
    td_index = 0
    
    print(f"[DEBUG] SRT has {len(srt_subtitles)} lines, translated dialogue has {len(translated_dialogue)} lines")
    
    for i, sub in enumerate(srt_subtitles):
        print(f"[DEBUG] Processing SRT line {i+1}/{len(srt_subtitles)}: '{sub['text'][:50]}...'")
        
        # If we run out of translated dialogue lines, translate the original text
        if td_index >= len(translated_dialogue):
            print(f"[DEBUG] Line {i+1}: No more translated dialogue, translating original text")
            # Try to translate the original subtitle text as fallback
            try:
                fallback_translation = translate_line(sub['text'], target_lang)
                translated_text = fallback_translation
                print(f"[DEBUG] Line {i+1}: Fallback translation successful: '{translated_text[:50]}...'")
            except Exception as e:
                print(f"[ERROR] Fallback translation failed for line {i+1}: {e}")
                translated_text = f"[TRANSLATION FAILED] {sub['text']}"
        else:
            translated_text = translated_dialogue[td_index]['text']
            print(f"[DEBUG] Line {i+1}: Using translated dialogue: '{translated_text[:50]}...'")
            td_index += 1

        # Ensure we have a valid translation
        if translated_text.startswith("[TRANSLATION FAILED]"):
            print(f"[WARNING] Line {i+1} has failed translation, attempting one more time...")
            try:
                final_attempt = translate_line(sub['text'], target_lang, max_retries=1)
                if not final_attempt.startswith("[TRANSLATION FAILED]"):
                    translated_text = final_attempt
                    print(f"[DEBUG] Line {i+1}: Final attempt successful: '{translated_text[:50]}...'")
            except Exception as e:
                print(f"[ERROR] Final attempt also failed for line {i+1}: {e}")

        aligned.append({
            'index': sub['index'],
            'start': sub['start'],
            'end': sub['end'],
            'translated_text': translated_text
        })
    
    if len(translated_dialogue) > len(srt_subtitles):
        print(f"[WARNING] More translated dialogue lines ({len(translated_dialogue)}) than SRT lines ({len(srt_subtitles)}). Some translations will be unused.")
    
    # Verify all lines have proper translations
    failed_lines = [i for i, sub in enumerate(aligned) if sub['translated_text'].startswith("[TRANSLATION FAILED]")]
    if failed_lines:
        print(f"[WARNING] {len(failed_lines)} lines failed translation: {[i+1 for i in failed_lines]}")
    else:
        print(f"[SUCCESS] All {len(aligned)} lines translated successfully!")
    
    return aligned

def display_translation_stats(aligned_subtitles, target_language):
    """
    Displays statistics about the translation quality and results.
    """
    total_lines = len(aligned_subtitles)
    failed_lines = [sub for sub in aligned_subtitles if sub['translated_text'].startswith("[TRANSLATION FAILED]")]
    success_lines = total_lines - len(failed_lines)
    
    print(f"\n{'='*60}")
    print(f"TRANSLATION SUMMARY - {target_language.upper()}")
    print(f"{'='*60}")
    print(f"Total subtitle lines: {total_lines}")
    print(f"Successfully translated: {success_lines}")
    print(f"Failed translations: {len(failed_lines)}")
    print(f"Success rate: {(success_lines/total_lines)*100:.1f}%")
    
    if failed_lines:
        print(f"\nFailed lines:")
        for sub in failed_lines:
            print(f"  Line {sub['index']}: {sub['text'][:50]}...")
    
    print(f"{'='*60}")

def write_srt_file(aligned_subtitles, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        for sub in aligned_subtitles:
            f.write(f"{sub['index']}\n")
            f.write(f"{sub['start']} --> {sub['end']}\n")
            f.write(f"{sub['translated_text']}\n\n")
    print(f"Translated .srt file saved to {output_path}")

def main():
    if len(sys.argv) < 4:
        print("Usage: python translation.py <script_text_file> <input_srt_file> <target_language>")
        sys.exit(1)

    script_file = sys.argv[1]
    srt_file = sys.argv[2]
    target_language = sys.argv[3]

    print(f"Parsing script file: {script_file}")
    dialogue = parse_script_file(script_file)
    print(f"Found {len(dialogue)} dialogue lines in script")

    print(f"Parsing subtitle file: {srt_file}")
    srt_subtitles = parse_srt_file(srt_file)
    print(f"Found {len(srt_subtitles)} subtitle lines in SRT")

    print(f"Translating entire scene to {target_language} with context...")
    translated_text = translate_scene(dialogue, target_language)
    print(f"Raw translation response: {translated_text[:200]}...")

    print("Parsing translated dialogue output...")
    translated_dialogue = parse_translated_dialogue(translated_text)
    print(f"Parsed {len(translated_dialogue)} translated dialogue lines")

    print("Aligning translated dialogue with subtitle timestamps...")
    aligned_subtitles = align_translations_to_srt(srt_subtitles, translated_dialogue, target_language)

    output_srt_path = f"translated_{target_language}.srt"
    write_srt_file(aligned_subtitles, output_srt_path)

    display_translation_stats(aligned_subtitles, target_language)

if __name__ == "__main__":
    main()
