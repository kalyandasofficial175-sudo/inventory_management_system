import { PrismaClient, Role, TxType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@inventory.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@inventory.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const managerPassword = await bcrypt.hash("manager123", 12);
  const manager = await prisma.user.upsert({
    where: { email: "manager@inventory.com" },
    update: {},
    create: {
      name: "Warehouse Manager",
      email: "manager@inventory.com",
      password: managerPassword,
      role: Role.MANAGER,
    },
  });

  const staffPassword = await bcrypt.hash("staff123", 12);
  const staff1 = await prisma.user.upsert({
    where: { email: "staff1@inventory.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "staff1@inventory.com",
      password: staffPassword,
      role: Role.STAFF,
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: "staff2@inventory.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "staff2@inventory.com",
      password: staffPassword,
      role: Role.STAFF,
    },
  });

  const products = [
    {
      name: "Laptop Dell XPS 15",
      sku: "DELL-XPS-001",
      category: "Electronics",
      quantity: 45,
      minThreshold: 10,
      userId: staff1.id,
    },
    {
      name: "Wireless Mouse",
      sku: "MOUSE-WRL-002",
      category: "Accessories",
      quantity: 8,
      minThreshold: 15,
      userId: staff1.id,
    },
    {
      name: "USB-C Hub",
      sku: "USBC-HUB-003",
      category: "Accessories",
      quantity: 30,
      minThreshold: 10,
      userId: staff1.id,
    },
    {
      name: "Monitor 27 inch",
      sku: "MON-27-004",
      category: "Electronics",
      quantity: 12,
      minThreshold: 5,
      userId: staff2.id,
    },
    {
      name: "Office Chair Ergonomic",
      sku: "CHAIR-ERG-005",
      category: "Furniture",
      quantity: 5,
      minThreshold: 8,
      userId: staff2.id,
    },
    {
      name: "Standing Desk",
      sku: "DESK-STD-006",
      category: "Furniture",
      quantity: 3,
      minThreshold: 5,
      userId: manager.id,
    },
    {
      name: "Mechanical Keyboard",
      sku: "KEY-MECH-007",
      category: "Accessories",
      quantity: 20,
      minThreshold: 10,
      userId: manager.id,
    },
    {
      name: "Webcam HD 1080p",
      sku: "CAM-HD-008",
      category: "Electronics",
      quantity: 7,
      minThreshold: 10,
      userId: staff1.id,
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { sku: product.sku },
    });
    if (!existing) {
      const created = await prisma.product.create({ data: product });
      await prisma.stockTransaction.create({
        data: {
          type: TxType.IN,
          quantity: product.quantity,
          note: "Initial stock",
          productId: created.id,
          userId: admin.id,
        },
      });
    }
  }

  console.log("Seeding complete!");
  console.log("Admin: admin@inventory.com / admin123");
  console.log("Manager: manager@inventory.com / manager123");
  console.log("Staff 1: staff1@inventory.com / staff123");
  console.log("Staff 2: staff2@inventory.com / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
