from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import FileResponse, JSONResponse
import subprocess
import os
import shutil
import tempfile
import json

router = APIRouter()

def hex_to_ass_color(hex_color: str) -> str:
    hex_color = hex_color.lstrip('#')
    r = hex_color[0:2]
    g = hex_color[2:4]
    b = hex_color[4:6]
    return f"&H00{b}{g}{r}&"

def escape_path_for_ffmpeg(path: str) -> str:
    return path.replace("\\", "/").replace(":", "\\:")

@router.post("/overlay")
async def burn_subtitles(
    video: UploadFile = File(...),
    srt: UploadFile = File(...),
    style_json: str = Form(...)
):
    try:
        style_data = json.loads(style_json)

        # Font & Text Style
        font_name = style_data.get("font", "Arial")
        font_size = style_data.get("font_size", 28)
        bold = 1 if style_data.get("bold", False) else 0
        italic = 1 if style_data.get("italic", False) else 0

        # Colors
        primary_color = hex_to_ass_color(style_data.get("font_color", "#FFFFFF"))
        outline_color = hex_to_ass_color(style_data.get("outline_color", "#000000"))

        # Outline & Shadow
        outline_thickness = style_data.get("outline_thickness", 2)  # Keep small for speed
        shadow_offset = style_data.get("shadow_offset", 0)  # Keep small for speed

        # Position & Margins
        alignment = style_data.get("alignment", 2)  # 1=bottom-left, 2=bottom-center, 3=bottom-right, etc.
        margin_v = style_data.get("margin_v", 30)  # vertical offset

        tmpdir = tempfile.mkdtemp()
        video_path = os.path.join(tmpdir, video.filename)
        srt_path = os.path.join(tmpdir, srt.filename)
        output_path = os.path.join(tmpdir, "output_with_subs.mp4")

        with open(video_path, "wb") as f:
            shutil.copyfileobj(video.file, f)
        with open(srt_path, "wb") as f:
            shutil.copyfileobj(srt.file, f)

        srt_escaped = escape_path_for_ffmpeg(srt_path)

        # Build FFmpeg style string (minimal + fast)
        style_str = (
            f"FontName={font_name},FontSize={font_size},Bold={bold},Italic={italic},"
            f"PrimaryColour={primary_color},OutlineColour={outline_color},"
            f"Outline={outline_thickness},Shadow={shadow_offset},"
            f"Alignment={alignment},MarginV={margin_v}"
        )

        vf_filter = f"subtitles='{srt_escaped}':force_style='{style_str}'"

        cmd = [
            "ffmpeg",
            "-y",
            "-i", video_path,
            "-vf", vf_filter,
            "-c:a", "copy",
            output_path
        ]

        subprocess.run(cmd, check=True)

        return FileResponse(output_path, filename="output_with_subs.mp4", media_type="video/mp4")

    except subprocess.CalledProcessError as e:
        return JSONResponse({"error": f"FFmpeg failed: {e}"}, status_code=500)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
