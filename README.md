# KrishiMitra

AI-enabled agricultural advisory web app for Indian farmers. The project combines:

- FastAPI backend
- React + Vite frontend
- Gemini-powered advisory and support chat
- Local open-source image inspection for crop photo validation
- Compliance guardrails for safer recommendations

## What The App Does

KrishiMitra helps a farmer:

- ask agriculture questions by text or voice
- upload crop images for basic crop-photo validation
- inspect soil inputs
- check mandi prices
- review compliance warnings before acting on advice
- use an in-app AI support assistant with voice input and voice playback

## Current Key Features

- Gemini advisory flow for agriculture queries
- Gemini support chat panel for free-form doubt clearing
- Multi-language UI selector
- Voice input in browser using Web Speech API
- Voice playback of assistant answers using browser speech synthesis
- Manual location editing in the header
- Manual crop override if detected crop is wrong
- Local image inspection with `openai/clip-vit-base-patch32`
- Compliance checks for pesticide safety and related rules
- Audit trail endpoints for advisory sessions

## Important Architecture Notes

### Advisory And Support

- Main advisory is handled by the backend agent
- Support chat uses Gemini through a dedicated conversational API
- The support panel is not a fixed FAQ; it sends real chat messages and recent history to the backend

### Image Inspection

Image inspection no longer depends on Gemini quota.

It now uses a local open-source vision model:

- default model: `openai/clip-vit-base-patch32`

This image layer is used for:

- crop-vs-non-crop validation
- clarity checks
- basic crop guess

The user can still manually choose the crop if the detected crop is wrong.

## Project Structure

```text
krishimitra/
|- backend/
|  |- main.py
|  |- agent/
|  |  |- core.py
|  |  |- prompts.py
|  |  `- tools.py
|  |- audit/
|  |  `- logger.py
|  |- compliance/
|  |  |- engine.py
|  |  |- pesticide_db.py
|  |  `- rules.py
|  |- services/
|  |  |- image_inspection.py
|  |  |- mandi.py
|  |  |- schemes.py
|  |  |- soil.py
|  |  `- weather.py
|  `- requirements.txt
|- frontend/
|  |- src/
|  |  |- App.jsx
|  |  |- components/
|  |  |- hooks/
|  |  `- utils/
|  `- package.json
`- README.md
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `backend/.env` with your keys:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
OPENWEATHER_API_KEY=your_key_here
AGMARKNET_API_KEY=your_key_here
IMAGE_INSPECTOR_MODEL=openai/clip-vit-base-patch32
HOST=0.0.0.0
PORT=8000
```

Run backend:

```bash
uvicorn main:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Default frontend URL:

- `http://localhost:3000`

Default backend URL:

- `http://127.0.0.1:8000`

## Environment Files

### Backend

File: `backend/.env.example`

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `OPENWEATHER_API_KEY`
- `AGMARKNET_API_KEY`
- `IMAGE_INSPECTOR_MODEL`
- `HOST`
- `PORT`

### Frontend

File: `frontend/.env.example`

- `VITE_API_URL`

You can point it to:

- `http://127.0.0.1:8000`
- or leave it aligned with your local backend host

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Basic API info |
| GET | `/health` | Health check |
| POST | `/api/advise` | Text advisory |
| POST | `/api/support/chat` | Conversational Gemini support chat |
| POST | `/api/image/inspect` | Crop image validation and crop guess |
| POST | `/api/advise/image` | Advisory using image input |
| GET | `/api/audit/{session_id}` | Session audit trail |
| GET | `/api/compliance/pesticides` | Pesticide lookup |
| GET | `/api/mandi/prices` | Mandi prices |

## Languages And Voice

The frontend supports a multi-language selector and browser-based speech tools.

Current UI language set includes:

- Hindi
- English
- Marathi
- Gujarati
- Punjabi
- Bengali
- Tamil
- Telugu

Notes:

- UI labels follow the selected language pack where available
- voice input depends on browser speech-recognition support
- voice playback depends on available browser/system voices
- generated advisory quality is best when backend language handling is available for that language

## Support Assistant

The app includes a floating support assistant that can:

- answer open-ended user questions
- keep chat context
- accept voice input
- speak answers aloud

Typical use cases:

- "Mere dhan me patte pe daag aa rahe hain, kya karun?"
- "Aaj soybean rokna chahiye ya bechna chahiye?"
- "Yeh dawa surakshit hai ya nahi?"

## Compliance Layer

The project includes compliance-focused backend checks such as:

- pesticide restriction checks
- banned/unsafe chemical handling
- rule-based safety validation
- warning/badge style output in advisory views

This layer is intended to reduce unsafe suggestions, especially around pesticide-related guidance.

## Local Image Model Notes

On first use, the local image inspection model may need to download weights. After the model is cached, repeated use is smoother.

If you want higher crop/disease accuracy later, the next step is to replace the zero-shot image inspector with a fine-tuned agriculture-specific model.

## Tech Stack

- Backend: FastAPI, Pydantic, Uvicorn
- AI advisory/support: Google Gemini API
- Image inspection: Transformers + Torch + Pillow
- Frontend: React, Vite
- Voice: Web Speech API + Speech Synthesis API

## Current Limitations

- Local image inspection is useful for validation and basic crop guess, but not a full disease-diagnosis model
- Some regional language flows may still rely on fallback text paths
- Browser speech features vary across devices and browsers
- Live mandi/weather quality depends on external API availability

## Recommended Next Improvements

- add an agriculture-specific fine-tuned crop classifier
- add disease-specific trained models
- strengthen full regional-language advisory generation
- improve offline caching and low-bandwidth behavior
- add deployment instructions for production hosting

## Quick Local Run

Backend:

```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

Then open:

- `http://localhost:3000`
