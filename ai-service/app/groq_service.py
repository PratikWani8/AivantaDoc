import json
import re

from groq import Groq

from app.config import settings
from app.models import ExtractedDocument


class GroqService:

    def __init__(self):
        self.api_key = settings.groq_api_key
        self.model = settings.groq_model
        self.client = None

        if self.api_key:
            self.client = Groq(
                api_key=self.api_key
            )

    # =========================================================
    # AVAILABILITY
    # =========================================================

    def available(self) -> bool:
        return bool(
            self.client
            and self.model
        )

    # =========================================================
    # JSON PARSER
    # =========================================================

    def _extract_json(self, content: str) -> dict:

        if not content:
            raise ValueError(
                "Groq returned an empty response"
            )

        content = content.strip()

        # Remove markdown code fences if model adds them
        content = re.sub(
            r"^```json\s*",
            "",
            content,
            flags=re.IGNORECASE
        )

        content = re.sub(
            r"^```\s*",
            "",
            content
        )

        content = re.sub(
            r"\s*```$",
            "",
            content
        )

        content = content.strip()

        # First attempt: entire response is JSON
        try:
            parsed = json.loads(content)

            if not isinstance(parsed, dict):
                raise ValueError(
                    "Groq JSON response must be an object"
                )

            return parsed

        except json.JSONDecodeError:
            pass

        # Second attempt: find JSON object inside response
        start = content.find("{")
        end = content.rfind("}")

        if start == -1 or end == -1 or end <= start:
            raise ValueError(
                "Groq did not return valid JSON"
            )

        json_text = content[start:end + 1]

        try:
            parsed = json.loads(json_text)

            if not isinstance(parsed, dict):
                raise ValueError(
                    "Groq JSON response must be an object"
                )

            return parsed

        except json.JSONDecodeError as exc:
            print("\n========== INVALID GROQ JSON ==========")
            print(content)
            print("========================================\n")

            raise ValueError(
                "Groq returned malformed JSON"
            ) from exc

    # =========================================================
    # GENERIC JSON CHAT
    # =========================================================

    def _chat_json(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> dict:

        if not self.available():
            raise RuntimeError(
                "Groq is not configured. "
                "Check GROQ_API_KEY and GROQ_MODEL."
            )

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0,
            response_format={
                "type": "json_object"
            },
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        )

        content = (
            response.choices[0]
            .message.content
            or ""
        )

        print("\n========== GROQ RAW OUTPUT ==========")
        print(content)
        print("=====================================\n")

        return self._extract_json(content)

    # =========================================================
    # DOCUMENT EXTRACTION
    # =========================================================

    def extract(
        self,
        text: str,
        document_type_hint: str | None = None
    ) -> dict:

        if not text or not text.strip():
            raise ValueError(
                "No text could be extracted from the document"
            )

        document_text = text[:30000]

        system_prompt = """
You are AivantaDoc's business document
intelligence extraction engine.

Your job is to extract structured data
from invoices, purchase orders, receipts,
and delivery documents.

IMPORTANT:

- Extract ONLY information explicitly present
  in the supplied document.
- NEVER invent or guess values.
- If a value is missing, return null.
- Return JSON only.
- Do not return markdown.
- Do not return explanations.
- Do not use code fences.
- Numeric fields must contain numbers only.
- Do not put currency symbols inside numeric fields.
- Preserve invoice numbers exactly when possible.
- Preserve purchase order numbers exactly when possible.
- Preserve vendor names exactly as printed.
"""

        user_prompt = f"""
Analyze the following business document.

DOCUMENT TYPE HINT:
{document_type_hint or "unknown"}

DOCUMENT TEXT:
==============================
{document_text}
==============================

Extract the following fields.

IMPORTANT INVOICE FIELDS:

1. invoice_number
   - Invoice number / invoice no / bill number.

2. invoice_date
   - Date printed on the invoice.

3. purchase_order_number
   - PO number / purchase order number.

4. vendor.name
   - Supplier / seller / vendor company name.

5. subtotal
   - Amount before tax.

6. tax
   - GST / CGST / SGST / IGST / VAT / tax amount.
   - If multiple taxes exist, calculate their total
     only when the document clearly provides them.

7. total
   - Final invoice amount / grand total / amount payable.

8. currency
   - INR, USD, EUR, GBP, etc.

OTHER FIELDS:

- due_date
- vendor.tax_id
- vendor_tax_id
- buyer
- buyer_tax_id
- discount
- line items

DOCUMENT TYPE:

document_type must be exactly one of:

- invoice
- purchase_order
- receipt
- delivery_note
- unknown

NUMERIC RULES:

- "₹554,600" -> 554600
- "554,600" -> 554600
- "INR 554600" -> 554600
- "$1,250.50" -> 1250.50

If the document does not contain a value,
return null.

Return EXACTLY this JSON structure:

{{
    "document_type": "invoice",

    "invoice_number": null,

    "invoice_date": null,

    "due_date": null,

    "vendor": {{
        "name": null,
        "tax_id": null
    }},

    "vendor_tax_id": null,

    "buyer": null,

    "buyer_tax_id": null,

    "currency": null,

    "subtotal": null,

    "tax": null,

    "discount": null,

    "total": null,

    "purchase_order_number": null,

    "items": []
}}

For line items, use:

{{
    "description": null,
    "quantity": null,
    "unit_price": null,
    "tax": null,
    "total": null
}}
"""

        raw = self._chat_json(
            system_prompt,
            user_prompt
        )

        # =====================================================
        # PYDANTIC VALIDATION
        # =====================================================

        try:

            validated = ExtractedDocument.model_validate(
                raw
            )

            result = validated.model_dump()

            print("\n========== EXTRACTED FIELDS ==========")
            print(json.dumps(
                result,
                indent=2,
                ensure_ascii=False
            ))
            print("=======================================\n")

            return result

        except Exception as exc:

            print("\n========================================")
            print("LLM SCHEMA VALIDATION ERROR")
            print("========================================")
            print(exc)

            print("\nRAW PARSED OUTPUT:")
            print(
                json.dumps(
                    raw,
                    indent=2,
                    ensure_ascii=False
                )
            )

            print("========================================\n")

            raise ValueError(
                "LLM output failed schema validation"
            ) from exc

    # =========================================================
    # SQL GENERATION
    # =========================================================

    def generate_sql(
        self,
        query: str,
        schema: str,
        language: str = "en"
    ) -> dict:

        language_instruction = {
            "en": "Respond in English.",
            "hi": "Respond in Hindi.",
            "mr": "Respond in Marathi."
        }.get(
            language,
            "Respond in English."
        )

        system_prompt = f"""
You are AivantaDoc's NLP-to-SQL engine.

{language_instruction}

Generate exactly ONE PostgreSQL SELECT query.

SECURITY RULES:

- SELECT only
- No INSERT
- No UPDATE
- No DELETE
- No DROP
- No ALTER
- No CREATE
- No TRUNCATE
- No GRANT
- No REVOKE
- No MERGE
- No CALL
- No EXEC
- No COPY
- No multiple statements
- No SQL comments
- Use only tables and columns from
  the supplied schema.

Return JSON only.

Required format:

{{
    "sql": "SELECT ...",
    "answer_template": "...",
    "insights_plan": []
}}
"""

        user_prompt = f"""
Business question:

{query}

Database schema:

{schema}
"""

        return self._chat_json(
            system_prompt,
            user_prompt
        )