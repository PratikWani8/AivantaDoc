import { prisma } from "../config/prisma.js";
import { Document } from "../models/document.model.js";

function money(value) {
  if (value == null) return 0;

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function number(value) {
  if (value == null) return 0;

  const result = Number(value);

  return Number.isFinite(result)
    ? result
    : 0;
}

export async function overview(req, res, next) {
  try {
    const userId = req.user.id;

    const [
      totalDocuments,
      processedDocuments,
      queuedDocuments,
      processingDocuments,
      highRiskDocuments,
      invoiceAgg,
      leakageAgg,
      trustAgg,
    ] = await Promise.all([
     
      Document.countDocuments({
        ownerId: userId,
      }),

      Document.countDocuments({
        ownerId: userId,
        status: "COMPLETED",
      }),

      Document.countDocuments({
        ownerId: userId,
        status: "QUEUED",
      }),

      Document.countDocuments({
        ownerId: userId,
        status: "PROCESSING",
      }),

      prisma.transaction.count({
        where: {
          userId,
          riskLevel: {
            in: ["HIGH", "CRITICAL"],
          },
        },
      }),

      prisma.invoice.aggregate({
        where: {
          userId,
        },
        _sum: {
          total: true,
        },
      }),

      prisma.transaction.aggregate({
        where: {
          userId,
        },
        _sum: {
          potentialLeakage: true,
        },
      }),

      /*
       * Average trust score
       */
      prisma.transaction.aggregate({
        where: {
          userId,
        },
        _avg: {
          transactionTrustScore: true,
        },
      }),
    ]);

    const pendingDocuments =
      queuedDocuments +
      processingDocuments;

    res.json({
      success: true,

      data: {
        totalDocuments,

        processedDocuments,

        pendingDocuments,

        highRiskDocuments,

        totalInvoiceValue:
          money(invoiceAgg._sum.total),

        potentialLeakage:
          money(
            leakageAgg._sum.potentialLeakage
          ),

        averageTrustScore:
          trustAgg._avg
            .transactionTrustScore == null
            ? null
            : number(
                trustAgg._avg
                  .transactionTrustScore
              ),
      },
    });
  } catch (e) {
    next(e);
  }
}

/* ============================================================
   SPENDING TRENDS
   GET /api/analytics/spending-trends
   ============================================================ */

export async function spendingTrends(
  req,
  res,
  next
) {
  try {
    const rows =
      await prisma.$queryRaw`
        SELECT
          DATE_TRUNC(
            'month',
            "invoiceDate"
          ) AS month,

          COALESCE(
            SUM(total),
            0
          ) AS total

        FROM "Invoice"

        WHERE
          "userId" = ${req.user.id}
          AND "invoiceDate" IS NOT NULL

        GROUP BY 1

        ORDER BY 1 ASC
      `;

    const data = rows.map((row) => ({
      /*
       * Frontend-friendly field
       */
      period: row.month
        ? new Date(row.month)
            .toISOString()
            .slice(0, 7)
        : "Unknown",

      /*
       * Original values
       */
      month: row.month,

      total: number(row.total),

      /*
       * Frontend-compatible alias
       */
      amount: number(row.total),
    }));

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
}

/* ============================================================
   VENDOR PERFORMANCE
   GET /api/analytics/vendor-performance
   ============================================================ */

export async function vendorPerformance(
  req,
  res,
  next
) {
  try {
    const rows =
      await prisma.$queryRaw`
        SELECT
          v.id,
          v.name,

          COALESCE(
            SUM(i.total),
            0
          ) AS total_spend,

          COUNT(i.id)::int
            AS invoice_count,

          AVG(
            t."transactionTrustScore"
          ) AS avg_trust

        FROM "Vendor" v

        LEFT JOIN "Invoice" i
          ON i."vendorId" = v.id
          AND i."userId" = ${req.user.id}

        LEFT JOIN "Transaction" t
          ON t."vendorId" = v.id
          AND t."userId" = ${req.user.id}

        GROUP BY
          v.id,
          v.name

        ORDER BY
          total_spend DESC
      `;

    const data = rows.map((row) => ({
      id: row.id,

      /*
       * Backend field
       */
      name: row.name,

      /*
       * Frontend field
       */
      vendor: row.name,

      /*
       * Backend field
       */
      totalSpend:
        number(row.total_spend),

      /*
       * Frontend field
       */
      amount:
        number(row.total_spend),

      invoiceCount:
        number(row.invoice_count),

      averageTrustScore:
        row.avg_trust == null
          ? null
          : number(row.avg_trust),
    }));

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
}

/* ============================================================
   RISK DISTRIBUTION
   GET /api/analytics/risk-distribution
   ============================================================ */

export async function riskDistribution(
  req,
  res,
  next
) {
  try {
    const rows =
      await prisma.transaction.groupBy({
        by: ["riskLevel"],

        where: {
          userId: req.user.id,
        },

        _count: {
          _all: true,
        },
      });

    const data = rows.map((row) => ({
      /*
       * Original Prisma field
       */
      riskLevel: row.riskLevel,

      /*
       * Frontend-friendly field
       */
      level: row.riskLevel,

      /*
       * Count
       */
      count:
        row._count?._all ?? 0,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
}

/* ============================================================
   DOCUMENT TRENDS
   GET /api/analytics/document-trends
   ============================================================ */

export async function documentTrends(
  req,
  res,
  next
) {
  try {
    const docs =
      await Document.aggregate([
        {
          $match: {
            ownerId: req.user.id,
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    const data = docs.map((item) => ({
      /*
       * Backend field
       */
      date: item._id,

      /*
       * Frontend field
       */
      period: item._id,

      count: item.count,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
}

/* ============================================================
   FINANCIAL LEAKAGE
   GET /api/analytics/financial-leakage
   ============================================================ */

export async function financialLeakage(
  req,
  res,
  next
) {
  try {
    const [
      byRisk,
      total,
    ] = await Promise.all([
      prisma.riskEvent.groupBy({
        by: ["type"],

        where: {
          transaction: {
            userId: req.user.id,
          },

          resolvedAt: null,
        },

        _sum: {
          amount: true,
        },

        _count: {
          _all: true,
        },
      }),

      prisma.transaction.aggregate({
        where: {
          userId: req.user.id,
        },

        _sum: {
          potentialLeakage: true,
        },
      }),
    ]);

    const data = byRisk.map((item) => ({
      type: item.type,

      amount:
        money(item._sum.amount),

      count:
        item._count?._all ?? 0,
    }));

    res.json({
      success: true,

      data: {
        totalPotentialLeakage:
          money(
            total._sum
              .potentialLeakage
          ),

        byType: data,
      },
    });
  } catch (e) {
    next(e);
  }
}