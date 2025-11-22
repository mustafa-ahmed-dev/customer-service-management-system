import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inactiveCoupons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

// PUT - Update inactive coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "EDIT_RECORD")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { salesOrder, couponCode, notes } = body;

    const [updated] = await db
      .update(inactiveCoupons)
      .set({
        salesOrder,
        couponCode,
        notes: notes || null,
        updatedBy: session.id,
        updatedAt: new Date(),
      })
      .where(eq(inactiveCoupons.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ record: updated });
  } catch (error) {
    console.error("Update inactive coupon error:", error);
    return NextResponse.json(
      { error: "Failed to update inactive coupon" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete (archive) inactive coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can delete
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [archived] = await db
      .update(inactiveCoupons)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: session.id,
      })
      .where(eq(inactiveCoupons.id, parseInt(id)))
      .returning();

    if (!archived) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Inactive coupon archived successfully",
    });
  } catch (error) {
    console.error("Delete inactive coupon error:", error);
    return NextResponse.json(
      { error: "Failed to archive inactive coupon" },
      { status: 500 }
    );
  }
}
