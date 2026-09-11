import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(254)
    .required(),

  password: Joi.string()
    .min(8)
    .max(128)
    .required(),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(254)
    .required(),

  password: Joi.string()
    .required(),
});

/*
 * ============================================================
 * AI QUERY
 * ============================================================
 */

export const aiQuerySchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(2)
    .max(2000)
    .required(),

  language: Joi.string()
    .valid("en", "hi", "mr")
    .default("en"),
});

/*
 * ============================================================
 * ID
 * ============================================================
 */

export const idSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required(),
});

/*
 * ============================================================
 * PAGINATION
 * ============================================================
 */

export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  search: Joi.string()
    .trim()
    .max(200)
    .allow(""),

  sort: Joi.string()
    .trim()
    .max(50),

  order: Joi.string()
    .valid("asc", "desc")
    .default("desc"),
});

/*
 * ============================================================
 * RISK FILTER
 * ============================================================
 */

export const riskFilterSchema = Joi.object({
  severity: Joi.string()
    .valid(
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL"
    ),
});

/*
 * ============================================================
 * DOCUMENT STATUS FILTER
 * ============================================================
 */

export const documentFilterSchema = Joi.object({
  status: Joi.string()
    .valid(
      "QUEUED",
      "PROCESSING",
      "COMPLETED",
      "FAILED"
    ),

  documentType: Joi.string()
    .valid(
      "INVOICE",
      "PURCHASE_ORDER",
      "RECEIPT",
      "DELIVERY_NOTE",
      "UNKNOWN"
    ),
});