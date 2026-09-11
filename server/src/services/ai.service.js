import axios from "axios";
import FormData from "form-data";
import fs from "node:fs";
import { env } from "../config/env.js";

const client = axios.create({
  baseURL: env.aiServiceUrl,
  timeout: env.aiServiceTimeoutMs,
});

export async function aiHealth() {
  const { data } = await client.get(
    "/api/v1/health",
    {
      timeout: 10000,
    }
  );

  return data;
}

export async function analyzeDocument(
  filePath,
  originalName,
  mimeType
) {
  if (!fs.existsSync(filePath)) {
    throw Object.assign(
      new Error(
        `Document file not found: ${filePath}`
      ),
      {
        statusCode: 500,
        code: "DOCUMENT_FILE_NOT_FOUND",
      }
    );
  }

  const form = new FormData();

  form.append(
    "file",
    fs.createReadStream(filePath),
    {
      filename: originalName,
      contentType: mimeType,
    }
  );

  try {
    const { data } = await client.post(
      "/api/v1/analyze-document",
      form,
      {
        headers: {
          ...form.getHeaders(),
        },

        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return data;
  } catch (error) {
    console.error(
      "AI DOCUMENT SERVICE ERROR:",
      error.response?.data ||
        error.message
    );

    throw Object.assign(
      new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "AI document analysis failed"
      ),
      {
        statusCode:
          error.response?.status || 502,

        code: "AI_DOCUMENT_ANALYSIS_FAILED",

        cause: error,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| Analyze Transaction
|--------------------------------------------------------------------------
*/

export async function analyzeTransaction(
  payload
) {
  try {
    const { data } =
      await client.post(
        "/api/v1/analyze-transaction",
        payload
      );

    return data;
  } catch (error) {
    console.error(
      "AI TRANSACTION SERVICE ERROR:",
      error.response?.data ||
        error.message
    );

    throw Object.assign(
      new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "AI transaction analysis failed"
      ),
      {
        statusCode:
          error.response?.status || 502,

        code: "AI_TRANSACTION_ANALYSIS_FAILED",

        cause: error,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| AI Natural Language SQL Query
|--------------------------------------------------------------------------
*/

export async function generateQuery(
  payload
) {
  try {
    const { data } =
      await client.post(
        "/api/v1/query",
        payload
      );

    return data;
  } catch (error) {
    console.error(
      "AI QUERY SERVICE ERROR:",
      error.response?.data ||
        error.message
    );

    throw Object.assign(
      new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "AI query generation failed"
      ),
      {
        statusCode:
          error.response?.status || 502,

        code: "AI_QUERY_FAILED",

        cause: error,
      }
    );
  }
}