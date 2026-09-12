from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings
from app.db import ping, execute
from app.models import QueryRequest, TxRequest, Extracted
from app.ocr import extract
from app.groq_service import GroqService
from app.schema_registry import text_schema
from app.sql_validator import validate
from app.anomaly import analyze

s = Settings()
groq = GroqService()

app = FastAPI(
    title="AivantaDoc AI Service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=s.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

ALLOWED = {
    ".pdf": {"application/pdf"},
    ".png": {"image/png"},
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".webp": {"image/webp"},
}


async def readfile(file: UploadFile):
    """
    Read and validate uploaded document.
    """

    filename = file.filename or ""
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": "Unsupported file type",
            },
        )

    if file.content_type not in ALLOWED[extension]:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": "Unsupported or mismatched file type",
            },
        )

    data = await file.read(
        s.max_upload_bytes + 1
    )

    if len(data) > s.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": "File exceeds configured size limit",
            },
        )

    if not data:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "EMPTY_FILE",
                "message": "Uploaded file is empty",
            },
        )

    return data, extension


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/v1/health")
def health():
    try:
        ping()
        database = "ok"
    except Exception:
        database = "unavailable"

    if groq.available():
        llm = f"groq:{s.groq_model}"
    elif s.mistral_adapter_path:
        llm = "mistral-adapter"
    else:
        llm = "unconfigured"

    return {
        "status": (
            "healthy"
            if database == "ok"
            else "degraded"
        ),
        "service": s.app_name,
        "llm": llm,
        "ocr": "tesseract",
        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
    }


# ============================================================
# DOCUMENT CLASSIFICATION
# ============================================================

def classify_text(text: str):
    """
    Basic document classification using OCR text.
    """

    low = text.lower()

    rules = {
        "invoice": [
            "invoice",
            "tax invoice",
            "invoice no",
            "invoice number",
            "bill to",
        ],

        "purchase_order": [
            "purchase order",
            "po number",
            "p.o.",
            "purchase order no",
        ],

        "receipt": [
            "receipt",
            "amount paid",
            "payment received",
        ],

        "delivery_note": [
            "delivery note",
            "delivery challan",
            "dispatch note",
        ],
    }

    scores = {
        key: sum(
            word in low
            for word in words
        )
        for key, words in rules.items()
    }

    if not scores:
        return "unknown", 0.25

    document_type = max(
        scores,
        key=scores.get
    )

    max_score = scores[document_type]

    if max_score == 0:
        return "unknown", 0.25

    if max_score >= 3:
        confidence = 0.90
    elif max_score == 2:
        confidence = 0.75
    else:
        confidence = 0.60

    return document_type, confidence


# ============================================================
# NORMALIZE EXTRACTED FIELDS
# ============================================================

def normalize_extracted_fields(
    fields: Extracted,
    document_type: str,
):
    """
    Normalize the Pydantic extraction model into
    the exact structure expected by Node.js.
    """

    data = fields.model_dump()

    # Ensure document type
    data["document_type"] = (
        data.get("document_type")
        or document_type
    )

    # --------------------------------------------------------
    # Invoice number
    # --------------------------------------------------------

    data["invoice_number"] = (
        data.get("invoice_number")
        or data.get("invoiceNumber")
    )

    # --------------------------------------------------------
    # Invoice date
    # --------------------------------------------------------

    data["invoice_date"] = (
        data.get("invoice_date")
        or data.get("invoiceDate")
    )

    # --------------------------------------------------------
    # PO number
    # --------------------------------------------------------

    data["purchase_order_number"] = (
        data.get("purchase_order_number")
        or data.get("purchaseOrderNumber")
        or data.get("po_number")
        or data.get("poNumber")
    )

    # --------------------------------------------------------
    # Vendor
    # --------------------------------------------------------

    vendor = data.get("vendor")

    if not isinstance(vendor, dict):
        vendor = {}

    vendor_name = (
        vendor.get("name")
        or vendor.get("vendorName")
        or data.get("vendor_name")
        or data.get("vendorName")
    )

    vendor_tax_id = (
        vendor.get("tax_id")
        or vendor.get("taxId")
        or data.get("vendor_tax_id")
        or data.get("vendorTaxId")
    )

    data["vendor"] = {
        "name": vendor_name,
        "tax_id": vendor_tax_id,
    }

    # --------------------------------------------------------
    # Financial fields
    # --------------------------------------------------------

    data["subtotal"] = (
        data.get("subtotal")
        if data.get("subtotal") is not None
        else data.get("sub_total")
    )

    data["tax"] = (
        data.get("tax")
        if data.get("tax") is not None
        else data.get("tax_amount")
    )

    data["discount"] = (
        data.get("discount")
        if data.get("discount") is not None
        else data.get("discount_amount")
    )

    data["total"] = (
        data.get("total")
        if data.get("total") is not None
        else data.get("total_amount")
    )

    # --------------------------------------------------------
    # Currency
    # --------------------------------------------------------

    data["currency"] = (
        data.get("currency")
        or data.get("currency_code")
        or "INR"
    )

    # --------------------------------------------------------
    # Items
    # --------------------------------------------------------

    if not isinstance(
        data.get("items"),
        list
    ):
        data["items"] = []

    return data


# ============================================================
# ANALYZE DOCUMENT
# ============================================================

@app.post("/api/v1/analyze-document")
async def analyze_document(
    file: UploadFile = File(...)
):

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    file_data, extension = await readfile(
        file
    )

    # --------------------------------------------------------
    # OCR
    # --------------------------------------------------------

    try:
        text = extract(
            file_data,
            extension
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "OCR_FAILED",
                "message": "Document OCR failed",
            },
        ) from exc

    if not text or not text.strip():
        raise HTTPException(
            status_code=422,
            detail={
                "code": "OCR_EMPTY",
                "message": (
                    "No readable text was found "
                    "in the uploaded document"
                ),
            },
        )

    # --------------------------------------------------------
    # Classification
    # --------------------------------------------------------

    document_type, classification_confidence = (
        classify_text(text)
    )

    # --------------------------------------------------------
    # Groq check
    # --------------------------------------------------------

    if not groq.available():
        raise HTTPException(
            status_code=503,
            detail={
                "code": "LLM_UNCONFIGURED",
                "message": (
                    "Groq is not configured. "
                    "Set GROQ_API_KEY and GROQ_MODEL."
                ),
            },
        )

    # --------------------------------------------------------
    # Structured extraction
    # --------------------------------------------------------

    try:
        raw_fields = groq.extract(text)

        fields = Extracted.model_validate(
            raw_fields
        )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "code": "LLM_INVALID_OUTPUT",
                "message": (
                    "LLM output failed "
                    "schema validation"
                ),
            },
        ) from exc

    # --------------------------------------------------------
    # Normalize
    # --------------------------------------------------------

    normalized = normalize_extracted_fields(
        fields,
        document_type
    )

    # --------------------------------------------------------
    # Determine final document type
    # --------------------------------------------------------

    final_document_type = (
        normalized.get(
            "document_type"
        )
        or document_type
    )

    # --------------------------------------------------------
    # Business validation
    # --------------------------------------------------------

    warnings = []

    subtotal = normalized.get(
        "subtotal"
    )

    tax = normalized.get(
        "tax"
    )

    discount = normalized.get(
        "discount"
    ) or 0

    total = normalized.get(
        "total"
    )

    if (
        subtotal is not None
        and tax is not None
        and total is not None
    ):
        try:
            expected_total = (
                float(subtotal)
                + float(tax)
                - float(discount)
            )

            difference = abs(
                expected_total
                - float(total)
            )

            tolerance = max(
                1,
                abs(float(total)) * 0.02
            )

            if difference > tolerance:
                warnings.append(
                    "Invoice arithmetic does not "
                    "reconcile within tolerance."
                )

        except (
            TypeError,
            ValueError,
        ):
            warnings.append(
                "Invoice financial fields "
                "could not be validated."
            )

    # --------------------------------------------------------
    # Field confidence
    # --------------------------------------------------------

    field_confidence = []

    for key, value in normalized.items():

        if key == "items":
            continue

        if key == "vendor":
            vendor_value = (
                value.get("name")
                if isinstance(
                    value,
                    dict
                )
                else value
            )

            field_confidence.append({
                "field": "vendor",
                "value": vendor_value,
                "confidence": (
                    0.90
                    if vendor_value
                    else 0
                ),
            })

            continue

        field_confidence.append({
            "field": key,
            "value": value,
            "confidence": (
                0.90
                if value is not None
                and value != ""
                else 0
            ),
        })

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "success": True,

        "document_type":
            final_document_type,

        "text":
            text,

        "fields":
            normalized,

        "field_confidence":
            field_confidence,

        "document_confidence":
            max(
                classification_confidence,
                0.80
            ),

        "business_validation": [],

        "warnings":
            warnings,
    }


# ============================================================
# CLASSIFY DOCUMENT
# ============================================================

@app.post("/api/v1/classify-document")
async def classify_document(
    file: UploadFile = File(...)
):

    data, extension = await readfile(
        file
    )

    text = extract(
        data,
        extension
    )

    document_type, confidence = (
        classify_text(text)
    )

    return {
        "success": True,
        "document_type":
            document_type,
        "confidence":
            confidence,
    }


# ============================================================
# EXTRACT FIELDS
# ============================================================

@app.post("/api/v1/extract-fields")
async def extract_fields(
    file: UploadFile = File(...)
):

    data, extension = await readfile(
        file
    )

    text = extract(
        data,
        extension
    )

    if not groq.available():
        raise HTTPException(
            status_code=503,
            detail={
                "code": "LLM_UNCONFIGURED",
                "message": (
                    "Configure GROQ_API_KEY "
                    "and GROQ_MODEL for "
                    "structured extraction"
                ),
            },
        )

    try:
        raw_fields = groq.extract(
            text
        )

        fields = Extracted.model_validate(
            raw_fields
        )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "code": "LLM_INVALID_OUTPUT",
                "message": (
                    "LLM output failed "
                    "schema validation"
                ),
            },
        ) from exc

    normalized = normalize_extracted_fields(
        fields,
        fields.document_type
    )

    return {
        "success": True,

        "fields":
            normalized,

        "field_confidence": [
            {
                "field": key,
                "value": value,
                "confidence": (
                    0.90
                    if value is not None
                    and value != ""
                    else 0
                ),
            }

            for key, value
            in normalized.items()

            if key != "items"
        ],
    }


# ============================================================
# AI SQL QUERY
# ============================================================

@app.post("/api/v1/query")
def query_ai(
    req: QueryRequest
):

    if not groq.available():
        raise HTTPException(
            status_code=503,
            detail={
                "code": "LLM_UNCONFIGURED",
                "message": (
                    "Configure GROQ_API_KEY "
                    "and GROQ_MODEL"
                ),
            },
        )

    try:

        generated = groq.sql(
            req.query,
            text_schema(),
            req.language
        )

        sql = validate(
            generated.get(
                "sql",
                ""
            )
        )

        rows = execute(sql)

    except ValueError as exc:

        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_SQL",
                "message": str(exc),
            },
        )

    except Exception as exc:

        raise HTTPException(
            status_code=503,
            detail={
                "code": "AI_QUERY_FAILED",
                "message": (
                    "AI query processing failed"
                ),
            },
        ) from exc

    columns = (
        list(rows[0])
        if rows
        else []
    )

    if not rows:
        answer = (
            "No business data is "
            "available for this query."
        )

    else:
        answer = (
            f"The query returned "
            f"{len(rows)} record(s)."
        )

    return {
        "success": True,

        "language":
            req.language,

        "answer":
            answer,

        "sql":
            sql,

        "rows":
            rows,

        "columns":
            columns,

        "insights": (
            []
            if not rows
            else [
                "Insights are based only "
                "on returned rows."
            ]
        ),

        "recommendations": (
            []
            if not rows
            else [
                "Review returned records "
                "against approved business "
                "baselines."
            ]
        ),

        "risk_context": {},

        "visualization": (
            {
                "type": "table",
                "columns": columns,
            }
            if columns
            else {}
        ),
    }


# ============================================================
# TRANSACTION ANALYSIS
# ============================================================

@app.post("/api/v1/analyze-transaction")
def transaction(
    req: TxRequest
):
    return analyze(req)


# ============================================================
# GENERATE INSIGHTS
# ============================================================

@app.post("/api/v1/generate-insights")
def insights(
    payload: dict
):

    rows = payload.get(
        "rows"
    ) or []

    return {
        "success": True,

        "language":
            payload.get(
                "language",
                "en"
            ),

        "answer": (
            "No business data is "
            "available for this query."
            if not rows
            else
            f"The supplied data contains "
            f"{len(rows)} record(s)."
        ),

        "insights": (
            []
            if not rows
            else [
                "Insights are derived only "
                "from supplied rows."
            ]
        ),

        "recommendations": (
            []
            if not rows
            else [
                "Review material exceptions "
                "in the supplied data."
            ]
        ),
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "service":
            s.app_name,

        "docs":
            "/docs",

        "health":
            "/api/v1/health",
    }