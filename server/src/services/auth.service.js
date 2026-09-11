import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

export async function register({ name, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) throw Object.assign(new Error("Email is already registered"), { statusCode:409, code:"EMAIL_EXISTS" });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email: normalizedEmail, passwordHash }
  });
  return issueToken(user);
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw Object.assign(new Error("Invalid email or password"), { statusCode:401, code:"INVALID_CREDENTIALS" });
  }
  return issueToken(user);
}

function issueToken(user) {
  const token = jwt.sign({ sub:user.id, role:user.role }, env.jwtSecret, { expiresIn:env.jwtExpiresIn });
  return { token, user:{ id:user.id, name:user.name, email:user.email, role:user.role } };
}
