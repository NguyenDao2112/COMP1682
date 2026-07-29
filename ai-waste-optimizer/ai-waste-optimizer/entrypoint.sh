#!/bin/bash
set -e

echo "🚀 [Entrypoint] Starting AI Waste Optimizer Backend..."

# Seed clean project database (30 Bins / 3 Routes / 5 Users)
echo "🌱 [Entrypoint] Initializing & seeding clean project database..."
python /app/backend/seed_db.py

echo "✅ [Entrypoint] Database ready. Starting FastAPI server..."
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
