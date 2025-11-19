import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systems, users } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

// GET - Fetch all systems
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeDeactivated =
      searchParams.get("includeDeactivated") === "true";

    const systemsList = await db
      .select({
        id: systems.id,
        name: systems.name,
        createdAt: systems.createdAt,
        createdByName: users.fullName,
        deactivatedAt: systems.deactivatedAt,
      })
      .from(systems)
      .leftJoin(users, eq(systems.createdBy, users.id))
      .where(includeDeactivated ? undefined : isNull(systems.deactivatedAt))
      .orderBy(desc(systems.createdAt));

    return NextResponse.json({ systems: systemsList });
  } catch (error) {
    console.error("Get systems error:", error);
    return NextResponse.json(
      { error: "Failed to fetch systems" },
      { status: 500 }
    );
  }
}

// POST - Create new system (admin & moderator)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "ADD_EDIT_SETTINGS")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "System name (English and Arabic) is required" },
        { status: 400 }
      );
    }

    const [newSystem] = await db
      .insert(systems)
      .values({
        name,
        createdBy: session.id,
      })
      .returning();

    return NextResponse.json({ system: newSystem }, { status: 201 });
  } catch (error) {
    console.error("Create system error:", error);
    return NextResponse.json(
      { error: "Failed to create system" },
      { status: 500 }
    );
  }
}
