import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  Shield,
  Download,
  Check,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import RiskBadge from "../../components/ui/RiskBadge";
import ErrorState from "../../components/ui/ErrorState";
import Modal from "../../components/ui/Modal";

import { documentApi } from "../../api/documentApi";
import { useLanguage } from "../../context/LanguageContext";

import {
  formatCurrency,
  formatDate,
  formatPercent,
  getErrorMessage,
} from "../../utils/helpers";

import toast from "react-hot-toast";

function isObject(value) {
  return value !== null && typeof value === "object";
}

function primitiveValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return null;
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
}

function toSafeText(value, fallback = "—") {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value)
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (Array.isArray(value)) {
    const result = value
      .map((item) => toSafeText(item, ""))
      .filter(Boolean)
      .join(", ")

    return result || fallback
  }

  if (isPlainObject(value)) {
    // Vendor object
    if (
      value.name !== undefined &&
      value.name !== null
    ) {
      const name = String(value.name)

      if (
        value.tax_id !== undefined &&
        value.tax_id !== null &&
        value.tax_id !== ""
      ) {
        return `${name} (${String(value.tax_id)})`
      }

      return name
    }

    if (
      value.value !== undefined &&
      value.value !== null
    ) {
      return toSafeText(value.value, fallback)
    }

    if (
      value.label !== undefined &&
      value.label !== null
    ) {
      return toSafeText(value.label, fallback)
    }

    return Object.entries(value)
      .map(([key, val]) => {
        const text = toSafeText(val, "")
        return text
          ? `${key.replace(/_/g, " ")}: ${text}`
          : ""
      })
      .filter(Boolean)
      .join(" • ") || fallback
  }

  return String(value)
}

function safeDisplayValue(value) {
  return toSafeText(value, "—")
}

function safeObjectDisplay(object) {
  if (!object || typeof object !== "object") {
    return safeDisplayValue(object);
  }

  if (object.name !== undefined && object.name !== null) {
    return String(object.name);
  }

  if (
    object.value !== undefined &&
    object.value !== null
  ) {
    return String(object.value);
  }

  return (
    <div className="space-y-1">
      {Object.entries(object).map(([key, value]) => (
        <div key={key} className="text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-400">
            {key.replace(/_/g, " ")}:
          </span>{" "}
          <span className="text-gray-900 dark:text-gray-100">
            {safeDisplayValue(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   FIELD
============================================================ */

function Field({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        {label}
      </p>

      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
        {safeDisplayValue(value)}
      </div>
    </div>
  );
}

/* ============================================================
   DOCUMENT DETAIL PAGE
============================================================ */

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ============================================================
     FETCH DOCUMENT
  ============================================================ */

  const fetchDoc = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const res = await documentApi.getById(id);

      const data = res.data?.data || res.data;

      console.log("DOCUMENT RESPONSE:", data);
      console.log("OCR FIELDS:", data?.ocr?.fields);
      console.log("AI DATA:", data?.ai);

      setDoc(data);
    } catch (err) {
      console.error("DOCUMENT FETCH ERROR:", err);

      setError(
        getErrorMessage(err) ||
          "Failed to load document."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [id]);

  /* ============================================================
     ACTIONS
  ============================================================ */

  const handleAction = async () => {
    if (!confirmModal || !id) return;

    setActionLoading(true);

    try {
      if (confirmModal.action === "approve") {
        await documentApi.approve(id);
      } else if (confirmModal.action === "reject") {
        await documentApi.reject(
          id,
          "User rejection"
        );
      } else if (confirmModal.action === "verify") {
        await documentApi.verify(id);
      }

      toast.success(
        `Document ${confirmModal.action}d successfully.`
      );

      setConfirmModal(null);

      await fetchDoc();
    } catch (err) {
      console.error(
        "DOCUMENT ACTION ERROR:",
        err
      );

      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Document action failed.";

      toast.error(
        typeof message === "string"
          ? message
          : "Document action failed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ============================================================
     EXPORT
  ============================================================ */

  const handleExport = async () => {
    try {
      const res = await documentApi.export(id);

      const blob = new Blob([res.data], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `document-${id}.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      toast.success("Document exported.");
    } catch (err) {
      console.error("EXPORT ERROR:", err);
      toast.error("Export failed.");
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-48" />

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl"
              />
            )
          )}
        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (error) {
    return (
      <ErrorState
        title={t("common.error")}
        description={
          typeof error === "string"
            ? error
            : "Failed to load document."
        }
        onRetry={fetchDoc}
      />
    );
  }

  /* ============================================================
     NOT FOUND
  ============================================================ */

  if (!doc) {
    return (
      <ErrorState
        title={t("common.notFoundError")}
      />
    );
  }

  /* ============================================================
     OCR / AI
  ============================================================ */

  const ocrFields =
    doc.ocr?.fields ||
    doc.ocrResult?.fields ||
    doc.extractedData?.fields ||
    {};

  const aiData =
    doc.ai?.result ||
    doc.ai ||
    doc.aiAnalysis?.result ||
    doc.aiAnalysis ||
    {};

  /* ============================================================
     INVOICE NUMBER
  ============================================================ */

  const invoiceNumber =
    doc.invoiceNumber ??
    ocrFields.invoiceNumber ??
    ocrFields.invoice_number ??
    ocrFields.invoiceNo ??
    ocrFields.invoice_no ??
    null;

  /* ============================================================
     INVOICE DATE
  ============================================================ */

  const invoiceDate =
    doc.invoiceDate ??
    ocrFields.invoiceDate ??
    ocrFields.invoice_date ??
    null;

  /* ============================================================
     PO NUMBER
  ============================================================ */

  const poNumber =
    doc.poNumber ??
    ocrFields.poNumber ??
    ocrFields.po_number ??
    ocrFields.purchaseOrderNumber ??
    ocrFields.purchase_order_number ??
    null;

  /* ============================================================
   VENDOR
============================================================ */

const vendorSources = [
  ocrFields.vendor,
  doc.vendor,
  doc.vendorName,
  ocrFields.vendorName,
  ocrFields.vendor_name,
  ocrFields.supplierName,
  ocrFields.supplier_name,
]

let vendor = null

for (const source of vendorSources) {
  if (
    source === null ||
    source === undefined ||
    source === ""
  ) {
    continue
  }

  if (
    typeof source === "string" ||
    typeof source === "number"
  ) {
    vendor = String(source)
    break
  }

  if (
    typeof source === "object" &&
    !Array.isArray(source)
  ) {
    if (
      source.name !== null &&
      source.name !== undefined &&
      String(source.name).trim()
    ) {
      vendor = String(source.name).trim()
      break
    }

    if (
      source.vendorName !== null &&
      source.vendorName !== undefined &&
      String(source.vendorName).trim()
    ) {
      vendor = String(source.vendorName).trim()
      break
    }

    if (
      source.supplierName !== null &&
      source.supplierName !== undefined &&
      String(source.supplierName).trim()
    ) {
      vendor = String(source.supplierName).trim()
      break
    }
  }
}

vendor = vendor || null

  /* ============================================================
     VENDOR TAX ID
  ============================================================ */

  const vendorTaxId =
    doc.vendorTaxId ??
    ocrFields.vendorTaxId ??
    ocrFields.vendor_tax_id ??
    (
      vendorData &&
      typeof vendorData === "object"
        ? vendorData.tax_id
        : null
    ) ??
    null;

  /* ============================================================
     SUBTOTAL
  ============================================================ */

  const subtotal =
    doc.subtotal ??
    ocrFields.subtotal ??
    ocrFields.subTotal ??
    ocrFields.sub_total ??
    null;

  /* ============================================================
     TAX
  ============================================================ */

  const tax =
    doc.taxAmount ??
    doc.tax ??
    ocrFields.taxAmount ??
    ocrFields.tax_amount ??
    ocrFields.tax ??
    ocrFields.totalTax ??
    ocrFields.total_tax ??
    null;

  /* ============================================================
     TOTAL
  ============================================================ */

  const total =
    doc.totalAmount ??
    doc.total ??
    ocrFields.totalAmount ??
    ocrFields.total_amount ??
    ocrFields.total ??
    ocrFields.grandTotal ??
    ocrFields.grand_total ??
    null;

  /* ============================================================
     CURRENCY
  ============================================================ */

  const rawCurrency =
  doc.currency ??
  ocrFields.currency ??
  ocrFields.currencyCode ??
  ocrFields.currency_code ??
  "INR"

const currency =
  typeof rawCurrency === "object"
    ? rawCurrency?.code ||
      rawCurrency?.value ||
      "INR"
    : String(rawCurrency)

  /* ============================================================
     DOCUMENT TYPE
  ============================================================ */

  const rawDocumentType =
  doc.documentType ??
  ocrFields.document_type ??
  ocrFields.documentType ??
  "unknown"

const documentType =
  typeof rawDocumentType === "object"
    ? rawDocumentType?.name ||
      rawDocumentType?.value ||
      "unknown"
    : String(rawDocumentType)

  /* ============================================================
     AI FINDINGS
  ============================================================ */

  const trustScore =
    aiData.transactionTrustScore ??
    aiData.trustScore ??
    doc.transactionTrustScore ??
    doc.trustScore ??
    null;

  const riskLevel =
    aiData.riskLevel ??
    aiData.risk_level ??
    doc.riskLevel ??
    null;

  const anomalies = Array.isArray(
    aiData.anomalies
  )
    ? aiData.anomalies
    : Array.isArray(doc.anomalies)
      ? doc.anomalies
      : [];

  const recommendations =
    Array.isArray(aiData.recommendations)
      ? aiData.recommendations
      : Array.isArray(doc.recommendations)
        ? doc.recommendations
        : [];

  const crossDocumentMatches =
    Array.isArray(
      aiData.crossDocumentMatches
    )
      ? aiData.crossDocumentMatches
      : Array.isArray(
          doc.crossDocumentMatches
        )
        ? doc.crossDocumentMatches
        : [];

  /* ============================================================
     LINE ITEMS
  ============================================================ */

  const lineItems = Array.isArray(
    doc.lineItems
  )
    ? doc.lineItems
    : Array.isArray(doc.items)
      ? doc.items
      : Array.isArray(ocrFields.lineItems)
        ? ocrFields.lineItems
        : Array.isArray(
            ocrFields.line_items
          )
          ? ocrFields.line_items
          : Array.isArray(ocrFields.items)
            ? ocrFields.items
            : [];

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("docDetails.heading")}
            </h1>

            <p className="text-xs font-mono text-gray-400 mt-0.5">
              {safeDisplayValue(
                doc._id || doc.id
              )}
            </p>
          </div>

        </div>

        {/* ACTION BUTTONS */}

        <div className="flex items-center gap-2 flex-wrap">

          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              <Download className="w-4 h-4" />
            }
            onClick={handleExport}
          >
            {t("common.export")}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              <Check className="w-4 h-4" />
            }
            onClick={() =>
              setConfirmModal({
                action: "verify",
                label: t("common.verify"),
              })
            }
          >
            {t("common.verify")}
          </Button>

          <Button
            size="sm"
            leftIcon={
              <CheckCircle className="w-4 h-4" />
            }
            onClick={() =>
              setConfirmModal({
                action: "approve",
                label: t("common.approve"),
              })
            }
          >
            {t("common.approve")}
          </Button>

          <Button
            variant="danger"
            size="sm"
            leftIcon={
              <X className="w-4 h-4" />
            }
            onClick={() =>
              setConfirmModal({
                action: "reject",
                label: t("common.reject"),
              })
            }
          >
            {t("common.reject")}
          </Button>

        </div>
      </div>

      {/* ======================================================
          DOCUMENT INFO
      ====================================================== */}

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-6">

        <div className="flex items-center gap-3 mb-6">

          <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>

          <div>

            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t("docDetails.documentInfo")}
            </h2>

            <div className="flex items-center gap-2 mt-1">

              <StatusBadge status={doc.status} />

              <span className="text-xs capitalize text-gray-500">
                {safeDisplayValue(
                  documentType
                )}
              </span>

              {riskLevel && (
                <RiskBadge risk={riskLevel} />
              )}

            </div>
          </div>

        </div>

        {/* INVOICE FIELDS */}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">

          <Field
            label={t(
              "docDetails.invoiceNumber"
            )}
            value={invoiceNumber}
          />

          <Field
            label={t(
              "docDetails.invoiceDate"
            )}
            value={
              invoiceDate
                ? formatDate(invoiceDate)
                : null
            }
          />

          <Field
            label={t(
              "docDetails.poNumber"
            )}
            value={poNumber}
          />

          <Field
  label={t("docDetails.vendor")}
  value={vendor}
/>

<Field
  label="Vendor Tax ID"
  value={vendorTaxId}
/>

          <Field
            label={t(
              "docDetails.subtotal"
            )}
            value={
              subtotal != null
                ? formatCurrency(
                    Number(subtotal),
                    false,
                    currency
                  )
                : null
            }
          />

          <Field
            label={t("docDetails.tax")}
            value={
              tax != null
                ? formatCurrency(
                    Number(tax),
                    false,
                    currency
                  )
                : null
            }
          />

          <Field
            label={t("docDetails.total")}
            value={
              total != null
                ? formatCurrency(
                    Number(total),
                    false,
                    currency
                  )
                : null
            }
          />

          <Field
            label={t(
              "docDetails.currency"
            )}
            value={currency}
          />

        </div>
      </div>

      {/* ======================================================
          AI FINDINGS
      ====================================================== */}

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-6">

        <div className="flex items-center gap-3 mb-6">

          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>

          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("docDetails.aiFindings")}
          </h2>

        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-6">

          {/* TRUST SCORE */}

          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 text-center">

            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {trustScore != null
                ? formatPercent(
                    Number(trustScore)
                  )
                : "—"}
            </p>

            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
              {t(
                "docDetails.trustScore"
              )}
            </p>

          </div>

          {/* ANOMALIES */}

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">

            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {anomalies.length}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              {t(
                "docDetails.anomalies"
              )}
            </p>

          </div>

          {/* MATCHES */}

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">

            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {crossDocumentMatches.length}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              {t(
                "docDetails.matches"
              )}
            </p>

          </div>

          {/* RISK */}

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex items-center justify-center">
            <RiskBadge risk={riskLevel} />
          </div>

        </div>

        {/* ANOMALIES */}

        {anomalies.length > 0 && (
          <div className="space-y-2 mb-4">

            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t(
                "docDetails.anomalies"
              )}
            </p>

            {anomalies.map((item, index) => {

              const text =
                typeof item === "string"
                  ? item
                  : item?.description ||
                    item?.explanation ||
                    item?.message ||
                    item?.type ||
                    "Anomaly detected";

              return (
                <div
                  key={
                    item?.id ||
                    item?._id ||
                    `${item?.type || "anomaly"}-${index}`
                  }
                  className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl p-3"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />

                  <p className="text-sm text-red-700 dark:text-red-400">
                    {safeDisplayValue(text)}
                  </p>
                </div>
              );
            })}

          </div>
        )}

        {/* RECOMMENDATIONS */}

        {recommendations.length > 0 && (
          <div className="space-y-2">

            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t(
                "docDetails.recommendations"
              )}
            </p>

            {recommendations.map(
              (item, index) => {

                const text =
                  typeof item === "string"
                    ? item
                    : item?.text ||
                      item?.message ||
                      item?.recommendation ||
                      item?.type ||
                      "Review this document";

                return (
                  <div
                    key={
                      item?.id ||
                      item?._id ||
                      `recommendation-${index}`
                    }
                    className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl p-3"
                  >
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />

                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      {safeDisplayValue(text)}
                    </p>
                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* ======================================================
          LINE ITEMS
      ====================================================== */}

      {lineItems.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">

          <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800">

            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t(
                "docDetails.lineItems"
              )}
            </h2>

          </div>

          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-800">

              <thead className="bg-gray-50/50 dark:bg-gray-800/30">

                <tr>

                  {[
                    t("docDetails.item"),
                    t("docDetails.qty"),
                    t(
                      "docDetails.unitPrice"
                    ),
                    t(
                      "docDetails.amount"
                    ),
                    t(
                      "docDetails.confidence"
                    ),
                  ].map(
                    (heading, index) => (
                      <th
                        key={`${heading}-${index}`}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                      >
                        {heading}
                      </th>
                    )
                  )}

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-gray-900">

                {lineItems.map(
                  (item, index) => {

                    const description =
                      item?.description ??
                      item?.name ??
                      "—";

                    const quantity =
                      item?.quantity ??
                      "—";

                    const unitPrice =
                      item?.unit_price ??
                      item?.unitPrice ??
                      null;

                    const itemTotal =
                      item?.total ??
                      item?.totalPrice ??
                      item?.amount ??
                      null;

                    const confidence =
                      item?.confidence ??
                      null;

                    return (
                      <tr
                        key={
                          item?.id ||
                          item?._id ||
                          `${description}-${index}`
                        }
                      >

                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {safeDisplayValue(
                            description
                          )}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {safeDisplayValue(
                            quantity
                          )}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {unitPrice != null
                            ? formatCurrency(
                                Number(
                                  unitPrice
                                ),
                                false,
                                currency
                              )
                            : "—"}
                        </td>

                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {itemTotal != null
                            ? formatCurrency(
                                Number(
                                  itemTotal
                                ),
                                false,
                                currency
                              )
                            : "—"}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-400">
                          {confidence != null
                            ? formatPercent(
                                Number(
                                  confidence
                                ) * 100
                              )
                            : "—"}
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>
            </table>

          </div>
        </div>
      )}

      {/* ======================================================
          EXTRACTED OCR DATA
      ====================================================== */}

      {ocrFields &&
        typeof ocrFields === "object" &&
        Object.keys(ocrFields).length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">

            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Extracted OCR Fields
            </p>

            <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(
                ocrFields,
                null,
                2
              )}
            </pre>

          </div>
        )}

      {/* ======================================================
          CONFIRM MODAL
      ====================================================== */}

      <Modal
        isOpen={!!confirmModal}
        onClose={() =>
          setConfirmModal(null)
        }
        title={`Confirm ${
          confirmModal?.label || ""
        }`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                setConfirmModal(null)
              }
            >
              {t("common.cancel")}
            </Button>

            <Button
              loading={actionLoading}
              onClick={handleAction}
            >
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to{" "}
          <strong>
            {safeDisplayValue(
              confirmModal?.action
            )}
          </strong>{" "}
          this document?
          <br />
          <span className="text-xs text-gray-400">
            This action will be logged.
          </span>
        </p>
      </Modal>

    </div>
  );
}