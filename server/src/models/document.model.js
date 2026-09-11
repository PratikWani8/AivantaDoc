import mongoose from "mongoose";

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

/* =========================================================
   DOCUMENT
========================================================= */

const documentSchema = new Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    storedName: {
      type: String,
      required: true,
      unique: true,
    },

    path: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    documentType: {
      type: String,
      enum: [
        "INVOICE",
        "PURCHASE_ORDER",
        "RECEIPT",
        "DELIVERY_NOTE",
        "UNKNOWN",
        "unknown",
      ],
      default: "UNKNOWN",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "QUEUED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
      default: "QUEUED",
      index: true,
    },

    error: {
      type: String,
      default: null,
    },

    postgresqlInvoiceId: {
      type: String,
      default: null,
    },

    transactionId: {
      type: String,
      default: null,
    },
  },
  {
    collection: "documents",
    timestamps: true,
    minimize: false,
  }
);

export const Document = mongoose.model(
  "Document",
  documentSchema
);


/* =========================================================
   DOCUMENT METADATA
========================================================= */

const documentMetadataSchema = new Schema(
  {
    documentId: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Document",
    },

    schemaVersion: {
      type: String,
      default: "1.0",
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    collection: "document_metadata",
    timestamps: true,
    minimize: false,
  }
);

export const DocumentMetadata =
  mongoose.model(
    "DocumentMetadata",
    documentMetadataSchema
  );


/* =========================================================
   OCR RESULT
========================================================= */

const ocrResultSchema = new Schema(
  {
    documentId: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Document",
    },

    text: {
      type: String,
      default: "",
    },

    fields: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    collection: "ocr_results",
    timestamps: true,
    minimize: false,
  }
);

export const OcrResult = mongoose.model(
  "OcrResult",
  ocrResultSchema
);


/* =========================================================
   AI ANALYSIS
========================================================= */

const aiAnalysisSchema = new Schema(
  {
    documentId: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Document",
    },

    model: {
      type: String,
      default: null,
    },

    result: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    collection: "ai_analysis",
    timestamps: true,
    minimize: false,
  }
);

export const AiAnalysis = mongoose.model(
  "AiAnalysis",
  aiAnalysisSchema
);


/* =========================================================
   PROCESSING JOB
========================================================= */

const processingJobSchema = new Schema(
  {
    documentId: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Document",
    },

    status: {
      type: String,
      enum: [
        "QUEUED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
      default: "QUEUED",
    },

    attempts: {
      type: Number,
      default: 0,
    },

    error: {
      type: String,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "processing_jobs",
    timestamps: true,
  }
);

export const ProcessingJob =
  mongoose.model(
    "ProcessingJob",
    processingJobSchema
  );


/* =========================================================
   DOCUMENT SCHEMA
========================================================= */

const documentSchemaDefinition = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    version: {
      type: String,
      default: "1.0",
    },

    definition: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    collection: "document_schemas",
    timestamps: true,
    minimize: false,
  }
);

export const DocumentSchema =
  mongoose.model(
    "DocumentSchema",
    documentSchemaDefinition
  );


/* =========================================================
   DOCUMENT RELATIONSHIP GRAPH
========================================================= */

const documentGraphSchema = new Schema(
  {
    documentId: {
      type: ObjectId,
      required: true,
      index: true,
      ref: "Document",
    },

    edges: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  {
    collection: "document_relationship_graph",
    timestamps: true,
    minimize: false,
  }
);

export const DocumentGraph =
  mongoose.model(
    "DocumentGraph",
    documentGraphSchema
  );