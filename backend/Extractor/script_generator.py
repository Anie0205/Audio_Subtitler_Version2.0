import os
import requests
import json
from moviepy.editor import VideoFileClip

# -------------------- CONFIG --------------------
PAUSE_THRESHOLD = 1.0  # seconds between words to split subtitles
MAX_SUBTITLE_DURATION = 8.0  # max length for a single subtitle in seconds
WHISPERX_API_URL = "https://38c5ee2aa5e4.ngrok-free.app"  # Your Colab ngrok URL
# ------------------------------------------------

# -------------------- HELPER FUNCTIONS --------------------
def group_into_sentences(words, pause_threshold=1.0, max_duration=8.0):
    """
    Groups word-level timestamps into natural SRT subtitle sentences.
    """
    subtitles = []
    current_words = []
    start_time = None
    last_end_time = None
    speaker = None

    def flush():
        """Save the current subtitle and reset."""
        if current_words:
            text = " ".join(w["word"] for w in current_words).strip()
            subtitles.append({
                "start": start_time,
                "end": last_end_time,
                "text": f"{speaker}: {text}"
            })

    for w in words:
        if start_time is None:
            start_time = w["start"]
            speaker = w.get("speaker", "Unknown")

        # Check time gap and duration
        time_gap = w["start"] - (last_end_time or w["start"])
        duration_so_far = (last_end_time or w["start"]) - start_time

        # Start new subtitle if gap too large, speaker changes, or too long
        if (time_gap > pause_threshold or
            w.get("speaker") != speaker or
            duration_so_far >= max_duration):

            # Try to split at punctuation when too long
            if duration_so_far >= max_duration and current_words:
                for i in range(len(current_words) - 1, -1, -1):
                    if current_words[i]["word"].endswith(('.', '!', '?', ',')):
                        flush()
                        current_words = current_words[i + 1:]
                        start_time = w["start"]
                        speaker = w.get("speaker", "Unknown")
                        break
                else:
                    flush()
                    current_words = []
                    start_time = w["start"]
                    speaker = w.get("speaker", "Unknown")
            else:
                flush()
                current_words = []
                start_time = w["start"]
                speaker = w.get("speaker", "Unknown")

        current_words.append(w)
        last_end_time = w["end"]

    flush()
    return subtitles


def srt_time_format(seconds):
    """Converts seconds to SRT timestamp format."""
    ms = int((seconds % 1) * 1000)
    s = int(seconds)
    m, s = divmod(s, 60)
    h, m = divmod(m, 60)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def smart_wrap(text, max_chars_per_line=42):
    """
    Language-agnostic subtitle line breaker.
    """
    normalized = " ".join(text.split())
    if len(normalized) <= max_chars_per_line:
        return [normalized]

    # Tokenize (basic space split — works for space-separated scripts)
    tokens = normalized.split(" ")

    def is_capitalized(word):
        return len(word) > 0 and word[0].isupper()

    def is_small_word(word):
        # Likely function word if <= 3 chars and lowercase
        return len(word) <= 3 and word.islower()

    def looks_like_verb(word):
        # Very loose morphological clue — language neutral-ish
        return word.endswith(("ed", "ing", "en")) or len(word) > 3

    def is_bad_split(left_idx):
        """Check if splitting after token[left_idx] breaks rules."""
        if left_idx < 0 or left_idx >= len(tokens) - 1:
            return True

        left_word = tokens[left_idx].strip(" ,.;:!?\"'")
        right_word = tokens[left_idx + 1].strip(" ,.;:!?\"'")

        # Avoid split between two capitalized words (likely names)
        if is_capitalized(left_word) and is_capitalized(right_word):
            return True

        # Avoid breaking small function word pairs
        if is_small_word(left_word) or is_small_word(right_word):
            return True

        # Avoid breaking verb + auxiliary/negation/reflexive
        if looks_like_verb(left_word) and is_small_word(right_word):
            return True

        # Avoid breaking prepositional verb patterns
        if looks_like_verb(left_word) and is_small_word(right_word):
            return True

        return False

    # Candidate split points
    candidate_indices = []

    # 1) After punctuation
    for i, tok in enumerate(tokens[:-1]):
        if tok.endswith((".", ",", ";", ":", "!", "?")):
            candidate_indices.append(i)

    # 2) Before small function words (size-based, not English list)
    for i in range(len(tokens) - 1):
        if is_small_word(tokens[i + 1]):
            candidate_indices.append(i)

    # 3) Any other word boundary
    candidate_indices.extend(range(len(tokens) - 1))

    # Choose the best split
    target = min(max_chars_per_line, max(len(normalized) // 2, 1))
    best_split = None
    best_distance = float("inf")

    def left_right_text(idx):
        left = " ".join(tokens[: idx + 1])
        right = " ".join(tokens[idx + 1 :])
        return left, right

    for idx in candidate_indices:
        if is_bad_split(idx):
            continue
        left, right = left_right_text(idx)
        if len(left) <= max_chars_per_line and len(right) <= max_chars_per_line:
            dist = abs(len(left) - target)
            if dist < best_distance:
                best_distance = dist
                best_split = (left, right)

    # If no valid split found, fallback to nearest space to target
    if best_split:
        return list(best_split)

    for radius in range(len(normalized)):
        for pos in (target - radius, target + radius):
            if 0 < pos < len(normalized) and normalized[pos] == " ":
                left = normalized[:pos]
                right = normalized[pos + 1 :]
                if len(left) <= max_chars_per_line and len(right) <= max_chars_per_line:
                    return [left, right]

    # Last resort: hard chop
    return [
        normalized[:max_chars_per_line],
        normalized[max_chars_per_line:][:max_chars_per_line],
    ]


def save_srt(subtitles, path):
    """Writes subtitles to an SRT file with at most 2 lines per cue."""
    with open(path, "w", encoding="utf-8") as f:
        for i, sub in enumerate(subtitles, 1):
            f.write(f"{i}\n")
            f.write(f"{srt_time_format(sub['start'])} --> {srt_time_format(sub['end'])}\n")
            lines = smart_wrap(sub["text"], max_chars_per_line=42)
            if len(lines) == 1:
                f.write(f"{lines[0]}\n\n")
            else:
                f.write(f"{lines[0]}\n{lines[1]}\n\n")


def save_dialogue_txt(subtitles, path):
    """Writes only the dialogue lines (no timestamps) to a .txt file."""
    def parse_speaker_and_text(labeled_text: str):
        # Expect format "Speaker: utterance"; fall back if missing colon
        parts = labeled_text.split(":", 1)
        if len(parts) == 2:
            speaker = parts[0].strip()
            utterance = parts[1].strip()
        else:
            speaker = "Unknown"
            utterance = labeled_text.strip()
        return speaker, utterance

    def flush_block(file_handle, speaker_name: str, utterances: list[str]):
        if not utterances:
            return
        combined = " ".join(u.strip() for u in utterances if u.strip())
        combined = " ".join(combined.split())
        file_handle.write(f"{combined}\n\n")

    with open(path, "w", encoding="utf-8") as f:
        current_speaker: str | None = None
        buffer: list[str] = []

        for sub in subtitles:
            speaker, utterance = parse_speaker_and_text(sub["text"])
            if current_speaker is None:
                current_speaker = speaker
            if speaker != current_speaker:
                flush_block(f, current_speaker, buffer)
                current_speaker = speaker
                buffer = []
            buffer.append(utterance)

        # flush last block
        flush_block(f, current_speaker or "Unknown", buffer)


# -------------------- EXTERNAL API FUNCTIONS --------------------
def transcribe_with_external_api(audio_path):
    """
    Use your enhanced Colab-hosted WhisperX API for transcription with speaker diarization.
    This replaces local ML model loading.
    """
    try:
        # Prepare the audio file for upload
        with open(audio_path, "rb") as audio_file:
            files = {"file": ("audio.wav", audio_file, "audio/wav")}
            
            # Send request to your enhanced Colab API
            response = requests.post(
                f"{WHISPERX_API_URL}/transcribe",
                files=files,
                timeout=300  # 5 minute timeout for processing
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Check if this is the enhanced API response with speaker diarization
                if "word_segments" in result:
                    # Enhanced API response - return as is
                    print("✅ Received enhanced API response with speaker diarization")
                    return result
                else:
                    # Basic API response - process segments manually
                    print("⚠️ Received basic API response, processing segments...")
                    segments = []
                    for segment in result.get("segments", []):
                        words = segment.get("words", [])
                        for word in words:
                            segments.append({
                                "start": word.get("start", 0),
                                "end": word.get("end", 0),
                                "word": word.get("word", ""),
                                "speaker": word.get("speaker", "Speaker_0")  # Try to get real speaker
                            })
                    
                    return {
                        "word_segments": segments,
                        "language": result.get("language", "en")
                    }
            else:
                raise Exception(f"API request failed with status {response.status_code}: {response.text}")
                
    except Exception as e:
        raise Exception(f"External API transcription failed: {e}")


def process_video_pipeline(video_path, audio_path, output_srt_path, output_txt_path):
    """
    Main function to process video through the pipeline using external API.
    This replaces local ML model loading.
    """
    try:
        # 1. Extract audio from video
        video = VideoFileClip(video_path)
        if video.audio is not None:
            video.audio.write_audiofile(audio_path, codec="pcm_s16le")
        else:
            raise Exception("No audio track found in video")
        video.close()

        # 2. Transcribe using external API (no local models!)
        print("🔄 Transcribing audio using external WhisperX API...")
        result = transcribe_with_external_api(audio_path)
        
        # 3. Generate subtitles
        print("🔄 Generating subtitles...")
        subtitles = group_into_sentences(
            result["word_segments"],
            pause_threshold=PAUSE_THRESHOLD,
            max_duration=MAX_SUBTITLE_DURATION
        )

        # 4. Save outputs
        save_srt(subtitles, output_srt_path)
        save_dialogue_txt(subtitles, output_txt_path)

        print(f"✅ SRT file saved to {output_srt_path}")
        print(f"✅ Dialogue file saved to {output_txt_path}")
        
        return subtitles

    except Exception as e:
        print(f"❌ Error processing video: {e}")
        raise


# Example usage (commented out to avoid execution at import time)
if __name__ == "__main__":
    # Configuration for direct execution
    VIDEO_PATH = "sample.mp4"
    AUDIO_PATH = "audio.wav"
    OUTPUT_SRT_PATH = "subtitles.srt"
    OUTPUT_TXT_PATH = "dialogue.txt"
    
    try:
        subtitles = process_video_pipeline(
            video_path=VIDEO_PATH,
            audio_path=AUDIO_PATH,
            output_srt_path=OUTPUT_SRT_PATH,
            output_txt_path=OUTPUT_TXT_PATH
        )
        print(f"🎉 Successfully processed video! Generated {len(subtitles)} subtitles.")
        
    except Exception as e:
        print(f"❌ Failed to process video: {e}")
        exit(1)
