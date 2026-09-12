# AivantaDoc Backend

Production-oriented Node.js + Express backend for AivantaDoc.

## Stack

- Express
- PostgreSQL + Prisma
- MongoDB + Mongoose
- JWT + bcrypt
- Multer
- Axios
- Helmet
- CORS
- Rate limiting
- Joi validation

## Architecture

PostgreSQL stores normalized business/transaction data. MongoDB stores flexible document intelligence, OCR/AI metadata and processing state.

## Setup

1. Create PostgreSQL database `aivantadoc`.
2. Start MongoDB.
3. Copy `.env.example` to `.env` and set credentials/secrets.
4. Install dependencies:
   `npm install`
5. Generate Prisma client:
   `npm run prisma:generate`
6. Create/apply migrations:
   `npm run prisma:migrate`
7. Start:
   `npm run dev`

Backend: `http://localhost:5000`
Health: `GET /api/health`

## AI service contract

The backend calls:

- `GET /api/v1/health`
- `POST /api/v1/analyze-document`
- `POST /api/v1/analyze-transaction`
- `POST /api/v1/query`

Set `AI_SERVICE_URL` accordingly.

## Security

Uploaded files are stored outside public static hosting. AI-generated SQL is accepted only as a single read-only SELECT and is additionally checked against a deny-list and table/statement constraints.

For production, use a dedicated read-only PostgreSQL account for AI query execution and object storage such as S3-compatible storage with private URLs.

## Frontend base URL

`VITE_API_URL=http://localhost:5000/api`

Protected requests use:

`Authorization: Bearer <accessToken>`
