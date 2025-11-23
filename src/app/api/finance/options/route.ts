import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentMethods, users } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET - Fetch payment methods and users for dropdown
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // All authenticated users can view payment methods and users
    // No role restriction - everyone needs this for viewing

    const methods = await db
      .select({
        id: paymentMethods.id,
        name: paymentMethods.name,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, true))
      .orderBy(paymentMethods.name);

    // Fetch active users (not deactivated)
    const activeUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        role: users.role,
      })
      .from(users)
      .where(isNull(users.deactivatedAt))
      .orderBy(users.fullName);

    return NextResponse.json({
      paymentMethods: methods,
      users: activeUsers,
    });
  } catch (error) {
    console.error("Fetch options error:", error);
    return NextResponse.json(
      { error: "Failed to fetch options" },
      { status: 500 }
    );
  }
}
