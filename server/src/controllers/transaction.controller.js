import { prisma } from "../config/prisma.js";

const txInclude = {
  invoice: {
    include: {
      items: true,
      purchaseOrder: true,
      vendor: true,
      receipts: true,
    },
  },
  vendor: true,
  risks: true,
  anomalies: true,
  erpRecords: true,
};

export async function listTransactions(req, res, next) {
  try {
    const data = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
      },
      include: txInclude,
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

export async function getTransaction(req, res, next) {
  try {
    const data = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: txInclude,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Transaction not found",
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

export async function trustScore(req, res, next) {
  try {
    const data = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      select: {
        id: true,
        documentConfidence: true,
        poMatchScore: true,
        vendorTrustScore: true,
        priceConsistencyScore: true,
        duplicateProbability: true,
        transactionTrustScore: true,
        riskLevel: true,
        riskExplanation: true,
        verificationStatus: true,
      },
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Transaction not found",
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

export async function relationships(req, res, next) {
  try {
    const tx = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      select: {
        id: true,
        invoiceId: true,
      },
    });

    if (!tx) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Transaction not found",
        },
      });
    }

    if (!tx.invoiceId) {
      return res.json({
        success: true,
        data: {
          invoice: null,
          relationships: [],
        },
      });
    }

    const [invoice, relationshipData] = await Promise.all([
      prisma.invoice.findUnique({
        where: {
          id: tx.invoiceId,
        },
        include: {
          vendor: true,
          purchaseOrder: true,
          items: true,
          receipts: true,
        },
      }),

      prisma.documentRelationship.findMany({
        where: {
          OR: [
            {
              sourceId: tx.invoiceId,
            },
            {
              targetId: tx.invoiceId,
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        invoice,
        relationships: relationshipData,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function setVerification(req, res, next, status) {
  try {
    const tx = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      select: {
        id: true,
        invoiceId: true,
      },
    });

    if (!tx) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Transaction not found",
        },
      });
    }

    const updated = await prisma.$transaction([
      prisma.transaction.update({
        where: {
          id: tx.id,
        },
        data: {
          verificationStatus: status,
        },
      }),

      ...(tx.invoiceId
        ? [
            prisma.invoice.update({
              where: {
                id: tx.invoiceId,
              },
              data: {
                verificationStatus: status,
              },
            }),
          ]
        : []),
    ]);

    res.json({
      success: true,
      data: {
        transaction: updated[0],
        invoice: updated[1] || null,
        verificationStatus: status,
      },
    });
  } catch (e) {
    next(e);
  }
}

export const approveTransaction = (req, res, next) =>
  setVerification(req, res, next, "APPROVED");

export const rejectTransaction = (req, res, next) =>
  setVerification(req, res, next, "REJECTED");