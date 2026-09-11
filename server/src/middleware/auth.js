import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ success:false, error:{code:"UNAUTHORIZED",message:"Authentication required"} });
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ success:false, error:{code:"UNAUTHORIZED",message:"User no longer exists"} });
    }
    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch {
    return res.status(401).json({ success:false, error:{code:"INVALID_TOKEN",message:"Invalid or expired token"} });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success:false, error:{code:"FORBIDDEN",message:"Insufficient permissions"} });
    }
    next();
  };
}
