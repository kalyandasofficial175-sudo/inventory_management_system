import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TxType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const userId = searchParams.get("userId");
  const type = searchParams.get("type") as TxType | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = {};

  if (session.user.role === "STAFF") {
    where.userId = session.user.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (productId) where.productId = productId;
  if (type) where.type = type;
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
    take: limit,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { productId, type, quantity, note } = body;

  if (!productId || !type || !quantity) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  if (session.user.role === "STAFF" && product.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let quantityDelta = 0;
  switch (type as TxType) {
    case "IN":
      quantityDelta = Math.abs(quantity);
      break;
    case "OUT":
    case "DAMAGED":
      quantityDelta = -Math.abs(quantity);
      break;
    case "ADJUST":
      quantityDelta = quantity;
      break;
  }

  const newQuantity = product.quantity + quantityDelta;
  if (newQuantity < 0) {
    return NextResponse.json(
      { error: "Insufficient stock. Current quantity: " + product.quantity },
      { status: 400 }
    );
  }

  const [transaction] = await prisma.$transaction([
    prisma.stockTransaction.create({
      data: {
        type: type as TxType,
        quantity: Math.abs(quantity),
        note: note ?? null,
        productId,
        userId: session.user.id,
      },
      include: {
        product: { select: { id: true, name: true, sku: true, category: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    }),
  ]);

  return NextResponse.json(transaction, { status: 201 });
}
