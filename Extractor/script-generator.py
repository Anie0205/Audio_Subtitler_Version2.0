import whisperx
from whisperx.diarize import DiarizationPipeline
import torch
from moviepy.editor import VideoFileClip

# -------------------- CONFIG --------------------
VIDEO_PATH = "sample.mp4"
AUDIO_PATH = "audio.wav"
OUTPUT_SRT_PATH = "subtitles.srt"
OUTPUT_TXT_PATH = "dialogue.txt"
PAUSE_THRESHOLD = 1.0  # seconds between words to split subtitles
MAX_SUBTITLE_DURATION = 8.0  # max length for a single subtitle in seconds
HF_AUTH_TOKEN = os.getenv("HF_AUTH_TOKEN")  # replace with your token
# ------------------------------------------------

# 1. Extract audio from video
video = VideoFileClip(VIDEO_PATH)
video.audio.write_audiofile(AUDIO_PATH, codec="pcm_s16le")

# 2. Load WhisperX model
device = "cuda" if torch.cuda.is_available() else "cpu"
model = whisperx.load_model("base", device, compute_type="float32")

# 3. Transcribe audio
audio = whisperx.load_audio(AUDIO_PATH)
result = model.transcribe(audio)

# 4. Align words to improve accuracy
align_model, metadata = whisperx.load_align_model(
    language_code=result["language"], device=device
)
result_aligned = whisperx.align(result["segments"], align_model, metadata, audio, device)

# 5. Run speaker diarization
diarize_model = DiarizationPipeline(
    use_auth_token=HF_AUTH_TOKEN,
    device=device
)
diarize_segments = diarize_model(AUDIO_PATH)

# 6. Assign speakers to each word
result_with_speakers = whisperx.assign_word_speakers(diarize_segments, result_aligned)


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


# --- Added: language-agnostic smart subtitle wrapper ---
def smart_wrap(text, max_chars_per_line=42):
    """
    Language-agnostic subtitle line breaker.
    Rules:
    - Max 2 lines, each ≤ max_chars_per_line
    - Prefer break AFTER punctuation marks
    - Then before conjunction/preposition-like small words (by length, not by fixed list)
    - Avoid breaking:
        * Noun from article/adjective (heuristic: small word before big word)
        * First + last names (two consecutive capitalized words)
        * Verb from auxiliary/reflexive/negation (small word after main word)
        * Prepositional verbs (verb-like ending followed by short function word)
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
    """Writes only the dialogue lines (no timestamps) to a .txt file.
    Consecutive lines from the same speaker are grouped together.
    """

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
# -----------------------------------------------------------

# 7. Create and save subtitles
word_segments = result_with_speakers["word_segments"]
subtitles = group_into_sentences(word_segments, pause_threshold=PAUSE_THRESHOLD, max_duration=MAX_SUBTITLE_DURATION)
save_srt(subtitles, OUTPUT_SRT_PATH)
save_dialogue_txt(subtitles, OUTPUT_TXT_PATH)

print(f"✅ SRT file saved to {OUTPUT_SRT_PATH}")
print(f"✅ Dialogue file saved to {OUTPUT_TXT_PATH}")
