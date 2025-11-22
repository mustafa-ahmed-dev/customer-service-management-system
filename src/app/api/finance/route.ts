import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financeTransactions, paymentMethods, users } from "@/lib/db/schema";
import { eq, like, or, desc, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET - Fetch finance transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // All authenticated users can view finance (view-only by default)
    // No role restriction here - everyone can view

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentMethodId = searchParams.get("paymentMethodId") || "";
    const showArchived = searchParams.get("archived") === "true";

    // Build where conditions
    const conditions = [eq(financeTransactions.isArchived, showArchived)];

    if (search) {
      conditions.push(
        or(
          like(financeTransactions.phoneNumber, `%${search}%`),
          like(financeTransactions.orderNumber, `%${search}%`),
          like(financeTransactions.customerName, `%${search}%`)
        )!
      );
    }

    if (status) {
      conditions.push(eq(financeTransactions.status, status));
    }

    if (paymentMethodId) {
      conditions.push(
        eq(financeTransactions.paymentMethodId, parseInt(paymentMethodId))
      );
    }

    const transactions = await db
      .select({
        id: financeTransactions.id,
        phoneNumber: financeTransactions.phoneNumber,
        orderNumber: financeTransactions.orderNumber,
        customerName: financeTransactions.customerName,
        paymentMethodId: financeTransactions.paymentMethodId,
        paymentMethodName: paymentMethods.name,
        amount: financeTransactions.amount,
        status: financeTransactions.status,
        notes: financeTransactions.notes,
        employeeName: users.fullName,
        createdAt: financeTransactions.createdAt,
        updatedAt: financeTransactions.updatedAt,
        archivedAt: financeTransactions.archivedAt,
      })
      .from(financeTransactions)
      .leftJoin(
        paymentMethods,
        eq(financeTransactions.paymentMethodId, paymentMethods.id)
      )
      .leftJoin(users, eq(financeTransactions.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(financeTransactions.createdAt));

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST - Create new transaction
export async function POST(request: NextRequest) {
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
      .insert(financeTransactions)
      .values({
        phoneNumber,
        orderNumber: orderNumber || null,
        customerName,
        paymentMethodId: parseInt(paymentMethodId),
        amount: amount.toString(),
        status,
        notes: notes || null,
        createdBy: session.id,
        updatedBy: session.id,
      })
      .returning();

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
