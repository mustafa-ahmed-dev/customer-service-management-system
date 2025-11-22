import { cookies } from "next/headers";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export interface SessionUser {
  id: number;
  email: string;
  fullName: string;
  role: "admin" | "moderator" | "user";
}

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionUser {
  id: number;
  email: string;
  fullName: string;
  role: "admin" | "moderator" | "user";
  hasFinanceAccess: boolean; // NEW
}

export async function createSession(userId: number): Promise<string> {
  const sessionToken = encodeSessionToken(userId);
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return sessionToken;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    // Decode the session token to get userId
    const userId = decodeSessionToken(sessionToken);

    // Get user from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        hasFinanceAccess: users.hasFinanceAccess,
        deactivatedAt: users.deactivatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.deactivatedAt) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as "admin" | "moderator" | "user",
      hasFinanceAccess: user.hasFinanceAccess,
    };
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

function encodeSessionToken(userId: number): string {
  // Simple encoding: base64(userId:timestamp:random)
  const random = Math.random().toString(36).substring(2);
  const data = `${userId}:${Date.now()}:${random}`;
  return Buffer.from(data).toString("base64");
}

function decodeSessionToken(token: string): number {
  // Decode the token and extract userId
  const decoded = Buffer.from(token, "base64").toString("utf-8");
  const [userIdStr] = decoded.split(":");
  const userId = parseInt(userIdStr, 10);

  if (isNaN(userId)) {
    throw new Error("Invalid session token");
  }

  return userId;
}
