import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  if (reportType === "stock") {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (category) where.category = category;

    const products = await prisma.product.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { category: "asc" },
    });
    return NextResponse.json(products);
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
    if (category) {
      where.product = { category };
    }

    const transactions = await prisma.stockTransaction.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, category: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json(transactions);
  }

  if (reportType === "lowstock") {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (category) where.category = category;

    const products = await prisma.product.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const lowStock = products.filter((p) => p.quantity <= p.minThreshold);
    return NextResponse.json(lowStock);
  }

  if (reportType === "activity") {
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
        product: { select: { id: true, name: true, sku: true, category: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(transactions);
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
