const forbidden =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|MERGE|CALL|EXEC|EXECUTE|COPY|DO)\b/i;

const commentPattern =
  /(--|\/\*|\*\/)/;

export function validateReadOnlySql(sql) {
  /*
   * Basic type validation
   */
  if (typeof sql !== "string") {
    throw Object.assign(
      new Error("SQL must be a string"),
      {
        statusCode: 422,
        code: "INVALID_SQL",
      }
    );
  }

  /*
   * Remove surrounding whitespace
   */
  let normalized = sql.trim();

  if (!normalized) {
    throw Object.assign(
      new Error("SQL query cannot be empty"),
      {
        statusCode: 422,
        code: "INVALID_SQL",
      }
    );
  }

  /*
   * Block null bytes
   */
  if (normalized.includes("\0")) {
    throw Object.assign(
      new Error("Invalid SQL"),
      {
        statusCode: 422,
        code: "INVALID_SQL",
      }
    );
  }

  /*
   * Remove ONE optional trailing semicolon.
   *
   * This allows:
   *
   * SELECT * FROM invoices;
   *
   * but still blocks:
   *
   * SELECT * FROM invoices;
   * DELETE FROM invoices;
   */
  normalized = normalized.replace(
    /;\s*$/,
    ""
  ).trim();

  /*
   * No semicolons are allowed anywhere else.
   */
  if (normalized.includes(";")) {
    throw Object.assign(
      new Error(
        "Multiple SQL statements are not allowed"
      ),
      {
        statusCode: 422,
        code: "MULTIPLE_STATEMENTS",
      }
    );
  }

  /*
   * Block SQL comments.
   *
   * This prevents things such as:
   *
   * SELECT * FROM invoices -- malicious query
   *
   * and:
   *
   * SELECT /* hidden operation *\/ ...
   */
  if (commentPattern.test(normalized)) {
    throw Object.assign(
      new Error(
        "SQL comments are not allowed"
      ),
      {
        statusCode: 422,
        code: "UNSAFE_SQL",
      }
    );
  }

  /*
   * Only SELECT and WITH queries.
   *
   * WITH is allowed because PostgreSQL commonly uses:
   *
   * WITH data AS (...)
   * SELECT ...
   */
  if (
    !/^(SELECT|WITH)\b/i.test(
      normalized
    )
  ) {
    throw Object.assign(
      new Error(
        "Only read-only SELECT queries are allowed"
      ),
      {
        statusCode: 422,
        code: "READ_ONLY_SQL_REQUIRED",
      }
    );
  }

  /*
   * Block write/destructive operations.
   */
  if (forbidden.test(normalized)) {
    throw Object.assign(
      new Error(
        "Forbidden SQL operation"
      ),
      {
        statusCode: 422,
        code: "FORBIDDEN_SQL",
      }
    );
  }

  /*
   * Prevent PostgreSQL COPY.
   */
  if (
    /\bCOPY\s+/i.test(normalized)
  ) {
    throw Object.assign(
      new Error(
        "COPY operation is not allowed"
      ),
      {
        statusCode: 422,
        code: "FORBIDDEN_SQL",
      }
    );
  }

  /*
   * Return normalized read-only SQL.
   */
  return normalized;
}