from __future__ import annotations

import statistics
from typing import Any

def clamp(value: Any, default: float = 0.0) -> float:
    """
    Safely convert a value to a float between 0 and 1.

    Handles:
    - None
    - strings
    - integers
    - floats
    - invalid values
    """

    if value is None:
        return default

    try:
        number = float(value)
    except (TypeError, ValueError):
        return default

    if number != number:  # NaN
        return default

    return max(0.0, min(1.0, number))


def number(
    value: Any,
    default: float = 0.0,
) -> float:
    """
    Safely convert common numeric values to float.
    """

    if value is None:
        return default

    if isinstance(value, bool):
        return default

    try:
        result = float(value)
    except (TypeError, ValueError):
        return default

    if result != result:  # NaN
        return default

    return result


def text(
    value: Any,
    default: str = "",
) -> str:
    """
    Safely convert a value to string.
    """

    if value is None:
        return default

    if isinstance(value, str):
        return value.strip()

    return str(value).strip()


def get_value(
    obj: Any,
    *keys: str,
    default: Any = None,
) -> Any:
    """
    Safely retrieve the first available key from a dictionary.
    """

    if not isinstance(obj, dict):
        return default

    for key in keys:
        value = obj.get(key)

        if value is not None:
            return value

    return default


def get_items(value: Any) -> list[dict]:
    """
    Return only valid dictionary items.
    """

    if not isinstance(value, list):
        return []

    return [
        item
        for item in value
        if isinstance(item, dict)
    ]


# ============================================================
# MAIN TRANSACTION ANALYSIS
# ============================================================

def analyze(x):
    """
    Analyze an invoice transaction and calculate:

    - PO match
    - Price consistency
    - Duplicate probability
    - Vendor trust
    - Document confidence
    - Transaction trust score
    - Risk score
    - Risk level
    - Anomalies
    - Potential leakage
    """

    # --------------------------------------------------------
    # SAFE INPUT EXTRACTION
    # --------------------------------------------------------

    inv = getattr(x, "invoice", None) or {}
    po = getattr(x, "purchase_order", None) or {}
    delivery = getattr(x, "delivery_note", None) or {}

    historical_prices = (
        getattr(x, "historical_prices", None)
        or []
    )

    related_invoices = (
        getattr(x, "related_invoices", None)
        or []
    )

    # Ensure dictionaries
    if not isinstance(inv, dict):
        inv = {}

    if not isinstance(po, dict):
        po = {}

    if not isinstance(delivery, dict):
        delivery = {}

    # --------------------------------------------------------
    # INVOICE VALUES
    # --------------------------------------------------------

    total = number(
        get_value(
            inv,
            "total",
            "totalAmount",
            "total_amount",
        )
    )

    # --------------------------------------------------------
    # PURCHASE ORDER VALUES
    # --------------------------------------------------------

    po_total = number(
        get_value(
            po,
            "total",
            "totalAmount",
            "total_amount",
        )
    )

    # --------------------------------------------------------
    # ITEMS
    # --------------------------------------------------------

    invoice_items = get_items(
        inv.get("items")
    )

    po_items = get_items(
        po.get("items")
    )

    # --------------------------------------------------------
    # QUANTITY CALCULATION
    # --------------------------------------------------------

    invoice_quantity = sum(
        number(
            get_value(
                item,
                "quantity",
                "qty",
            )
        )
        for item in invoice_items
    )

    po_quantity = sum(
        number(
            get_value(
                item,
                "quantity",
                "qty",
            )
        )
        for item in po_items
    )

    delivery_quantity = number(
        get_value(
            delivery,
            "quantity",
            "qty",
            "delivered_quantity",
            "deliveredQuantity",
        )
    )

    # --------------------------------------------------------
    # INITIAL SCORES
    # --------------------------------------------------------

    po_match = 1.0
    price_consistency = 1.0
    duplicate_probability = 0.0

    anomalies: list[dict] = []

    # ========================================================
    # DUPLICATE INVOICE DETECTION
    # ========================================================

    invoice_number = text(
        get_value(
            inv,
            "invoiceNumber",
            "invoice_number",
            "number",
        )
    ).lower()

    if invoice_number:

        for related in related_invoices:

            if not isinstance(
                related,
                dict,
            ):
                continue

            related_number = text(
                get_value(
                    related,
                    "invoiceNumber",
                    "invoice_number",
                    "number",
                )
            ).lower()

            if (
                related_number
                and related_number
                == invoice_number
            ):
                duplicate_probability = 0.95

                anomalies.append(
                    {
                        "type": "DUPLICATE_INVOICE",
                        "severity": "CRITICAL",
                        "confidence": 0.95,
                        "explanation": (
                            "A related invoice has "
                            "the same invoice number."
                        ),
                        "recommendation": (
                            "Hold payment and verify "
                            "the original invoice."
                        ),
                    }
                )

                break

    # ========================================================
    # PURCHASE ORDER MATCH
    # ========================================================

    if po_total:

        difference = abs(
            total - po_total
        )

        po_match = clamp(
            1.0
            - difference
            / max(abs(po_total), 1.0),
            default=0.0,
        )

    # --------------------------------------------------------
    # PO QUANTITY MISMATCH
    # --------------------------------------------------------

    if (
        po_quantity > 0
        and invoice_quantity > po_quantity
    ):

        difference = (
            invoice_quantity
            - po_quantity
        )

        anomalies.append(
            {
                "type": "PO_QUANTITY_MISMATCH",
                "severity": "HIGH",
                "confidence": 0.95,
                "explanation": (
                    "Invoice quantity exceeds "
                    f"PO quantity by "
                    f"{difference:g} units."
                ),
                "recommendation": (
                    "Verify the approved "
                    "PO quantity."
                ),
            }
        )

    # --------------------------------------------------------
    # PO AMOUNT MISMATCH
    # --------------------------------------------------------

    if (
        po_total > 0
        and total > po_total
    ):

        difference = (
            total - po_total
        )

        anomalies.append(
            {
                "type": "PO_AMOUNT_MISMATCH",
                "severity": "HIGH",
                "confidence": 0.94,
                "explanation": (
                    "Invoice total exceeds "
                    f"PO total by "
                    f"{difference:.2f}."
                ),
                "recommendation": (
                    "Verify the approved "
                    "price before payment."
                ),
            }
        )

    # ========================================================
    # DELIVERY QUANTITY CHECK
    # ========================================================

    if (
        delivery_quantity > 0
        and invoice_quantity
        > delivery_quantity
    ):

        difference = (
            invoice_quantity
            - delivery_quantity
        )

        anomalies.append(
            {
                "type": "QUANTITY_MISMATCH",
                "severity": "HIGH",
                "confidence": 0.93,
                "explanation": (
                    "Invoice quantity exceeds "
                    f"delivered quantity by "
                    f"{difference:g} units."
                ),
                "recommendation": (
                    "Confirm delivery quantity "
                    "before approval."
                ),
            }
        )

    # ========================================================
    # HISTORICAL PRICE ANALYSIS
    # ========================================================

    clean_historical_prices = []

    for value in historical_prices:

        converted = number(
            value,
            default=-1,
        )

        if converted >= 0:
            clean_historical_prices.append(
                converted
            )

    if len(
        clean_historical_prices
    ) >= 3:

        mean_price = statistics.mean(
            clean_historical_prices
        )

        standard_deviation = (
            statistics.pstdev(
                clean_historical_prices
            )
        )

        if standard_deviation == 0:

            z_score = (
                0.0
                if total == mean_price
                else 5.0
            )

        else:

            z_score = abs(
                total - mean_price
            ) / standard_deviation

        price_consistency = clamp(
            1.0 - z_score / 5.0,
            default=0.0,
        )

        if z_score >= 3:

            confidence = clamp(
                0.65 + z_score / 10.0,
                default=0.65,
            )

            anomalies.append(
                {
                    "type": "ABNORMAL_PRICING",
                    "severity": "HIGH",
                    "confidence": confidence,
                    "explanation": (
                        "Invoice amount is "
                        "unusual compared with "
                        "supplied historical prices."
                    ),
                    "recommendation": (
                        "Review vendor pricing "
                        "and historical transactions."
                    ),
                }
            )

    # ========================================================
    # DOCUMENT CONFIDENCE
    # ========================================================

    document_confidence = clamp(
        getattr(
            x,
            "document_confidence",
            None,
        ),
        default=0.0,
    )

    # ========================================================
    # VENDOR TRUST
    # ========================================================

    # IMPORTANT:
    # vendor_trust is optional in Pydantic.
    # If it is None, use a neutral/default trust score
    # instead of calling float(None).

    raw_vendor_trust = getattr(
        x,
        "vendor_trust",
        None,
    )

    if raw_vendor_trust is None:
        vendor_trust = 0.5
    else:
        vendor_trust = clamp(
            raw_vendor_trust,
            default=0.5,
        )

    # ========================================================
    # TRANSACTION TRUST SCORE
    # ========================================================

    transaction_trust = clamp(
        (
            0.25 * document_confidence
            + 0.20 * vendor_trust
            + 0.20 * po_match
            + 0.20 * price_consistency
            + 0.15
            * (
                1.0
                - duplicate_probability
            )
        ),
        default=0.0,
    )

    # ========================================================
    # RISK SCORE
    # ========================================================

    risk_score = clamp(
        1.0 - transaction_trust,
        default=1.0,
    )

    # ========================================================
    # RISK LEVEL
    # ========================================================

    has_critical = any(
        anomaly.get("severity")
        == "CRITICAL"
        for anomaly in anomalies
    )

    has_high = any(
        anomaly.get("severity")
        == "HIGH"
        for anomaly in anomalies
    )

    if has_critical:

        risk_level = "CRITICAL"

    elif (
        risk_score >= 0.70
        or has_high
    ):

        risk_level = "HIGH"

    elif (
        anomalies
        or risk_score >= 0.40
    ):

        risk_level = "MEDIUM"

    else:

        risk_level = "LOW"

    # ========================================================
    # POTENTIAL FINANCIAL LEAKAGE
    # ========================================================

    if po_total > 0:

        potential_leakage = max(
            0.0,
            total - po_total,
        )

    else:

        potential_leakage = 0.0

    # ========================================================
    # EXPLANATIONS
    # ========================================================

    explanations = [
        anomaly.get(
            "explanation",
            "Risk detected.",
        )
        for anomaly in anomalies
        if anomaly.get("explanation")
    ]

    if not explanations:

        explanations = [
            "No material anomaly identified "
            "from supplied data."
        ]

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "riskLevel": risk_level,

        "riskScore": round(
            risk_score,
            4,
        ),

        "anomalies": anomalies,

        "explanation": explanations,

        "documentConfidence": round(
            document_confidence,
            4,
        ),

        "vendorTrust": round(
            vendor_trust,
            4,
        ),

        "poMatch": round(
            po_match,
            4,
        ),

        "priceConsistency": round(
            price_consistency,
            4,
        ),

        "duplicateProbability": round(
            duplicate_probability,
            4,
        ),

        "transactionTrustScore": round(
            transaction_trust,
            4,
        ),

        "potentialLeakage": round(
            potential_leakage,
            2,
        ),
    }