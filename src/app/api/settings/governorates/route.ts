import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { governorates, users } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

// GET - Fetch all governorates
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeDeactivated =
      searchParams.get("includeDeactivated") === "true";

    const governoratesList = await db
      .select({
        id: governorates.id,
        name: governorates.name,
        createdAt: governorates.createdAt,
        createdByName: users.fullName,
        deactivatedAt: governorates.deactivatedAt,
      })
      .from(governorates)
      .leftJoin(users, eq(governorates.createdBy, users.id))
      .where(
        includeDeactivated ? undefined : isNull(governorates.deactivatedAt)
      )
      .orderBy(desc(governorates.createdAt));

    return NextResponse.json({ governorates: governoratesList });
  } catch (error) {
    console.error("Get governorates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch governorates" },
      { status: 500 }
    );
  }
}

// POST - Create new governorate (admin & moderator)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "MANAGE_SETTINGS")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, nameAr } = body;

    if (!name || !nameAr) {
      return NextResponse.json(
        { error: "Governorate name (English and Arabic) is required" },
        { status: 400 }
      );
    }

    const [newGovernorate] = await db
      .insert(governorates)
      .values({
        name,
        createdBy: session.id,
      })
      .returning();

    return NextResponse.json({ governorate: newGovernorate }, { status: 201 });
  } catch (error) {
    console.error("Create governorate error:", error);
    return NextResponse.json(
      { error: "Failed to create governorate" },
      { status: 500 }
    );
  }
}
