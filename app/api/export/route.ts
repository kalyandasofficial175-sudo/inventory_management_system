import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const reportType = searchParams.get("type") ?? "stock";
  const userId = searchParams.get("userId");
  const category = searchParams.get("category");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Inventory Management System";
  workbook.created = new Date();

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } },
    alignment: { horizontal: "center" },
  };

  if (reportType === "stock") {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (category) where.category = category;

    const products = await prisma.product.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { category: "asc" },
    });

    const sheet = workbook.addWorksheet("Stock Levels");
    sheet.columns = [
      { header: "SKU", key: "sku", width: 20 },
      { header: "Product Name", key: "name", width: 30 },
      { header: "Category", key: "category", width: 20 },
      { header: "Current Qty", key: "quantity", width: 15 },
      { header: "Min Threshold", key: "minThreshold", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Assigned To", key: "user", width: 25 },
    ];

    sheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

    products.forEach((p) => {
      const row = sheet.addRow({
        sku: p.sku,
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        minThreshold: p.minThreshold,
        status: p.quantity <= p.minThreshold ? "LOW STOCK" : "OK",
        user: p.user.name,
      });
      if (p.quantity <= p.minThreshold) {
        row.getCell("status").font = { color: { argb: "FFDC2626" }, bold: true };
      }
    });
  }

  if (reportType === "movement") {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate + "T23:59:59.999Z") }),
      };
    }

    const transactions = await prisma.stockTransaction.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true, category: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const sheet = workbook.addWorksheet("Movement Log");
    sheet.columns = [
      { header: "Date", key: "date", width: 22 },
      { header: "Type", key: "type", width: 12 },
      { header: "SKU", key: "sku", width: 20 },
      { header: "Product", key: "product", width: 30 },
      { header: "Category", key: "category", width: 20 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Note", key: "note", width: 30 },
      { header: "Updated By", key: "user", width: 25 },
    ];

    sheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

    transactions.forEach((t) => {
      sheet.addRow({
        date: t.createdAt.toLocaleString(),
        type: t.type,
        sku: t.product.sku,
        product: t.product.name,
        category: t.product.category,
        quantity: t.type === "OUT" || t.type === "DAMAGED" ? -t.quantity : t.quantity,
        note: t.note ?? "",
        user: t.user.name,
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `${reportType}-report-${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
