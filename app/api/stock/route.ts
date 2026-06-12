import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const userId = searchParams.get("userId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  if (session.user.role === "STAFF") {
    where.userId = session.user.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, sku, category, quantity, minThreshold, unit, userId } = body;

    if (!name || !sku || !category || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        quantity: quantity ?? 0,
        minThreshold: minThreshold ?? 10,
        unit: unit ?? "pcs",
        userId,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (quantity > 0) {
      await prisma.stockTransaction.create({
        data: {
          type: "IN",
          quantity,
          note: "Initial stock",
          productId: product.id,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
