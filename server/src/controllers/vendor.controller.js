import { prisma } from "../config/prisma.js";

export async function vendors(req, res, next) {
  try {
    const data = await prisma.vendor.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
}

export async function vendor(req, res, next) {
  try {
    const data = await prisma.vendor.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VENDOR_NOT_FOUND",
          message: "Vendor not found",
        },
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
}

/*
 * ============================================================
 * VENDOR PERFORMANCE
 * GET /api/vendors/:id/performance
 * ============================================================
 */

export async function performance(req, res, next) {
  try {
    const vendorId = req.params.id;
    const userId = req.user.id;

    const v = await prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
    });

    if (!v) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VENDOR_NOT_FOUND",
          message: "Vendor not found",
        },
      });
    }

    const [
      invoiceAgg,
      transactionCount,
      trustAgg,
      riskCount,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          vendorId,
          userId,
        },
        _sum: {
          total: true,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.transaction.count({
        where: {
          vendorId,
          userId,
        },
      }),

      prisma.transaction.aggregate({
        where: {
          vendorId,
          userId,
        },
        _avg: {
          transactionTrustScore: true,
        },
      }),

      prisma.riskEvent.count({
        where: {
          transaction: {
            vendorId,
            userId,
          },
          resolvedAt: null,
        },
      }),
    ]);

    res.json({
      success: true,

      data: {
        vendor: v,

        totalInvoiceValue:
          invoiceAgg._sum.total == null
            ? 0
            : Number(invoiceAgg._sum.total),

        invoiceCount:
          invoiceAgg._count._all,

        transactionCount,

        averageTrustScore:
          trustAgg._avg
            .transactionTrustScore == null
            ? null
            : Number(
                trustAgg._avg
                  .transactionTrustScore
              ),

        unresolvedRiskCount: riskCount,
      },
    });
  } catch (e) {
    next(e);
  }
}

/*
 * ============================================================
 * VENDOR RISKS
 * GET /api/vendors/:id/risks
 * ============================================================
 */

export async function risk(req, res, next) {
  try {
    const vendorId = req.params.id;
    const userId = req.user.id;

    const vendorExists =
      await prisma.vendor.findUnique({
        where: {
          id: vendorId,
        },
        select: {
          id: true,
        },
      });

    if (!vendorExists) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VENDOR_NOT_FOUND",
          message: "Vendor not found",
        },
      });
    }

    const data =
      await prisma.riskEvent.findMany({
        where: {
          transaction: {
            vendorId,
            userId,
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          transaction: {
            select: {
              id: true,
              invoiceId: true,
              transactionTrustScore: true,
              riskLevel: true,
            },
          },
        },
      });

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
}

/*
 * ============================================================
 * VENDOR TRANSACTIONS
 * GET /api/vendors/:id/transactions
 * ============================================================
 */

export async function transactions(
  req,
  res,
  next
) {
  try {
    const vendorId = req.params.id;
    const userId = req.user.id;

    const vendorExists =
      await prisma.vendor.findUnique({
        where: {
          id: vendorId,
        },
        select: {
          id: true,
        },
      });

    if (!vendorExists) {
      return res.status(404).json({
        success: false,
        error: {
          code: "VENDOR_NOT_FOUND",
          message: "Vendor not found",
        },
      });
    }

    const data =
      await prisma.transaction.findMany({
        where: {
          vendorId,
          userId,
        },

        include: {
          invoice: {
            include: {
              items: true,
              purchaseOrder: true,
            },
          },

          vendor: true,

          risks: true,

          anomalies: true,

          erpRecords: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
}