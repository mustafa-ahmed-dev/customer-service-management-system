import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

// PUT - Update system (admin & moderator)
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
    const { name } = body;

    const [updated] = await db
      .update(systems)
      .set({ name })
      .where(eq(systems.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "System not found" }, { status: 404 });
    }

    return NextResponse.json({ system: updated });
  } catch (error) {
    console.error("Update system error:", error);
    return NextResponse.json(
      { error: "Failed to update system" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate system (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [deactivated] = await db
      .update(systems)
      .set({
        deactivatedAt: new Date(),
        deactivatedBy: session.id,
      })
      .where(eq(systems.id, parseInt(id)))
      .returning();

    if (!deactivated) {
      return NextResponse.json({ error: "System not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "System deactivated successfully" });
  } catch (error) {
    console.error("Deactivate system error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate system" },
      { status: 500 }
    );
  }
}
