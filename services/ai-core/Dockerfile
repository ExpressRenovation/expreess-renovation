FROM python:3.11-slim

# Install system dependencies required for pdfplumber (Ghostscript etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpoppler-cpp-dev \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy our Hexagonal structured app
COPY . .

# Expose port for Cloud Run / Local
EXPOSE 8080

CMD ["uvicorn", "src.core.http.main:app", "--host", "0.0.0.0", "--port", "8080"]
