import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { installmentOrders } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

// DELETE - Bulk delete all installment orders (admin/moderator only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and moderator can bulk delete
    if (session.role !== "admin" && session.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // HARD DELETE ALL - permanently remove all records
    const deleted = await db.delete(installmentOrders).returning();

    return NextResponse.json({
      message: `Permanently deleted ${deleted.length} orders`,
      count: deleted.length,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Failed to bulk delete orders" },
      { status: 500 }
    );
  }
}
