import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rewardPointsAdditions, users } from "@/lib/db/schema";
import { eq, like, or, desc, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET - Fetch reward points additions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const archived = searchParams.get("archived") === "true";

    const records = await db
      .select({
        id: rewardPointsAdditions.id,
        orderNumber: rewardPointsAdditions.orderNumber,
        customerName: rewardPointsAdditions.customerName,
        orderStatus: rewardPointsAdditions.orderStatus,
        deliveryDate: rewardPointsAdditions.deliveryDate,
        notes: rewardPointsAdditions.notes,
        employeeName: users.fullName,
        createdAt: rewardPointsAdditions.createdAt,
        updatedAt: rewardPointsAdditions.updatedAt,
        isArchived: rewardPointsAdditions.isArchived,
        archivedAt: rewardPointsAdditions.archivedAt,
      })
      .from(rewardPointsAdditions)
      .leftJoin(users, eq(rewardPointsAdditions.createdBy, users.id))
      .where(
        and(
          eq(rewardPointsAdditions.isArchived, archived),
          search
            ? or(
                like(rewardPointsAdditions.orderNumber, `%${search}%`),
                like(rewardPointsAdditions.customerName, `%${search}%`)
              )
            : undefined
        )
      )
      .orderBy(desc(rewardPointsAdditions.createdAt));

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Get reward points error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reward points additions" },
      { status: 500 }
    );
  }
}

// POST - Create new reward points addition
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderNumber, customerName, orderStatus, deliveryDate, notes } =
      body;

    if (!orderNumber || !customerName || !orderStatus || !deliveryDate) {
      return NextResponse.json(
        {
          error:
            "Order number, customer name, order status, and delivery date are required",
        },
        { status: 400 }
      );
    }

    const [record] = await db
      .insert(rewardPointsAdditions)
      .values({
        orderNumber,
        customerName,
        orderStatus,
        deliveryDate: new Date(deliveryDate),
        notes: notes || null,
        createdBy: session.id,
        updatedBy: session.id,
      })
      .returning();

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Create reward points error:", error);
    return NextResponse.json(
      { error: "Failed to create reward points addition" },
      { status: 500 }
    );
  }
}
