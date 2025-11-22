import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentMethods } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET - Fetch payment methods for dropdown
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // All authenticated users can view payment methods
    // No role restriction - everyone needs this for viewing

    const methods = await db
      .select({
        id: paymentMethods.id,
        name: paymentMethods.name,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, true))
      .orderBy(paymentMethods.name);

    return NextResponse.json({ paymentMethods: methods });
  } catch (error) {
    console.error("Fetch payment methods error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}
