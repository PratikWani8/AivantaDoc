import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import documentRoutes from "./routes/document.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import riskRoutes,{anomalyRouter} from "./routes/risk.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { health } from "./controllers/health.controller.js";
import { notFound,errorHandler } from "./middleware/error.js";

const app=express();

app.set("trust proxy",1);
app.use(helmet());
app.use(cors({
  origin: env.corsOrigin.split(",").map(x=>x.trim()),
  credentials:true,
  methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
}));
app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({extended:false,limit:"1mb"}));
app.use(morgan(env.nodeEnv==="production"?"combined":"dev"));

const limiter=rateLimit({
  windowMs:15*60*1000,
  limit:300,
  standardHeaders:"draft-8",
  legacyHeaders:false,
  message:{success:false,error:{code:"RATE_LIMITED",message:"Too many requests. Please try again later."}}
});
app.use("/api",limiter);

app.get("/api/health",health);

app.use("/api/auth", authRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/risks", riskRoutes);

app.use("/api/anomalies", anomalyRouter);

app.use("/api/analytics", analyticsRoutes);

app.use("/api/vendors", vendorRoutes);

app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
