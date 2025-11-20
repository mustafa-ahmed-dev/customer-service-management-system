import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { installmentOrders, users } from "@/lib/db/schema";
import { eq, like, or, desc, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET - Fetch installment orders
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const orders = await db
      .select({
        id: installmentOrders.id,
        orderNumber: installmentOrders.orderNumber,
        installmentId: installmentOrders.installmentId,
        isAddedToMagento: installmentOrders.isAddedToMagento,
        cardholderName: installmentOrders.cardholderName,
        cardholderMotherName: installmentOrders.cardholderMotherName,
        cardholderPhoneNumber: installmentOrders.cardholderPhoneNumber,
        employeeName: users.fullName,
        createdAt: installmentOrders.createdAt,
        updatedAt: installmentOrders.updatedAt,
      })
      .from(installmentOrders)
      .leftJoin(users, eq(installmentOrders.createdBy, users.id))
      .where(
        search
          ? or(
              like(installmentOrders.orderNumber, `%${search}%`),
              like(installmentOrders.installmentId, `%${search}%`),
              like(installmentOrders.cardholderName, `%${search}%`)
            )
          : undefined
      )
      .orderBy(
        asc(installmentOrders.isAddedToMagento), // false (0) first, true (1) last
        desc(installmentOrders.createdAt)
      );

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Get installment orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch installment orders" },
      { status: 500 }
    );
  }
}

// POST - Create new installment order
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderNumber,
      installmentId,
      isAddedToMagento,
      cardholderName,
      cardholderMotherName,
      cardholderPhoneNumber,
    } = body;

    // Validate required fields
    if (!orderNumber || !installmentId) {
      return NextResponse.json(
        { error: "Order number and installment ID are required" },
        { status: 400 }
      );
    }

    // Check if order number already exists
    const [existingOrderNumber] = await db
      .select()
      .from(installmentOrders)
      .where(eq(installmentOrders.orderNumber, orderNumber))
      .limit(1);

    if (existingOrderNumber) {
      return NextResponse.json(
        { error: `Order number "${orderNumber}" already exists` },
        { status: 400 }
      );
    }

    // Check if installment ID already exists
    const [existingInstallmentId] = await db
      .select()
      .from(installmentOrders)
      .where(eq(installmentOrders.installmentId, installmentId))
      .limit(1);

    if (existingInstallmentId) {
      return NextResponse.json(
        { error: `Installment ID "${installmentId}" already exists` },
        { status: 400 }
      );
    }

    const [order] = await db
      .insert(installmentOrders)
      .values({
        orderNumber,
        installmentId,
        isAddedToMagento: isAddedToMagento || false,
        cardholderName: cardholderName || null,
        cardholderMotherName: cardholderMotherName || null,
        cardholderPhoneNumber: cardholderPhoneNumber || null,
        createdBy: session.id,
        updatedBy: session.id,
      })
      .returning();

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Create installment order error:", error);
    return NextResponse.json(
      { error: "Failed to create installment order" },
      { status: 500 }
    );
  }
}
