import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lateOrders, governorates, users } from "@/lib/db/schema";
import { eq, like, or, desc, and, gte, lte, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET - Fetch late orders
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const archived = searchParams.get("archived") === "true";
    const governorateId = searchParams.get("governorateId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build where conditions
    const conditions = [
      eq(lateOrders.isArchived, archived),
      search
        ? or(
            like(lateOrders.orderNumber, `%${search}%`),
            like(users.fullName, `%${search}%`)
          )
        : undefined,
      governorateId
        ? eq(lateOrders.governorateId, parseInt(governorateId))
        : undefined,
    ].filter(Boolean);

    // Handle date filtering
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      // If same date, search entire day (00:00:00 to 23:59:59)
      if (fromDate === toDate) {
        const dayStart = new Date(from);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(to);
        dayEnd.setHours(23, 59, 59, 999);

        conditions.push(
          and(
            gte(lateOrders.orderDate, dayStart),
            lte(lateOrders.orderDate, dayEnd)
          )
        );
      } else {
        // Different dates, search the range
        conditions.push(
          and(gte(lateOrders.orderDate, from), lte(lateOrders.orderDate, to))
        );
      }
    } else if (fromDate) {
      conditions.push(gte(lateOrders.orderDate, new Date(fromDate)));
    } else if (toDate) {
      conditions.push(lte(lateOrders.orderDate, new Date(toDate)));
    }

    const orders = await db
      .select({
        id: lateOrders.id,
        orderNumber: lateOrders.orderNumber,
        governorateName: governorates.name,
        orderDate: lateOrders.orderDate,
        notes: lateOrders.notes,
        employeeName: users.fullName,
        createdAt: lateOrders.createdAt,
        updatedAt: lateOrders.updatedAt,
        isArchived: lateOrders.isArchived,
        archivedAt: lateOrders.archivedAt,
      })
      .from(lateOrders)
      .leftJoin(governorates, eq(lateOrders.governorateId, governorates.id))
      .leftJoin(users, eq(lateOrders.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(lateOrders.createdAt));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Get late orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch late orders" },
      { status: 500 }
    );
  }
}

// POST - Create new late order
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderNumber, governorateId, orderDate, notes } = body;

    // Validate required fields
    if (!orderNumber || !governorateId || !orderDate) {
      return NextResponse.json(
        {
          error: "Order number, governorate, and order date are required",
        },
        { status: 400 }
      );
    }

    // Validate date format
    const parsedDate = new Date(orderDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const [order] = await db
      .insert(lateOrders)
      .values({
        orderNumber,
        governorateId,
        orderDate: parsedDate,
        notes: notes || null,
        createdBy: session.id,
        updatedBy: session.id,
      })
      .returning();

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Create late order error:", error);
    return NextResponse.json(
      { error: "Failed to create late order" },
      { status: 500 }
    );
  }
}
