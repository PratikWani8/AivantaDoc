import { prisma } from "../config/prisma.js";

import { generateQuery } from "../services/ai.service.js";

import {
  validateReadOnlySql,
} from "../services/sql.service.js";

import { env } from "../config/env.js";

/*
 * ============================================================
 * AI QUERY
 * POST /api/ai/query
 * ============================================================
 *
 * Expected body:
 *
 * {
 *   "query": "Show me my top vendors by spending",
 *   "language": "en"
 * }
 *
 * ============================================================
 */

export async function queryAi(req, res, next) {
  try {
    const userId = req.user.id;

    const query =
      typeof req.body?.query === "string"
        ? req.body.query.trim()
        : "";

    const language =
      typeof req.body?.language === "string"
        ? req.body.language
        : "en";

    /* ========================================================
       VALIDATE USER QUERY
       ======================================================== */

    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: "QUERY_REQUIRED",
          message: "AI query is required",
        },
      });
    }

    if (query.length > 2000) {
      return res.status(400).json({
        success: false,
        error: {
          code: "QUERY_TOO_LONG",
          message:
            "AI query must not exceed 2000 characters",
        },
      });
    }

    /* ========================================================
       DATABASE SCHEMA CONTEXT
       ======================================================== */

    const schemaContext = {
      tables: [
        "vendors",
        "purchase_orders",
        "purchase_order_items",
        "invoices",
        "invoice_items",
        "receipts",
        "delivery_notes",
        "transactions",
        "risk_events",
        "anomalies",
        "erp_records",
      ],

      /*
       * Important:
       * The AI must only generate queries against
       * tables provided here.
       */
      rules: [
        "Only generate SELECT queries.",
        "Never generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, or REVOKE.",
        "Only use the provided tables.",
        "Always scope business data to the authenticated user.",
        "Do not expose passwords, tokens, secrets, or authentication data.",
      ],
    };

    /* ========================================================
       GENERATE SQL WITH AI
       ======================================================== */

    const ai = await generateQuery({
      query,
      language,
      schema_context: schemaContext,
      user_id: userId,
    });

    const data =
      ai?.data ??
      ai ??
      {};

    /* ========================================================
       VALIDATE GENERATED SQL
       ======================================================== */

    if (
      typeof data.sql !== "string" ||
      !data.sql.trim()
    ) {
      return res.status(422).json({
        success: false,
        error: {
          code: "AI_SQL_MISSING",
          message:
            "AI did not generate a valid SQL query",
        },
      });
    }

    /*
     * validateReadOnlySql should reject:
     *
     * INSERT
     * UPDATE
     * DELETE
     * DROP
     * ALTER
     * TRUNCATE
     * CREATE
     * GRANT
     * REVOKE
     * multiple statements
     */
    const sql =
      validateReadOnlySql(data.sql);

    /* ========================================================
       EXECUTE SQL
       ======================================================== */

    let rows;

    try {
      rows =
        await prisma.$queryRawUnsafe(sql);
    } catch (sqlError) {
      console.error(
        "AI SQL EXECUTION ERROR:",
        sqlError
      );

      return res.status(422).json({
        success: false,
        error: {
          code: "AI_SQL_EXECUTION_FAILED",
          message:
            "The generated query could not be executed",
        },
      });
    }

    /* ========================================================
       LIMIT RESULT SIZE
       ======================================================== */

    const maxRows =
      Number(env.aiSqlMaxRows) || 500;

    const limitedRows =
      Array.isArray(rows)
        ? rows.slice(0, maxRows)
        : [];

    /* ========================================================
       COLUMNS
       ======================================================== */

    const columns =
      limitedRows.length > 0
        ? Object.keys(
            limitedRows[0]
          )
        : [];

    /* ========================================================
       RESPONSE
       ======================================================== */

    res.json({
      success: true,

      data: {
        answer:
          data.answer ||
          "Query completed.",

        sql,

        rows: limitedRows,

        columns,

        visualization:
          data.visualization &&
          typeof data.visualization === "object"
            ? data.visualization
            : {},

        insights:
          Array.isArray(data.insights)
            ? data.insights
            : [],

        recommendations:
          Array.isArray(
            data.recommendations
          )
            ? data.recommendations
            : [],

        meta: {
          rowCount: limitedRows.length,

          truncated:
            Array.isArray(rows) &&
            rows.length > maxRows,

          maxRows,
        },
      },
    });
  } catch (e) {
    console.error(
      "AI QUERY ERROR:",
      e
    );

    next(e);
  }
}