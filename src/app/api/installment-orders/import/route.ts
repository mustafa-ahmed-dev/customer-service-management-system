import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { installmentOrders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import ExcelJS from "exceljs";

// POST - Import cardholder data from Excel/CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Get first worksheet
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return NextResponse.json(
        { error: "No worksheet found in file" },
        { status: 400 }
      );
    }

    // Get headers from first row
    const headers: string[] = [];
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell) => {
      headers.push(cell.value?.toString() || "");
    });

    // Find column indices for Arabic headers
    const installmentIdCol = headers.findIndex((h) =>
      h.includes("رقم الفاتورة")
    );
    const cardholderNameCol = headers.findIndex((h) =>
      h.includes("اسم الزبون")
    );
    const motherNameCol = headers.findIndex((h) => h.includes("اسم ام الزبون"));
    const phoneCol = headers.findIndex((h) => h.includes("رقم هاتف الزبون"));

    if (installmentIdCol === -1) {
      return NextResponse.json(
        {
          error: "Required column 'رقم الفاتورة' not found in Excel file",
        },
        { status: 400 }
      );
    }

    let updated = 0;
    let notFound = 0;
    const errors: string[] = [];

    // Process rows (skip header row)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Skip empty rows
      if (row.hasValues) {
        try {
          // Extract data from columns (add 1 because findIndex is 0-based, Excel columns are 1-based)
          const installmentId = row
            .getCell(installmentIdCol + 1)
            .value?.toString()
            .trim();
          const cardholderName =
            cardholderNameCol !== -1
              ? row
                  .getCell(cardholderNameCol + 1)
                  .value?.toString()
                  .trim()
              : undefined;
          const cardholderMotherName =
            motherNameCol !== -1
              ? row
                  .getCell(motherNameCol + 1)
                  .value?.toString()
                  .trim()
              : undefined;
          const cardholderPhoneNumber =
            phoneCol !== -1
              ? row
                  .getCell(phoneCol + 1)
                  .value?.toString()
                  .trim()
              : undefined;

          if (!installmentId) {
            errors.push(`Row ${rowNumber}: Missing installment ID`);
            continue;
          }

          // Find order by installment ID
          const [existingOrder] = await db
            .select()
            .from(installmentOrders)
            .where(eq(installmentOrders.installmentId, installmentId))
            .limit(1);

          if (!existingOrder) {
            notFound++;
            errors.push(
              `Row ${rowNumber}: Installment ID ${installmentId} not found`
            );
            continue;
          }

          // Update cardholder information
          await db
            .update(installmentOrders)
            .set({
              cardholderName: cardholderName || existingOrder.cardholderName,
              cardholderMotherName:
                cardholderMotherName || existingOrder.cardholderMotherName,
              cardholderPhoneNumber:
                cardholderPhoneNumber || existingOrder.cardholderPhoneNumber,
              updatedBy: session.id,
              updatedAt: new Date(),
            })
            .where(eq(installmentOrders.id, existingOrder.id));

          updated++;
        } catch (error) {
          console.error(`Row ${rowNumber} processing error:`, error);
          errors.push(
            `Row ${rowNumber}: Error processing - ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      notFound,
      total: worksheet.rowCount - 1, // Exclude header row
      errors: errors.length > 0 ? errors.slice(0, 10) : [], // Return first 10 errors
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error: `Failed to import data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
