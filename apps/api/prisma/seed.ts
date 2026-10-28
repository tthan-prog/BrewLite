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
// PIN chung của các tài khoản thanh toán TEST (tiền giả, chỉ để demo).
const TEST_PIN = "123456";

async function main() {
  // Xóa theo thứ tự khóa ngoại (bảng con trước).
  await prisma.redemption.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.paymentIntent.deleteMany();
  await prisma.paymentAccount.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.orderIngredientUse.deleteMany();
  await prisma.toppingRecipeItem.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.ingredient.deleteMany();
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
    data: { email: "customer@brewlite.com", password, role: Role.CUSTOMER, points: 40 },
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

  // ---- Nguyên liệu + công thức (lượng cho 1 ly) ----
  const ING: Record<string, [string, number]> = {
    "Cà phê hạt": ["g", 5000],
    "Sữa đặc": ["ml", 3000],
    "Sữa tươi": ["ml", 6000],
    "Trà đen": ["g", 1500],
    "Đường": ["g", 4000],
    "Đào ngâm": ["g", 2000],
    "Vải ngâm": ["g", 2000],
    "Chanh tươi": ["quả", 100],
    "Mật ong": ["ml", 1500],
    "Trân châu": ["g", 3000],
    "Bột matcha": ["g", 120],
    "Bột khoai môn": ["g", 1500],
    "Bột cacao": ["g", 1500],
    "Kem tươi": ["ml", 2000],
    "Caramel": ["ml", 1000],
    "Bột thạch": ["g", 1200],
    "Bột pudding": ["g", 1500],
    "Phô mai kem": ["g", 1000],
  };
  const ingId: Record<string, number> = {};
  for (const [name, [unit, stock]] of Object.entries(ING)) {
    ingId[name] = (await prisma.ingredient.create({ data: { name, unit, stock } })).id;
  }
  const RECIPES: Record<number, Record<string, number>> = {
    1: { "Cà phê hạt": 20, "Sữa đặc": 30 },
    2: { "Cà phê hạt": 10, "Sữa đặc": 25, "Sữa tươi": 100 },
    3: { "Cà phê hạt": 18 },
    4: { "Cà phê hạt": 18, "Sữa tươi": 150, "Caramel": 20 },
    5: { "Trà đen": 5, "Đào ngâm": 60, "Đường": 15 },
    6: { "Trà đen": 5, "Vải ngâm": 60, "Đường": 15 },
    7: { "Trà đen": 5, "Chanh tươi": 1, "Mật ong": 20 },
    8: { "Trà đen": 6, "Sữa tươi": 120, "Trân châu": 40, "Đường": 15 },
    9: { "Bột matcha": 8, "Sữa tươi": 150, "Đường": 15 },
    10: { "Trà đen": 5, "Bột khoai môn": 30, "Sữa tươi": 120 },
    11: { "Bột matcha": 10, "Sữa tươi": 100, "Kem tươi": 30, "Đường": 15 },
    12: { "Bột cacao": 20, "Sữa tươi": 100, "Kem tươi": 30, "Đường": 15 },
  };
  await prisma.recipeItem.createMany({
    data: Object.entries(RECIPES).flatMap(([productId, items]) =>
      Object.entries(items).map(([name, quantity]) => ({
        productId: Number(productId),
        ingredientId: ingId[name],
        quantity,
      })),
    ),
  });

  // Topping: lượng cho MỘT phần (không đổi theo size ly).
  const toppings = await prisma.topping.findMany();
  const TOPPING_RECIPES: Record<string, Record<string, number>> = {
    "Trân châu đen": { "Trân châu": 30 },
    "Thạch cà phê": { "Bột thạch": 20 },
    "Pudding trứng": { "Bột pudding": 25, "Sữa tươi": 30 },
    "Kem cheese": { "Kem tươi": 40, "Phô mai kem": 15 },
  };
  await prisma.toppingRecipeItem.createMany({
    data: toppings.flatMap((t) =>
      Object.entries(TOPPING_RECIPES[t.name] ?? {}).map(([name, quantity]) => ({
        toppingId: t.id,
        ingredientId: ingId[name],
        quantity,
      })),
    ),
  });

  // ---- Tài khoản TEST (tiền giả; PIN chung 123456) ----
  const pinHash = await bcrypt.hash(TEST_PIN, 10);
  await prisma.paymentAccount.createMany({
    data: [
      { provider: "BANK", identifier: "0123456789", holderName: "NGUYEN VAN A (TEST)", pinHash, balance: 5_000_000 },
      { provider: "BANK", identifier: "0987654321", holderName: "TRAN THI B (TEST - SO DU THAP)", pinHash, balance: 10_000 },
      { provider: "MOMO", identifier: "0900000001", holderName: "VI MOMO TEST 1", pinHash, balance: 2_000_000 },
      { provider: "MOMO", identifier: "0900000002", holderName: "VI MOMO TEST 2 (SO DU THAP)", pinHash, balance: 5_000 },
      { provider: "VNPAY", identifier: "0911000001", holderName: "VNPAY TEST 1", pinHash, balance: 3_000_000 },
      { provider: "VNPAY", identifier: "0911000002", holderName: "VNPAY TEST 2 (SO DU THAP)", pinHash, balance: 8_000 },
    ],
  });

  // ---- Quà đổi điểm (1 điểm = mỗi 10.000 ₫ thanh toán) ----
  await prisma.reward.createMany({
    data: [
      { name: "Topping miễn phí", description: "Tặng 1 topping bất kỳ cho ly kế tiếp.", pointsCost: 10 },
      { name: "Voucher 20.000 ₫", description: "Giảm 20.000 ₫ cho đơn từ 60.000 ₫.", pointsCost: 20 },
      { name: "Ly Cà phê sữa đá miễn phí", description: "Một ly Cà phê sữa đá size S.", pointsCost: 30 },
      { name: "Ly size L bất kỳ", description: "Một ly bất kỳ trong menu, size L.", pointsCost: 50 },
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
