import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cancellationReasons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

// PUT - Update cancellation reason (admin & moderator)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "MANAGE_SETTINGS")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    const [updated] = await db
      .update(cancellationReasons)
      .set({ reason })
      .where(eq(cancellationReasons.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Reason not found" }, { status: 404 });
    }

    return NextResponse.json({ reason: updated });
  } catch (error) {
    console.error("Update cancellation reason error:", error);
    return NextResponse.json(
      { error: "Failed to update cancellation reason" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate cancellation reason (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can deactivate
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [deactivated] = await db
      .update(cancellationReasons)
      .set({
        deactivatedAt: new Date(),
        deactivatedBy: session.id,
      })
      .where(eq(cancellationReasons.id, parseInt(id)))
      .returning();

    if (!deactivated) {
      return NextResponse.json({ error: "Reason not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Reason deactivated successfully" });
  } catch (error) {
    console.error("Deactivate cancellation reason error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate cancellation reason" },
      { status: 500 }
    );
  }
}
