FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for building Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies with CPU-only torch for faster deployment
RUN pip install --no-cache-dir --upgrade pip && \
    pip install torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Download required NLTK data at build time
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')" && \
    python -c "from transformers import pipeline; pipeline('sentiment-analysis', model='distilbert/distilbert-base-uncased-finetuned-sst-2-english', revision='714eb0f')"

# Create a non-root user for security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/docs || exit 1

# Run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]