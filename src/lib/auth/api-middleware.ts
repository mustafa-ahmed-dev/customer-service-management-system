import { NextRequest, NextResponse } from "next/server";
import { getSession, SessionUser } from "./session";

export async function requireAuth(
  request: NextRequest
): Promise<{ session: SessionUser } | NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { session };
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ session: SessionUser } | NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { session };
}
