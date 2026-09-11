import { register, login } from "../services/auth.service.js";
import { prisma } from "../config/prisma.js";

export async function registerController(req,res,next) {
  try { res.status(201).json({success:true,data:await register(req.body)}); } catch(e){ next(e); }
}
export async function loginController(req,res,next) {
  try { res.json({success:true,data:await login(req.body)}); } catch(e){ next(e); }
}
export async function meController(req,res,next) {
  try {
    const user = await prisma.user.findUnique({ where:{id:req.user.id}, select:{id:true,name:true,email:true,role:true,createdAt:true} });
    res.json({success:true,data:user});
  } catch(e){ next(e); }
}
export async function logoutController(req,res) {
  res.json({success:true,data:{message:"Logged out. Remove the bearer token on the client."}});
}
