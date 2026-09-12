import { prisma } from "../config/prisma.js";

export async function risks(req, res, next) {
  try {
    const where = {
      transaction: {
        userId: req.user.id,
      },
    };

    if (req.query.severity) {
      where.severity = String(
        req.query.severity
      ).toUpperCase();
    }

    const data = await prisma.riskEvent.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        transaction: {
          select: {
            id: true,
            invoiceId: true,
            vendorId: true,
            riskLevel: true,
            transactionTrustScore: true,
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

export async function riskSummary(req, res, next) {
  try {
    const rows = await prisma.riskEvent.groupBy({
      by: ["severity"],
      where: {
        transaction: {
          userId: req.user.id,
        },
        resolvedAt: null,
      },
      _count: {
        _all: true,
      },
    });

    const data = rows.map((row) => ({
      severity: row.severity,
      level: row.severity,
      count: row._count._all,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
}

export async function riskById(req, res, next) {
  try {
    const data = await prisma.riskEvent.findFirst({
      where: {
        id: req.params.id,
        transaction: {
          userId: req.user.id,
        },
      },
      include: {
        transaction: {
          include: {
            vendor: true,
            invoice: true,
          },
        },
      },
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RISK_NOT_FOUND",
          message: "Risk event not found",
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

export async function resolveRisk(req, res, next) {
  try {
    const existing = await prisma.riskEvent.findFirst({
      where: {
        id: req.params.id,
        transaction: {
          userId: req.user.id,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RISK_NOT_FOUND",
          message: "Risk event not found",
        },
      });
    }

    const data = await prisma.riskEvent.update({
      where: {
        id: existing.id,
      },
      data: {
        resolvedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        resolved: true,
        risk: data,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function anomalies(req, res, next) {
  try {
    const data = await prisma.anomaly.findMany({
      where: {
        transaction: {
          userId: req.user.id,
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
            vendorId: true,
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

export async function anomalySummary(req, res, next) {
  try {
    const rows = await prisma.anomaly.groupBy({
      by: ["severity"],
      where: {
        transaction: {
          userId: req.user.id,
        },
      },
      _count: {
        _all: true,
      },
    });

    const data = rows.map((row) => ({
      severity: row.severity,
      level: row.severity,
      count: row._count._all,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
}