import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cancelledOrders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

// PUT - Update cancelled order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.role, "EDIT_RECORD")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { orderNumber, cancellationReasonId, systemId } = body;

    const [order] = await db
      .update(cancelledOrders)
      .set({
        orderNumber,
        cancellationReasonId,
        systemId,
        updatedBy: session.id,
        updatedAt: new Date(),
      })
      .where(eq(cancelledOrders.id, parseInt(id)))
      .returning();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Update cancelled order error:", error);
    return NextResponse.json(
      { error: "Failed to update cancelled order" },
      { status: 500 }
    );
  }
}

// DELETE - Delete cancelled order (admin only)
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

    // Soft delete by setting deactivatedAt
    const [order] = await db
      .update(cancelledOrders)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: session.id,
      })
      .where(eq(cancelledOrders.id, parseInt(id)))
      .returning();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete cancelled order error:", error);
    return NextResponse.json(
      { error: "Failed to delete cancelled order" },
      { status: 500 }
    );
  }
}
