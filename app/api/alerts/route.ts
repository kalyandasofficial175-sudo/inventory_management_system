import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: Record<string, unknown> = {};
  if (session.user.role === "STAFF") {
    where.userId = session.user.id;
  }

  const products = await prisma.product.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const alerts = products
    .filter((p) => p.quantity <= p.minThreshold)
    .map((p) => ({
      ...p,
      severity: p.quantity === 0 ? "critical" : p.quantity <= p.minThreshold / 2 ? "high" : "medium",
    }))
    .sort((a, b) => a.quantity - b.quantity);

  return NextResponse.json({ alerts, count: alerts.length });
}
