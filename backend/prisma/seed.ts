import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Role,
  PromotionType,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.orderItemTopping.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: "customer@brewlite.com",
      password: "password123",
      role: Role.CUSTOMER,
    },
  });

  await prisma.user.create({
    data: {
      email: "staff@brewlite.com",
      password: "password123",
      role: Role.STAFF,
    },
  });

  await prisma.product.createMany({
    data: [
      {
        name: "Cà phê sữa",
        description: "Cà phê sữa truyền thống",
        price: 30000,
        stock: 50,
      },
      {
        name: "Cappuccino",
        description: "Cà phê Cappuccino",
        price: 45000,
        stock: 30,
      },
      {
        name: "Trà đào",
        description: "Trà đào thanh mát",
        price: 35000,
        stock: 40,
      },
    ],
  });

  await prisma.topping.createMany({
    data: [
      {
        name: "Trân châu",
        price: 5000,
      },
      {
        name: "Kem cheese",
        price: 10000,
      },
      {
        name: "Shot espresso",
        price: 10000,
      },
    ],
  });

  await prisma.promotion.createMany({
    data: [
      {
        code: "WELCOME10",
        type: PromotionType.PERCENT,
        value: 10,
        minOrder: 50000,
        usageCount: 0,
      },
      {
        code: "SAVE20K",
        type: PromotionType.FIXED,
        value: 20000,
        minOrder: 100000,
        usageCount: 0,
      },
    ],
  });

  console.log("Seed dữ liệu BrewLite thành công!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });