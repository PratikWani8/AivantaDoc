from __future__ import annotations

from typing import Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)

DocumentType = Literal[
    "invoice",
    "purchase_order",
    "receipt",
    "delivery_note",
    "unknown",
]

RiskLevel = Literal[
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
]


def to_float(value: Any):
    """
    Convert common invoice numeric formats to float.

    Examples:
        554600
        "554600"
        "554,600"
        "₹554,600"
        "INR 554600"
        "$1,250.50"
    """

    if value is None or value == "":
        return None

    if isinstance(value, bool):
        return None

    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):

        cleaned = (
            value
            .replace(",", "")
            .replace("₹", "")
            .replace("$", "")
            .replace("€", "")
            .replace("£", "")
            .replace("INR", "")
            .replace("inr", "")
            .strip()
        )

        try:
            return float(cleaned)
        except ValueError:
            return None

    return None


# ============================================================
# FIELD CONFIDENCE
# ============================================================

class FieldConfidence(BaseModel):

    field: str

    value: Any = None

    confidence: float = Field(
        ge=0,
        le=1,
    )


# ============================================================
# LINE ITEM
# ============================================================

class LineItem(BaseModel):

    description: str | None = None

    quantity: float | None = None

    unit_price: float | None = None

    tax: float | None = None

    total: float | None = None

    @field_validator(
        "quantity",
        "unit_price",
        "tax",
        "total",
        mode="before",
    )
    @classmethod
    def convert_numbers(cls, value):
        return to_float(value)


# ============================================================
# VENDOR
# ============================================================

class VendorInfo(BaseModel):

    name: str | None = None

    tax_id: str | None = None


# ============================================================
# EXTRACTED DOCUMENT
# ============================================================

class ExtractedDocument(BaseModel):

    model_config = ConfigDict(
        extra="ignore"
    )

    # --------------------------------------------------------
    # DOCUMENT
    # --------------------------------------------------------

    document_type: DocumentType = "unknown"

    # --------------------------------------------------------
    # INVOICE
    # --------------------------------------------------------

    invoice_number: str | None = None

    invoice_date: str | None = None

    due_date: str | None = None

    purchase_order_number: str | None = None

    # --------------------------------------------------------
    # VENDOR
    # --------------------------------------------------------

    vendor: VendorInfo | None = None

    vendor_tax_id: str | None = None

    # --------------------------------------------------------
    # BUYER
    # --------------------------------------------------------

    buyer: str | None = None

    buyer_tax_id: str | None = None

    # --------------------------------------------------------
    # FINANCIAL
    # --------------------------------------------------------

    subtotal: float | None = None

    tax: float | None = None

    discount: float | None = None

    total: float | None = None

    currency: str | None = None

    # --------------------------------------------------------
    # ITEMS
    # --------------------------------------------------------

    items: list[LineItem] = Field(
        default_factory=list
    )

    # --------------------------------------------------------
    # NUMERIC VALIDATION
    # --------------------------------------------------------

    @field_validator(
        "subtotal",
        "tax",
        "discount",
        "total",
        mode="before",
    )
    @classmethod
    def convert_numbers(cls, value):

        return to_float(value)


# ============================================================
# DOCUMENT ANALYSIS RESPONSE
# ============================================================

class DocumentAnalysisResponse(BaseModel):

    success: bool = True

    document_type: DocumentType

    text: str = ""

    fields: ExtractedDocument

    field_confidence: list[
        FieldConfidence
    ] = Field(
        default_factory=list
    )

    document_confidence: float = Field(
        ge=0,
        le=1,
    )

    business_validation: list[str] = Field(
        default_factory=list
    )

    warnings: list[str] = Field(
        default_factory=list
    )


# ============================================================
# AI QUERY
# ============================================================

class QueryRequest(BaseModel):

    query: str = Field(
        min_length=2,
        max_length=2000,
    )

    language: Literal[
        "en",
        "hi",
        "mr",
    ] = "en"

    schema_context: dict[str, Any] = Field(
        default_factory=dict
    )


class QueryResponse(BaseModel):

    success: bool = True

    language: str

    answer: str

    sql: str

    rows: list[
        dict[str, Any]
    ] = Field(
        default_factory=list
    )

    columns: list[str] = Field(
        default_factory=list
    )

    insights: list[str] = Field(
        default_factory=list
    )

    recommendations: list[str] = Field(
        default_factory=list
    )

    risk_context: dict[str, Any] = Field(
        default_factory=dict
    )

    visualization: dict[str, Any] = Field(
        default_factory=dict
    )


# ============================================================
# TRANSACTION REQUEST
# ============================================================

class TransactionRequest(BaseModel):

    document_confidence: float | None = Field(
        default=None,
        ge=0,
        le=1,
    )

    invoice: dict[str, Any] = Field(
        default_factory=dict
    )

    purchase_order: dict[str, Any] | None = None

    delivery_note: dict[str, Any] | None = None

    historical_vendor_data: list[
        dict[str, Any]
    ] = Field(
        default_factory=list
    )

    historical_prices: list[float] = Field(
        default_factory=list
    )

    related_invoices: list[
        dict[str, Any]
    ] = Field(
        default_factory=list
    )

    vendor_trust: float | None = Field(
        default=None,
        ge=0,
        le=1,
    )


# ============================================================
# ANOMALY
# ============================================================

class Anomaly(BaseModel):

    type: str

    severity: RiskLevel

    confidence: float = Field(
        ge=0,
        le=1,
    )

    explanation: str

    recommendation: str


# ============================================================
# TRANSACTION RESPONSE
# ============================================================

class TransactionResponse(BaseModel):

    riskLevel: RiskLevel

    riskScore: float = Field(
        ge=0,
        le=1,
    )

    anomalies: list[Anomaly] = Field(
        default_factory=list
    )

    explanation: list[str] = Field(
        default_factory=list
    )

    documentConfidence: float

    vendorTrust: float

    poMatch: float

    priceConsistency: float

    duplicateProbability: float

    transactionTrustScore: float

    potentialLeakage: float = 0.0


# ============================================================
# HEALTH
# ============================================================

class HealthResponse(BaseModel):

    status: str

    service: str

    llm: str

    ocr: str

    timestamp: str


# ============================================================
# INSIGHTS
# ============================================================

class InsightRequest(BaseModel):

    rows: list[
        dict[str, Any]
    ] = Field(
        default_factory=list
    )

    question: str = ""

    language: Literal[
        "en",
        "hi",
        "mr",
    ] = "en"


# ============================================================
# ERROR
# ============================================================

class ErrorDetail(BaseModel):

    code: str

    message: str


class ErrorResponse(BaseModel):

    success: bool = False

    error: ErrorDetail


# ============================================================
# BACKWARD COMPATIBILITY
# ============================================================

TxRequest = TransactionRequest

Extracted = ExtractedDocument