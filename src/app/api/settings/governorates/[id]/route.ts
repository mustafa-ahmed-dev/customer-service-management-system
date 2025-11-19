import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { governorates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

// PUT - Update governorate (admin & moderator)
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
      .update(governorates)
      .set({ name })
      .where(eq(governorates.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Governorate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ governorate: updated });
  } catch (error) {
    console.error("Update governorate error:", error);
    return NextResponse.json(
      { error: "Failed to update governorate" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate governorate (admin only)
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
      .update(governorates)
      .set({
        deactivatedAt: new Date(),
        deactivatedBy: session.id,
      })
      .where(eq(governorates.id, parseInt(id)))
      .returning();

    if (!deactivated) {
      return NextResponse.json(
        { error: "Governorate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Governorate deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate governorate error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate governorate" },
      { status: 500 }
    );
  }
}
