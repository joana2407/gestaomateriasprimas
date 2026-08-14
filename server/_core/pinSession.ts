import { jwtVerify, SignJWT } from "jose";
import { parse } from "cookie";
import type { Request } from "express";
import { ENV } from "./env";

export const PIN_SESSION_COOKIE = "siga_pin_session";
const PIN_SESSION_DURATION_SECONDS = 12 * 60 * 60;

function secretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function criarTokenSessaoPin(userId: number) {
  if (!ENV.cookieSecret) throw new Error("A chave de sessão não está configurada.");
  return new SignJWT({ tipo: "pin", userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PIN_SESSION_DURATION_SECONDS}s`)
    .sign(secretKey());
}

export async function lerUtilizadorSessaoPin(req: Request) {
  if (!ENV.cookieSecret) return null;
  const token = parse(req.headers.cookie ?? "")[PIN_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.tipo !== "pin" || typeof payload.userId !== "number") return null;
    return payload.userId;
  } catch {
    return null;
  }
}

export const PIN_SESSION_MAX_AGE_MS = PIN_SESSION_DURATION_SECONDS * 1000;
