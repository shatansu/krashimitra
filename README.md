# KrishiMitra 🌾 — AI Agricultural Advisory Agent

> **Domain-Specialized AI Agent with Compliance Guardrails**  
> Built for smallholder farmers in India (Madhya Pradesh focus)

---

## Problem Solved

India has **150M+ smallholder farmers** who lose 30-40% of crops to preventable issues — because they get:
- Wrong advice, too late
- No knowledge of government schemes they qualify for  
- No way to check if a pesticide is banned or safe
- No real-time market price intelligence

KrishiMitra is a voice-first, multilingual AI agent that gives every farmer access to an expert agronomist — in Hindi, in their dialect, even on 2G.

---

## Judging Criteria Coverage

| Criterion | How we address it |
|---|---|
| **Domain expertise** | Soil science, IPM, mandi economics, crop calendars (ICAR-sourced) |
| **Compliance guardrails** | 6-check engine: CIB&RC banned list, PHI window, NPOP organic, dosage, PPE, restricted chemicals |
| **Edge-case handling** | Offline-safe mock data, API fallbacks, PHI window blocking, organic farmer detection |
| **Full task completion** | Voice → analysis → compliance → audit → TTS response in one flow |
| **Auditability** | Immutable session audit trail — every tool call, LLM step, compliance decision logged |

---

## Architecture

```
Farmer Input (Voice / Photo / Soil / Text)
        ↓
FastAPI Backend
        ├── Input Processor (STT, vision, NLP)
        ├── Agent Orchestrator (Claude claude-opus-4-5 with 6 tools)
        │       ├── get_weather()         → OpenWeatherMap
        │       ├── get_mandi_prices()    → e-NAM / Agmarknet
        │       ├── analyze_soil()        → ICAR guidelines
        │       ├── check_pesticide_safety() → CIB&RC database
        │       ├── get_govt_schemes()    → PM-KISAN, PMFBY, KCC
        │       └── get_crop_calendar()   → KVK / SAU data
        ├── Compliance Engine (6 guardrail checks)
        └── Audit Logger (immutable trail)
        ↓
Output: Hindi advisory + action steps + market signal + scheme eligibility
```

---

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
# Opens at http://localhost:3000
```

> **Demo mode**: Works without OpenWeather / Agmarknet keys — uses realistic mock data.

---

## Compliance Guardrail System

The compliance engine runs **6 checks** on every advisory before it reaches the farmer:

### 1. CIB&RC Banned Pesticide Check
- 27 banned chemicals blocked (Endosulfan, Monocrotophos, Carbofuran, etc.)
- Automatic safe alternative suggestions

### 2. PHI Window Check
- Pre-Harvest Interval enforced per crop (wheat: 15 days, soybean: 21 days, etc.)
- If crop is within PHI window → spraying blocked regardless of chemical

### 3. NPOP Organic Standards
- Detects if farmer has organic context from query
- Blocks ALL synthetic pesticides → suggests bio-pesticides only
- NPOP-approved input list (Trichoderma, Beauveria, neem oil, etc.)

### 4. Dosage Limit Check
- Flags unusually high dosage recommendations
- Cross-checks against label-recommended ranges

### 5. PPE Reminder
- Any chemical advisory without protective equipment mention → WARNING status
- Ensures gloves + mask always recommended

### 6. Restricted Chemical Flag
- Chlorpyrifos, Acephate, etc. → requires license verification note

---

## Demo Script (5 minutes)

### Scene 1: Voice query in Hindi
> "मेरे गेहूं में पीले पत्ते आ रहे हैं, क्या करूँ?"  
> *(Yellow leaves on my wheat, what do I do?)*

**What happens:**
1. Agent calls `get_weather()` → checks humidity (disease risk)
2. Agent calls `analyze_soil()` → checks for nitrogen deficiency
3. Agent calls `check_pesticide_safety()` → verifies any chemical before recommending
4. Compliance engine checks PHI + banned list
5. Response in Hindi: cause identified (likely nitrogen/zinc deficiency), actionable steps, no banned chemicals, PPE reminder included

### Scene 2: Compliance BLOCKED demo
> Ask: "क्या मैं Endosulfan डाल सकता हूँ?"  
> *(Can I use Endosulfan?)*

**What happens:**
- Compliance engine immediately catches banned chemical
- Response: ✕ BLOCKED — explains why, suggests Neem oil / Chlorpyrifos alternatives

### Scene 3: Crop photo + disease detection
- Upload a photo of a diseased crop leaf
- Agent uses vision to identify disease, maps to compliant treatment

### Scene 4: Mandi price intelligence
> "आज सोयाबीन बेचूँ या रखूँ?"  
> *(Should I sell soybean today or hold?)*

- Agent fetches current mandi price
- Compares with MSP (₹4,892/quintal)
- Generates SELL / HOLD signal with trend analysis

### Scene 5: Audit trail
- Click "निर्णय का लेखा-जोखा देखें" (View audit trail)
- Shows every step: tool calls, data sources, compliance checks, LLM reasoning

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/advise` | Main advisory (text/soil input) |
| POST | `/api/advise/image` | Advisory with crop photo |
| GET | `/api/audit/{session_id}` | Full audit trail |
| GET | `/api/mandi/prices?crop=wheat&location=Rewa` | Mandi prices |
| GET | `/api/compliance/pesticides?name=Endosulfan` | Pesticide check |

---

## Data Sources

| Source | Data | Status |
|---|---|---|
| CIB&RC India | Banned/restricted pesticide list | Embedded database |
| ICAR Guidelines | Fertilizer doses, crop calendars | Embedded database |
| NPOP | Organic farming approved inputs | Embedded database |
| OpenWeatherMap | Live weather + 7-day forecast | API (free tier) |
| e-NAM / Agmarknet | Mandi prices | API (data.gov.in) |
| Ministry of Agriculture | PM-KISAN, PMFBY, KCC details | Embedded database |
| Soil Health Card portal | SHC interpretation | Embedded ICAR logic |

---

## Tech Stack

- **Backend**: Python 3.11, FastAPI,Gemini (with tool use)
- **Frontend**: React 18, Vite, Web Speech API (voice)
- **AI**: Claude claude-opus-4-5 with 6 custom tools, multi-modal (vision + text)
- **Compliance**: Custom rule engine (no LLM dependency for guardrails)

---

## Team

Built for the Domain-Specialized AI Agents with Compliance Guardrails hackathon.

*Kisan Helpline: 1800-180-1551 | PM-KISAN: pmkisan.gov.in | PMFBY: pmfby.gov.in*