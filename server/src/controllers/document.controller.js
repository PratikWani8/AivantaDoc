import fs from "node:fs/promises";

import {
  Document,
  OcrResult,
  AiAnalysis,
} from "../models/document.model.js";

import {
  createDocumentJob,
  processDocument,
} from "../services/document.service.js";

import { prisma } from "../config/prisma.js";

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(422).json({
        success: false,
        error: {
          code: "FILE_REQUIRED",
          message: "A document file is required",
        },
      });
    }

    const doc = await createDocumentJob({
      file: req.file,
      ownerId: req.user.id,
    });

    return res.status(202).json({
      success: true,
      data: {
        id: doc._id,
        status: doc.status,
        documentType: doc.documentType,
      },
    });
  } catch (e) {
    next(e);
  }
}

/* =========================================================
   LIST DOCUMENTS
========================================================= */

export async function listDocuments(req, res, next) {
  try {
    const query = {
      ownerId: req.user.id,
    };

    // Optional status filter
    if (req.query.status) {
      const status = String(req.query.status).toUpperCase();

      const allowedStatuses = [
        "QUEUED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ];

      if (allowedStatuses.includes(status)) {
        query.status = status;
      }
    }

    const docs = await Document.find(query)
      .sort({ createdAt: -1 })
      .select("-path")
      .lean();

    /*
     * Fetch OCR and AI records individually.
     *
     * This intentionally avoids:
     *
     * documentId: { $in: documentIds }
     *
     * because your current Mongo/Mongoose setup was
     * producing an ObjectId casting error.
     */

    const result = await Promise.all(
      docs.map(async (doc) => {
        const [ocr, ai] = await Promise.all([
          OcrResult.findOne({
            documentId: doc._id,
          }).lean(),

          AiAnalysis.findOne({
            documentId: doc._id,
          }).lean(),
        ]);

        return {
          ...doc,
          ocr: ocr || null,
          ai: ai || null,
        };
      })
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
}

/* =========================================================
   GET SINGLE DOCUMENT
========================================================= */

export async function getDocument(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    })
      .select("-path")
      .lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    const [ocr, ai] = await Promise.all([
      OcrResult.findOne({
        documentId: doc._id,
      }).lean(),

      AiAnalysis.findOne({
        documentId: doc._id,
      }).lean(),
    ]);

    return res.json({
      success: true,
      data: {
        ...doc,
        ocr: ocr || null,
        ai: ai || null,
      },
    });
  } catch (e) {
    next(e);
  }
}

/* =========================================================
   DOCUMENT STATUS
========================================================= */

export async function documentStatus(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    })
      .select(
        "_id status documentType error updatedAt"
      )
      .lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    return res.json({
      success: true,
      data: doc,
    });
  } catch (e) {
    next(e);
  }
}

/* =========================================================
   EXTRACTED DATA
========================================================= */

export async function extractedData(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    }).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    const ocr = await OcrResult.findOne({
      documentId: doc._id,
    }).lean();

    return res.json({
      success: true,
      data: {
        documentId: doc._id,
        fields: ocr?.fields || null,
        text: ocr?.text || null,
      },
    });
  } catch (e) {
    next(e);
  }
}

/* =========================================================
   VERIFY DOCUMENT
========================================================= */

export async function verifyDocument(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    if (doc.postgresqlInvoiceId) {
      await prisma.invoice.updateMany({
        where: {
          id: doc.postgresqlInvoiceId,
          userId: req.user.id,
        },
        data: {
          verificationStatus: "APPROVED",
        },
      });
    }

    if (doc.transactionId) {
      await prisma.transaction.updateMany({
        where: {
          id: doc.transactionId,
          userId: req.user.id,
        },
        data: {
          verificationStatus: "APPROVED",
        },
      });
    }

    return res.json({
      success: true,
      data: {
        id: doc._id,
        verificationStatus: "APPROVED",
      },
    });
  } catch (e) {
    next(e);
  }
}

/* =========================================================
   APPROVE DOCUMENT
========================================================= */

export async function approveDocument(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    if (doc.postgresqlInvoiceId) {
      await prisma.invoice.updateMany({
        where: {
          id: doc.postgresqlInvoiceId,
          userId: req.user.id,
        },
        data: {
          verificationStatus: "APPROVED",
        },
      });
    }

    if (doc.transactionId) {
      await prisma.transaction.updateMany({
        where: {
          id: doc.transactionId,
          userId: req.user.id,
        },
        data: {
          verificationStatus: "APPROVED",
        },
      });
    }

    return res.json({
      success: true,
      data: {
        id: doc._id,
        verificationStatus: "APPROVED",
      },
    });
  } catch (e) {
    next(e);
  }
}

/* =========================================================
   REJECT DOCUMENT
========================================================= */

export async function rejectDocument(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    const reason =
      req.body?.reason ||
      "Document rejected by user";

    if (doc.postgresqlInvoiceId) {
      await prisma.invoice.updateMany({
        where: {
          id: doc.postgresqlInvoiceId,
          userId: req.user.id,
        },
        data: {
          verificationStatus: "REJECTED",
        },
      });
    }

    if (doc.transactionId) {
      await prisma.transaction.updateMany({
        where: {
          id: doc.transactionId,
          userId: req.user.id,
        },
        data: {
          verificationStatus: "REJECTED",
        },
      });
    }

    return res.json({
      success: true,
      data: {
        id: doc._id,
        verificationStatus: "REJECTED",
        reason,
      },
    });
  } catch (e) {
    next(e);
  }
}

/* =========================================================
   DELETE DOCUMENT
========================================================= */

export async function deleteDocument(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    /*
     * Delete PostgreSQL invoice and related records.
     *
     * Prisma relations use cascade where configured.
     */
    if (doc.postgresqlInvoiceId) {
      await prisma.invoice
        .delete({
          where: {
            id: doc.postgresqlInvoiceId,
          },
        })
        .catch(() => {});
    }

    // Delete physical uploaded file
    await fs.unlink(doc.path).catch(() => {});

    // Delete OCR and AI records
    await Promise.all([
      OcrResult.deleteMany({
        documentId: doc._id,
      }),

      AiAnalysis.deleteMany({
        documentId: doc._id,
      }),
    ]);

    // Delete MongoDB document
    await Document.deleteOne({
      _id: doc._id,
    });

    return res.json({
      success: true,
      data: {
        message: "Document deleted",
      },
    });
  } catch (e) {
    next(e);
  }
}

/* =========================================================
   REPROCESS DOCUMENT
========================================================= */

export async function reprocessDocument(req, res, next) {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    doc.status = "QUEUED";
    doc.error = null;

    await doc.save();

    await processDocument(
      doc._id.toString()
    );

    return res.status(202).json({
      success: true,
      data: {
        id: doc._id,
        status: doc.status,
      },
    });
  } catch (e) {
    next(e);
  }
}