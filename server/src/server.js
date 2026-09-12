import fs from "node:fs";
import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { connectMongo } from "./config/mongoose.js";

async function bootstrap(){
  fs.mkdirSync(env.uploadDir,{recursive:true});
  await prisma.$connect();
  console.log("PostgreSQL connected");
  await connectMongo();

  const server=http.createServer(app);
  server.listen(env.port,()=>console.log(`AivantaDoc backend running on http://localhost:${env.port}`));

  const shutdown=async(signal)=>{
    console.log(`${signal} received. Shutting down...`);
    server.close(async()=>{
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on("SIGTERM",()=>shutdown("SIGTERM"));
  process.on("SIGINT",()=>shutdown("SIGINT"));
}

bootstrap().catch(err=>{
  console.error("Startup failed:",err);
  process.exit(1);
});
