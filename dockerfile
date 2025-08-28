# --- Frontend Stage ---
FROM node:18 AS frontend
WORKDIR /app
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# --- Backend Stage ---
FROM python:3.11-slim AS backend
WORKDIR /app
COPY backend/ ./backend/
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

# --- Final Stage ---
FROM python:3.11-slim

# Install OpenCV dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend code and dependencies
COPY --from=backend /app/backend /app/backend
COPY --from=backend /usr/local /usr/local

# Copy static frontend
COPY --from=frontend /app/frontend/out /app/frontend/out

# Set working dir and Python path
ENV PYTHONPATH=/app/backend

# Expose FastAPI port
EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

