import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financeTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// PUT - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has finance access
    if (!session.hasFinanceAccess) {
      return NextResponse.json(
        { error: "You don't have permission to manage finance" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      phoneNumber,
      orderNumber,
      customerName,
      paymentMethodId,
      amount,
      status,
      notes,
    } = body;

    // Validate required fields
    if (
      !phoneNumber ||
      !customerName ||
      !paymentMethodId ||
      !amount ||
      !status
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .update(financeTransactions)
      .set({
        phoneNumber,
        orderNumber: orderNumber || null,
        customerName,
        paymentMethodId: parseInt(paymentMethodId),
        amount: amount.toString(),
        status,
        notes: notes || null,
        updatedBy: session.id,
        updatedAt: new Date(),
      })
      .where(eq(financeTransactions.id, parseInt(id)))
      .returning();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete transaction (archive)
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

    const [transaction] = await db
      .update(financeTransactions)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: session.id,
      })
      .where(eq(financeTransactions.id, parseInt(id)))
      .returning();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
