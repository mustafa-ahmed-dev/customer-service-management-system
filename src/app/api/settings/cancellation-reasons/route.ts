import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cancellationReasons, users } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

// GET - Fetch all cancellation reasons (active and deactivated)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeDeactivated =
      searchParams.get("includeDeactivated") === "true";

    const reasons = await db
      .select({
        id: cancellationReasons.id,
        reason: cancellationReasons.reason,
        createdAt: cancellationReasons.createdAt,
        createdByName: users.fullName,
        deactivatedAt: cancellationReasons.deactivatedAt,
      })
      .from(cancellationReasons)
      .leftJoin(users, eq(cancellationReasons.createdBy, users.id))
      .where(
        includeDeactivated
          ? undefined
          : isNull(cancellationReasons.deactivatedAt)
      )
      .orderBy(desc(cancellationReasons.createdAt));

    return NextResponse.json({ reasons });
  } catch (error) {
    console.error("Get cancellation reasons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cancellation reasons" },
      { status: 500 }
    );
  }
}

// POST - Create new cancellation reason (admin & moderator)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.role, "MANAGE_SETTINGS")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { reason, reasonAr } = body;

    if (!reason || !reasonAr) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    const [newReason] = await db
      .insert(cancellationReasons)
      .values({
        reason,
        createdBy: session.id,
      })
      .returning();

    return NextResponse.json({ reason: newReason }, { status: 201 });
  } catch (error) {
    console.error("Create cancellation reason error:", error);
    return NextResponse.json(
      { error: "Failed to create cancellation reason" },
      { status: 500 }
    );
  }
}
