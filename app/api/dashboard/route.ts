import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalProducts,
    totalUsers,
    products,
    recentTransactions,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.product.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.stockTransaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, sku: true, category: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockCount = products.filter((p) => p.quantity <= p.minThreshold).length;

  const stockByCategory = Object.entries(
    products.reduce(
      (acc, p) => {
        acc[p.category] = (acc[p.category] ?? 0) + p.quantity;
        return acc;
      },
      {} as Record<string, number>
    )
  ).map(([category, total]) => ({ category, total }));

  const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));
  const recentTx = await prisma.stockTransaction.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: "asc" },
  });

  const txByDate: Record<string, { date: string; IN: number; OUT: number; DAMAGED: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "MMM d");
    txByDate[date] = { date, IN: 0, OUT: 0, DAMAGED: 0 };
  }

  recentTx.forEach((tx) => {
    const date = format(tx.createdAt, "MMM d");
    if (txByDate[date]) {
      if (tx.type === "IN") txByDate[date].IN += tx.quantity;
      else if (tx.type === "OUT") txByDate[date].OUT += tx.quantity;
      else if (tx.type === "DAMAGED") txByDate[date].DAMAGED += tx.quantity;
    }
  });

  return NextResponse.json({
    totalProducts,
    totalStock,
    lowStockCount,
    totalUsers,
    recentTransactions,
    stockByCategory,
    transactionsOverTime: Object.values(txByDate),
  });
}
