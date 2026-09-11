import mongoose from "mongoose";
import { prisma } from "../config/prisma.js";
import { aiHealth } from "../services/ai.service.js";

export async function health(req,res){
  const result={backend:"ok",postgresql:"down",mongodb:"down",aiService:"down"};
  try{await prisma.$queryRaw`SELECT 1`;result.postgresql="ok";}catch{}
  if(mongoose.connection.readyState===1) result.mongodb="ok";
  try{await aiHealth();result.aiService="ok";}catch{}
  const healthy=result.postgresql==="ok" && result.mongodb==="ok";
  res.status(healthy?200:503).json({success:healthy,data:{service:"aivantadoc-backend",...result,timestamp:new Date().toISOString()}});
}
