# VAANIPath - AI-Powered Multilingual Content Localization Platform

VAANIPath is a comprehensive solution for localizing educational content across Indian languages. It leverages advanced AI/ML capabilities to translate, dub, and localize training materials, including videos, documents, and podcasts.

## 🌟 Platform Overview

The platform consists of three integrated modules:
1.  **Frontend**: A modern React-based learning management system.
2.  **Backend**: A robust FastAPI service managing users, courses, and document translations.
3.  **Localizer**: A high-performance ML service for video localization, TTS, and podcast generation using Grokq and Google Cloud / ElevenLabs TTS.

---

## 🚀 Quick Start Guide

### Prerequisites
-   **Environment**: Python 3.9+, Node.js 18+.
-   **Media Tools**: FFmpeg (Must be in system PATH).
-   **External Services**: Supabase (DB), Cloudinary (Storage), Groq (LLM).

### 1. Backend Setup (Port 8000)
```bash
cd VaaniPath-Backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
*Note: Ensure `.env` is configured with Supabase and Cloudinary keys.*

### 2. Localizer Setup (Port 8001)
```bash
cd VaaniPath-Localizer
pip install -r localizer/requirements.txt
python run_ml_service.py
```
*Note: This service handles video dubbing and podcast generation.*

### 3. Frontend Setup (Port 8080)
```bash
cd VaaniPath-Frontend
npm install
npm run dev
```
*Access the UI at http://localhost:8080*

---

## 🛠️ Key Product Features

### 🎬 Video Localization
-   **Audio Dubbing**: Automatic translation and voice-over in 11+ Indian regional languages.
-   **Dynamic Voice Seeding**: Supports multiple personas and genders.
-   **Lip-Sync & Sync**: Ensures translated audio matches video timing.

### 📄 Document Translation
-   **Real-time Translation**: Powered by the Backend's translation engine.
-   **Multi-format Support**: PDF and Image translation capability.
-   **Dynamic Banners**: Language-specific visual content (e.g., Hindi banners).

### 🎙️ AI Podcasts
-   **Script Generation**: AI-generated conversational scripts based on course content.
-   **Natural Voices**: High-quality TTS using Alex (Male) and Jordan (Female) personas.
-   **Multilingual Support**: Generate podcasts in Hindi, Bengali, Telugu, and more.

---

## 📂 System Architecture

```text
VAANIPath/
├── VaaniPath-Frontend/     # React + Vite + Tailwind
├── VaaniPath-Backend/      # FastAPI + Supabase + Celery
└── VaaniPath-Localizer/    # Python ML + Whisper + TTS + Groq
```

---

## 📁 Core Directory Details

### Backend Components
-   `app/api/`: REST endpoints for documents, courses, and auth.
-   `app/services/`: Integration with translation and storage APIs.

### Localizer Components
-   `localizer/api.py`: Core ML service endpoints.
-   `localizer/podcast_generator.py`: Logic for script and audio production.
-   `localizer/sample_data/`: Glossaries and sector-specific terminology.

### Frontend Components
-   `src/pages/`: Main application views (Course Player, Podcast Page).
-   `src/components/`: Reusable UI elements and localization hooks.

---

*Built for Smart India Hackathon 2025.*
