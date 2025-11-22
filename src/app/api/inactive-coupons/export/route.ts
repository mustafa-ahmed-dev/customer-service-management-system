import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inactiveCoupons, users } from "@/lib/db/schema";
import { eq, and, or, like, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "EXPORT_EXCEL")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const conditions = [eq(inactiveCoupons.isArchived, false)];

    if (search) {
      conditions.push(
        or(
          like(inactiveCoupons.salesOrder, `%${search}%`),
          like(inactiveCoupons.couponCode, `%${search}%`)
        )!
      );
    }

    const records = await db
      .select({
        id: inactiveCoupons.id,
        salesOrder: inactiveCoupons.salesOrder,
        couponCode: inactiveCoupons.couponCode,
        notes: inactiveCoupons.notes,
        createdAt: inactiveCoupons.createdAt,
        createdByName: users.fullName,
      })
      .from(inactiveCoupons)
      .leftJoin(users, eq(inactiveCoupons.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(inactiveCoupons.createdAt));

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Inactive Coupons");

    // Define columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Sales Order (SO)", key: "salesOrder", width: 25 },
      { header: "Coupon Code", key: "couponCode", width: 25 },
      { header: "Notes", key: "notes", width: 50 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Created By", key: "createdByName", width: 25 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1890FF" },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add data rows
    records.forEach((record) => {
      worksheet.addRow({
        id: record.id,
        salesOrder: record.salesOrder,
        couponCode: record.couponCode,
        notes: record.notes || "",
        createdAt: new Date(record.createdAt).toLocaleString(),
        createdByName: record.createdByName || "",
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=inactive-coupons-${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
      },
    });
  } catch (error) {
    console.error("Export inactive coupons error:", error);
    return NextResponse.json(
      { error: "Failed to export inactive coupons" },
      { status: 500 }
    );
  }
}
