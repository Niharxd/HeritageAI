FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-hin \
    tesseract-ocr-san \
    tesseract-ocr-tam \
    tesseract-ocr-tel \
    tesseract-ocr-ara \
    tesseract-ocr-fas \
    tesseract-ocr-ell \
    tesseract-ocr-lat \
    tesseract-ocr-chi-sim \
    tesseract-ocr-jpn \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements-deploy.txt .
RUN pip install --no-cache-dir -r requirements-deploy.txt

COPY . .

CMD uvicorn app:app --host 0.0.0.0 --port $PORT
