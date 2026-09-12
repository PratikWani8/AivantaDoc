# AivantaDoc AI Service

Built to match the supplied AivantaDoc AI-service specification: FastAPI, Groq-configurable inference, OCR, Pydantic validation, PostgreSQL, safe NLP-to-SQL, anomaly/risk scoring, multilingual query parameter, and a TRL SFTTrainer + PEFT training pipeline. fileciteturn0file0L17-L31

## Run
1. Python 3.11+
2. `python -m venv .venv`
3. Windows: `.venv\\Scripts\\Activate.ps1`
4. `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and set `GROQ_API_KEY`, `GROQ_MODEL`, and `DATABASE_URL`.
6. Install Tesseract OCR separately.
7. `uvicorn app.main:app --reload --port 8000`

Swagger: http://localhost:8000/docs
Health: http://localhost:8000/api/v1/health

## Endpoints
GET /api/v1/health
POST /api/v1/analyze-document
POST /api/v1/query
POST /api/v1/analyze-transaction
POST /api/v1/classify-document
POST /api/v1/extract-fields
POST /api/v1/generate-insights

## Backend integration
Node.js calls the exact endpoints above at `http://localhost:8000`. The document endpoint accepts multipart field `file`. The query endpoint accepts `query`, `language` (`en`,`hi`,`mr`) and optional `schema_context`.

## Safety
Only a single SELECT is accepted by the SQL validator; DML/DDL, comments, multiple statements, and unknown tables/columns are rejected. Use a dedicated PostgreSQL read-only account in production. The Node backend should repeat the validation before execution.

No fake business statistics are generated. Empty SQL results return: `No business data is available for this query.`

## Mistral
`training/train_nl2sql.py` is a ready training pipeline using TRL SFTTrainer and LoRA. It does not claim that Mistral is already fine-tuned. Configure `MISTRAL_ADAPTER_PATH` only after actual training.
