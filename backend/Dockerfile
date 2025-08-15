# -----------------------------
# Dockerfile for Audio-Subtitle Pipeline
# -----------------------------

# Use official Python 3.10 slim image
FROM python:3.10-slim

# -----------------------------
# System dependencies
# -----------------------------
RUN apt-get update && \
    apt-get install -y ffmpeg build-essential && \
    rm -rf /var/lib/apt/lists/*

# -----------------------------
# Set working directory
# -----------------------------
WORKDIR /app

# -----------------------------
# Copy and install Python dependencies
# -----------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# -----------------------------
# Copy application code
# -----------------------------
COPY . .

# -----------------------------
# Expose port
# -----------------------------
EXPOSE 8000

# -----------------------------
# Run FastAPI app
# -----------------------------
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
