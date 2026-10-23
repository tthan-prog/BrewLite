import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Role,
  PromotionType,
} from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// Mật khẩu mẫu chỉ dùng để phát triển; luôn lưu dạng băm bcrypt.
const DEV_PASSWORD = "password123";

async function main() {
  // Xóa theo thứ tự khóa ngoại (bảng con trước).
  await prisma.payment.deleteMany();
  await prisma.idempotencyRecord.deleteMany();
  await prisma.orderItemTopping.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash(DEV_PASSWORD, 10);

  await prisma.user.create({
    data: { email: "customer@brewlite.com", password, role: Role.CUSTOMER },
  });
  await prisma.user.create({
    data: { email: "staff@brewlite.com", password, role: Role.STAFF },
  });

  // Dữ liệu khớp với menu trên giao diện (apps/web/src/app/menu/page.tsx).
  await prisma.product.createMany({
    data: [
    { id: 1, name: "Cà phê sữa đá", description: "Cà phê Việt đậm đà hòa cùng sữa đặc béo ngọt.", price: 29000, category: "Cà phê", imageUrl: "☕", stock: 100 },
    { id: 2, name: "Bạc xỉu", description: "Vị sữa thơm béo cùng chút cà phê dịu nhẹ.", price: 32000, category: "Cà phê", imageUrl: "🥛", stock: 100 },
    { id: 3, name: "Americano", description: "Espresso pha cùng nước, thanh nhẹ và tỉnh táo.", price: 35000, category: "Cà phê", imageUrl: "☕", stock: 100 },
    { id: 4, name: "Caramel Latte", description: "Espresso, sữa tươi và caramel ngọt thơm.", price: 45000, category: "Cà phê", imageUrl: "🍮", stock: 100 },
    { id: 5, name: "Trà đào cam sả", description: "Trà đào thanh mát kết hợp cam và hương sả.", price: 39000, category: "Trà", imageUrl: "🍑", stock: 100 },
    { id: 6, name: "Trà vải", description: "Hương trà nhẹ nhàng cùng vải ngọt thanh.", price: 39000, category: "Trà", imageUrl: "🍹", stock: 100 },
    { id: 7, name: "Trà chanh mật ong", description: "Trà chanh tươi mát, hòa quyện mật ong.", price: 35000, category: "Trà", imageUrl: "🍋", stock: 100 },
    { id: 8, name: "Trà sữa trân châu", description: "Trà sữa thơm béo cùng trân châu dai mềm.", price: 39000, category: "Trà sữa", imageUrl: "🧋", stock: 100 },
    { id: 9, name: "Trà sữa matcha", description: "Matcha thơm dịu kết hợp sữa tươi.", price: 45000, category: "Trà sữa", imageUrl: "🍵", stock: 100 },
    { id: 10, name: "Trà sữa khoai môn", description: "Hương khoai môn ngọt nhẹ và sữa béo.", price: 42000, category: "Trà sữa", imageUrl: "🥤", stock: 100 },
    { id: 11, name: "Matcha đá xay", description: "Matcha xay cùng đá và lớp kem mềm mịn.", price: 49000, category: "Đá xay", imageUrl: "🍵", stock: 100 },
    { id: 12, name: "Chocolate đá xay", description: "Chocolate đậm vị, mát lạnh và thơm béo.", price: 49000, category: "Đá xay", imageUrl: "🍫", stock: 100 }
    ],
  });
  // createMany với id tường minh: đưa sequence về sau id lớn nhất.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Product"', 'id'), (SELECT MAX(id) FROM "Product"))`,
  );

  await prisma.topping.createMany({
    data: [
    { name: "Trân châu đen", price: 7000 },
    { name: "Thạch cà phê", price: 6000 },
    { name: "Pudding trứng", price: 8000 },
    { name: "Kem cheese", price: 10000 }
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
