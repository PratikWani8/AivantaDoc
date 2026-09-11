import { prisma } from "../config/prisma.js";

import {
  Document,
  DocumentMetadata,
  OcrResult,
  AiAnalysis,
  ProcessingJob,
} from "../models/document.model.js";

import {
  analyzeDocument,
  analyzeTransaction,
} from "./ai.service.js";

/* ============================================================
   HELPERS
   ============================================================ */

function num(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function dateOrNull(value) {
  if (!value) return null;

  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? null
    : d;
}

function normalizeType(type) {
  const normalized =
    String(type || "UNKNOWN")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

  if (
    [
      "INVOICE",
      "PURCHASE_ORDER",
      "RECEIPT",
      "DELIVERY_NOTE",
    ].includes(normalized)
  ) {
    return normalized;
  }

  return "UNKNOWN";
}

function firstValue(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}

function normalizeRisk(value, fallback = "LOW") {
  const risk =
    String(value || "")
      .trim()
      .toUpperCase();

  return [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ].includes(risk)
    ? risk
    : fallback;
}

/* ============================================================
   CREATE DOCUMENT JOB
   ============================================================ */

export async function createDocumentJob({
  file,
  ownerId,
}) {
  if (!file) {
    throw Object.assign(
      new Error("Document file is required"),
      {
        statusCode: 422,
        code: "FILE_REQUIRED",
      }
    );
  }

  const doc = await Document.create({
    ownerId,

    originalName:
      file.originalname,

    storedName:
      file.filename,

    path:
      file.path,

    mimeType:
      file.mimetype,

    size:
      file.size,

    status:
      "QUEUED",
  });

  await ProcessingJob.create({
    documentId: doc._id,
    status: "QUEUED",
  });

  /*
   * Process asynchronously.
   *
   * Upload endpoint can immediately return 202.
   */
  processDocument(
    doc._id.toString()
  ).catch((err) => {
    console.error(
      "DOCUMENT PROCESSING FAILED:",
      err
    );
  });

  return doc;
}

/* ============================================================
   PROCESS DOCUMENT
   ============================================================ */

export async function processDocument(
  documentId
) {
  const doc =
    await Document.findById(
      documentId
    );

  if (!doc) {
    throw Object.assign(
      new Error("Document not found"),
      {
        statusCode: 404,
        code: "DOCUMENT_NOT_FOUND",
      }
    );
  }

  const job =
    await ProcessingJob.findOne({
      documentId,
    }).sort({
      createdAt: -1,
    });

  try {
    /*
     * Processing
     */
    doc.status = "PROCESSING";
    doc.error = undefined;

    await doc.save();

    if (job) {
      job.status = "PROCESSING";
      job.startedAt = new Date();
      job.attempts =
        Number(job.attempts || 0) + 1;

      await job.save();
    }

    /*
     * AI / OCR
     */
    const result =
      await analyzeDocument(
        doc.path,
        doc.originalName,
        doc.mimeType
      );

    const data =
      result?.data ??
      result ??
      {};

    /*
     * Document type
     */
    const type = normalizeType(
      firstValue(
        data.documentType,
        data.document_type,
        data.type
      )
    );

    doc.documentType = type;

    /*
     * Store metadata
     */
    await DocumentMetadata.create({
      documentId: doc._id,

      schemaVersion:
        "1.0",

      metadata:
        data.metadata &&
        typeof data.metadata === "object"
          ? data.metadata
          : {},
    });

    /*
     * Store OCR + extracted fields
     */
    const extractedFields =
      data.fields ||
      data.extracted ||
      data.extractedData ||
      {};

    await OcrResult.create({
      documentId: doc._id,

      text:
        data.text ||
        data.ocrText ||
        data.ocr_text ||
        "",

      fields:
        extractedFields,
    });

    /*
     * Store AI result
     */
    await AiAnalysis.create({
      documentId: doc._id,

      model:
        data.model ||
        "configured-ai-service",

      result:
        data,
    });

    /*
     * Persist structured business data
     */
    await persistBusinessRecord(
      doc,
      data,
      type
    );

    /*
     * Completed
     */
    doc.status = "COMPLETED";
    doc.error = undefined;

    await doc.save();

    if (job) {
      job.status = "COMPLETED";
      job.completedAt =
        new Date();

      await job.save();
    }

    return doc;
  } catch (err) {
    console.error(
      "DOCUMENT PROCESSING ERROR:",
      err
    );

    doc.status = "FAILED";
    doc.error =
      err?.message ||
      "Document processing failed";

    await doc.save();

    if (job) {
      job.status = "FAILED";

      job.error =
        err?.message ||
        "Document processing failed";

      job.completedAt =
        new Date();

      await job.save();
    }

    throw err;
  }
}

/* ============================================================
   PERSIST BUSINESS RECORD
   ============================================================ */

async function persistBusinessRecord(
  doc,
  data,
  type
) {
  /*
   * Currently structured persistence is
   * implemented for invoices.
   */
  if (type !== "INVOICE") {
    return;
  }

  const extracted =
    data.fields ||
    data.extracted ||
    data.extractedData ||
    data ||
    {};

  /* ==========================================================
     INVOICE NUMBER
     ========================================================== */

  const invoiceNumber =
    firstValue(
      extracted.invoice_number,
      extracted.invoiceNumber,
      extracted.invoice_no,
      extracted.invoiceNo,
      extracted.number
    );

  /*
   * Invoice number is required to create
   * the PostgreSQL invoice record.
   */
  if (!invoiceNumber) {
    console.warn(
      "Invoice number was not extracted:",
      doc.originalName
    );

    return;
  }

  /* ==========================================================
     VENDOR
     ========================================================== */

  const vendorData =
    extracted.vendor &&
    typeof extracted.vendor === "object"
      ? extracted.vendor
      : {};

  const vendorName =
    firstValue(
      vendorData.name,
      vendorData.vendorName,
      extracted.vendorName,
      extracted.vendor_name
    );

  const vendorTaxId =
    firstValue(
      vendorData.taxId,
      vendorData.tax_id,
      extracted.vendorTaxId,
      extracted.vendor_tax_id
    );

  let vendor = null;

  if (vendorName) {
    /*
     * First try existing vendor by name.
     */
    vendor =
      await prisma.vendor.findFirst({
        where: {
          name: String(
            vendorName
          ),
        },
      });

    /*
     * Create vendor if it doesn't exist.
     */
    if (!vendor) {
      vendor =
        await prisma.vendor.create({
          data: {
            name: String(
              vendorName
            ),

            taxId:
              vendorTaxId
                ? String(vendorTaxId)
                : null,
          },
        });
    }
  }

  /* ==========================================================
     PURCHASE ORDER
     ========================================================== */

  const poNumber =
    firstValue(
      extracted.purchase_order_number,
      extracted.purchaseOrderNumber,
      extracted.po_number,
      extracted.poNumber,
      extracted.po
    );

  let purchaseOrderId = null;

  if (poNumber) {
    const po =
      await prisma.purchaseOrder.findUnique({
        where: {
          poNumber: String(
            poNumber
          ),
        },
      });

    purchaseOrderId =
      po?.id || null;
  }

  /* ==========================================================
     INVOICE FIELDS
     ========================================================== */

  const invoiceDate =
    firstValue(
      extracted.invoice_date,
      extracted.invoiceDate,
      extracted.date
    );

  const dueDate =
    firstValue(
      extracted.due_date,
      extracted.dueDate
    );

  const subtotal =
    firstValue(
      extracted.subtotal,
      extracted.sub_total,
      extracted.subTotal
    );

  const tax =
    firstValue(
      extracted.tax,
      extracted.taxAmount,
      extracted.tax_amount
    );

  const discount =
    firstValue(
      extracted.discount,
      extracted.discountAmount,
      extracted.discount_amount
    );

  const total =
    firstValue(
      extracted.total,
      extracted.totalAmount,
      extracted.total_amount,
      extracted.grandTotal,
      extracted.grand_total
    );

  const currency =
    firstValue(
      extracted.currency,
      extracted.currencyCode,
      extracted.currency_code
    ) || "INR";

  /* ==========================================================
     ITEMS
     ========================================================== */

  const items =
    Array.isArray(
      extracted.items
    )
      ? extracted.items
      : [];

  /* ==========================================================
     CREATE INVOICE
     ========================================================== */

  const invoice =
    await prisma.invoice.create({
      data: {
        invoiceNumber:
          String(invoiceNumber),

        invoiceDate:
          dateOrNull(
            invoiceDate
          ),

        dueDate:
          dateOrNull(
            dueDate
          ),

        vendorId:
          vendor?.id ||
          null,

        userId:
          doc.ownerId,

        purchaseOrderId,

        currency:
          String(currency),

        subtotal:
          num(subtotal),

        tax:
          num(tax),

        discount:
          num(discount),

        total:
          num(total),

        items: {
          create:
            items.map(
              (item) => ({
                description:
                  String(
                    firstValue(
                      item.description,
                      item.name
                    ) ||
                    "Unspecified item"
                  ),

                quantity:
                  num(
                    firstValue(
                      item.quantity,
                      item.qty
                    ),
                    1
                  ),

                unitPrice:
                  num(
                    firstValue(
                      item.unit_price,
                      item.unitPrice,
                      item.price
                    )
                  ),

                tax:
                  num(
                    firstValue(
                      item.tax,
                      item.taxAmount
                    )
                  ),

                total:
                  num(
                    firstValue(
                      item.total,
                      item.amount
                    )
                  ),
              })
            ),
        },
      },

      include: {
        items: true,
        vendor: true,
        purchaseOrder: true,
      },
    });

  /* ==========================================================
     AI TRANSACTION ANALYSIS
     ========================================================== */

  const analysis =
    await analyzeTransaction({
      documentConfidence:
        num(
          firstValue(
            data.documentConfidence,
            data.document_confidence,
            data.confidence
          )
        ),

      invoice: {
        id:
          invoice.id,

        invoiceNumber:
          invoice.invoiceNumber,

        total:
          Number(
            invoice.total
          ),

        items:
          invoice.items,
      },

      purchaseOrderId,

      vendorId:
        vendor?.id ||
        null,
    }).catch((err) => {
      console.error(
        "TRANSACTION AI ANALYSIS FAILED:",
        err
      );

      return null;
    });

  const analysisData =
    analysis?.data ??
    analysis ??
    {};

  /* ==========================================================
     TRANSACTION
     ========================================================== */

  const transaction =
    await prisma.transaction.create({
      data: {
        userId:
          doc.ownerId,

        invoiceId:
          invoice.id,

        vendorId:
          vendor?.id ||
          null,

        documentConfidence:
          num(
            firstValue(
              analysisData.documentConfidence,
              data.documentConfidence,
              data.confidence
            )
          ),

        poMatchScore:
          num(
            analysisData.poMatchScore
          ),

        vendorTrustScore:
          num(
            analysisData.vendorTrustScore
          ),

        priceConsistencyScore:
          num(
            analysisData.priceConsistencyScore
          ),

        duplicateProbability:
          num(
            analysisData.duplicateProbability
          ),

        transactionTrustScore:
          num(
            analysisData.transactionTrustScore
          ),

        riskLevel:
          normalizeRisk(
            analysisData.riskLevel,
            "LOW"
          ),

        riskExplanation:
          firstValue(
            analysisData.explanation,
            analysisData.riskExplanation
          ),

        potentialLeakage:
          num(
            analysisData.potentialLeakage
          ),
      },
    });

  /* ==========================================================
     ANOMALIES
     ========================================================== */

  const anomalies =
    Array.isArray(
      analysisData.anomalies
    )
      ? analysisData.anomalies
      : [];

  for (const item of anomalies) {
    await prisma.anomaly.create({
      data: {
        transactionId:
          transaction.id,

        type:
          String(
            item.type ||
            "UNKNOWN"
          ),

        score:
          num(
            firstValue(
              item.score,
              item.confidence
            )
          ),

        severity:
          normalizeRisk(
            item.severity,
            "MEDIUM"
          ),

        explanation:
          String(
            item.explanation ||
            "Anomaly detected"
          ),
      },
    });
  }

  /* ==========================================================
     RISKS
     ========================================================== */

  const risks =
    Array.isArray(
      analysisData.risks
    )
      ? analysisData.risks
      : [];

  for (const risk of risks) {
    await prisma.riskEvent.create({
      data: {
        transactionId:
          transaction.id,

        type:
          String(
            risk.type ||
            "AI_RISK"
          ),

        severity:
          normalizeRisk(
            risk.severity,
            transaction.riskLevel
          ),

        confidence:
          num(
            risk.confidence
          ),

        amount:
          risk.amount == null
            ? null
            : num(
                risk.amount
              ),

        explanation:
          String(
            risk.explanation ||
            transaction.riskExplanation ||
            "Risk identified"
          ),

        recommendation:
          risk.recommendation
            ? String(
                risk.recommendation
              )
            : null,
      },
    });
  }

  /* ==========================================================
     ERP RECORD
     ========================================================== */

  await prisma.erpRecord.create({
    data: {
      transactionId:
        transaction.id,

      vendorId:
        vendor?.id ||
        null,

      invoiceNumber:
        invoice.invoiceNumber,

      invoiceDate:
        invoice.invoiceDate,

      purchaseOrderId,

      subtotal:
        invoice.subtotal,

      tax:
        invoice.tax,

      total:
        invoice.total,

      currency:
        invoice.currency,

      itemsJson:
        invoice.items.map(
          (item) => ({
            description:
              item.description,

            quantity:
              Number(
                item.quantity
              ),

            unitPrice:
              Number(
                item.unitPrice
              ),

            tax:
              Number(
                item.tax
              ),

            total:
              Number(
                item.total
              ),
          })
        ),

      verificationStatus:
        "PENDING",
    },
  });

  doc.postgresqlInvoiceId =
    invoice.id;

  doc.transactionId =
    transaction.id;

  await doc.save();

  return {
    invoice,
    transaction,
  };
}