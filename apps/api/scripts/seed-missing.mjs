// Bổ sung dữ liệu cho nguyên liệu, tài khoản thanh toán TEST và quà đổi điểm vào CSDL ĐÃ CÓ DỮ LIỆU.
// Chỉ THÊM phần còn thiếu; không xóa và không ghi đè dữ liệu đang có (khác `prisma db seed`, vốn xóa sạch).
// Chạy lại nhiều lần vẫn an toàn. Bật bằng SEED_MISSING=true (xem apps/api/Dockerfile).
// Dữ liệu phải khớp apps/api/prisma/seed.ts; món/topping được nối theo TÊN, không khớp thì bỏ qua và ghi log.
// Lưu ý: migration 20261029010000 đã tự thêm công thức "Đá viên" cho món 1-12 trên CSDL cũ, nên công thức được
// bổ sung THEO TỪNG CẶP (món, nguyên liệu): cặp đã có giữ nguyên lượng, cặp còn thiếu được thêm.
import pg from 'pg';
import bcrypt from 'bcryptjs';

const TEST_PIN = '123456';

const ING = {
  'Cà phê hạt': ['g', 5000],
  'Sữa đặc': ['ml', 3000],
  'Sữa tươi': ['ml', 6000],
  'Trà đen': ['g', 1500],
  'Đường': ['g', 4000],
  'Đào ngâm': ['g', 2000],
  'Vải ngâm': ['g', 2000],
  'Chanh tươi': ['quả', 100],
  'Mật ong': ['ml', 1500],
  'Trân châu': ['g', 3000],
  'Bột matcha': ['g', 120],
  'Bột khoai môn': ['g', 1500],
  'Bột cacao': ['g', 1500],
  'Kem tươi': ['ml', 2000],
  'Caramel': ['ml', 1000],
  'Bột thạch': ['g', 1200],
  'Bột pudding': ['g', 1500],
  'Phô mai kem': ['g', 1000],
  'Đá viên': ['g', 60000],
};

// Công thức cho 1 ly size S, theo tên món.
const RECIPES = {
  'Cà phê sữa đá': { 'Cà phê hạt': 20, 'Sữa đặc': 30, 'Đường': 10 },
  'Bạc xỉu': { 'Cà phê hạt': 10, 'Sữa đặc': 25, 'Sữa tươi': 100, 'Đường': 8 },
  'Americano': { 'Cà phê hạt': 18 },
  'Caramel Latte': { 'Cà phê hạt': 18, 'Sữa tươi': 150, 'Caramel': 20, 'Đường': 8 },
  'Trà đào cam sả': { 'Trà đen': 5, 'Đào ngâm': 60, 'Đường': 15 },
  'Trà vải': { 'Trà đen': 5, 'Vải ngâm': 60, 'Đường': 15 },
  'Trà chanh mật ong': { 'Trà đen': 5, 'Chanh tươi': 1, 'Mật ong': 20, 'Đường': 10 },
  'Trà sữa trân châu': { 'Trà đen': 6, 'Sữa tươi': 120, 'Trân châu': 40, 'Đường': 15 },
  'Trà sữa matcha': { 'Bột matcha': 8, 'Sữa tươi': 150, 'Đường': 15 },
  'Trà sữa khoai môn': { 'Trà đen': 5, 'Bột khoai môn': 30, 'Sữa tươi': 120, 'Đường': 15 },
  'Matcha đá xay': { 'Bột matcha': 10, 'Sữa tươi': 100, 'Kem tươi': 30, 'Đường': 15 },
  'Chocolate đá xay': { 'Bột cacao': 20, 'Sữa tươi': 100, 'Kem tươi': 30, 'Đường': 15 },
};
// Mọi món đều có đá (ly size S, nhân theo mức đá khách chọn).
for (const [name, items] of Object.entries(RECIPES)) {
  items['Đá viên'] = name === 'Matcha đá xay' || name === 'Chocolate đá xay' ? 200 : 150;
}

// Lượng nguyên liệu cho MỘT phần topping.
const TOPPING_RECIPES = {
  'Trân châu đen': { 'Trân châu': 30 },
  'Thạch cà phê': { 'Bột thạch': 20 },
  'Pudding trứng': { 'Bột pudding': 25, 'Sữa tươi': 30 },
  'Kem cheese': { 'Kem tươi': 40, 'Phô mai kem': 15 },
};

const ACCOUNTS = [
  ['BANK', '0123456789', 'NGUYEN VAN A (TEST)', 5_000_000],
  ['BANK', '0987654321', 'TRAN THI B (TEST - SO DU THAP)', 10_000],
  ['MOMO', '0900000001', 'VI MOMO TEST 1', 2_000_000],
  ['MOMO', '0900000002', 'VI MOMO TEST 2 (SO DU THAP)', 5_000],
  ['VNPAY', '0911000001', 'VNPAY TEST 1', 3_000_000],
  ['VNPAY', '0911000002', 'VNPAY TEST 2 (SO DU THAP)', 8_000],
];

const REWARDS = [
  ['Topping miễn phí', 'Tặng 1 topping bất kỳ cho ly kế tiếp.', 10],
  ['Voucher 20.000 ₫', 'Giảm 20.000 ₫ cho đơn từ 60.000 ₫.', 20],
  ['Ly Cà phê sữa đá miễn phí', 'Một ly Cà phê sữa đá size S.', 30],
  ['Ly size L bất kỳ', 'Một ly bất kỳ trong menu, size L.', 50],
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const log = [];
try {
  await client.query('BEGIN');

  // 1. Nguyên liệu: thêm tên chưa có; không đụng tồn kho của nguyên liệu đã có.
  let added = 0;
  for (const [name, [unit, stock]] of Object.entries(ING)) {
    const r = await client.query(
      `INSERT INTO "Ingredient" (name, unit, stock, "sugarScaled", "iceScaled")
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING`,
      [name, unit, stock, name === 'Đường', name === 'Đá viên'],
    );
    added += r.rowCount;
  }
  log.push(`nguyên liệu thêm mới: ${added}`);

  const ingId = new Map(
    (await client.query('SELECT id, name FROM "Ingredient"')).rows.map((r) => [r.name, r.id]),
  );

  // 2. Công thức món: thêm các cặp (món, nguyên liệu) còn thiếu; cặp đã có giữ nguyên lượng.
  let recipeAdded = 0;
  const recipeSkipped = [];
  for (const [product, items] of Object.entries(RECIPES)) {
    const p = await client.query('SELECT id FROM "Product" WHERE name = $1 ORDER BY id LIMIT 1', [product]);
    if (p.rowCount === 0) { recipeSkipped.push(product); continue; }
    for (const [ing, quantity] of Object.entries(items)) {
      const r = await client.query(
        `INSERT INTO "RecipeItem" ("productId", "ingredientId", quantity) VALUES ($1, $2, $3)
         ON CONFLICT ("productId", "ingredientId") DO NOTHING`,
        [p.rows[0].id, ingId.get(ing), quantity],
      );
      recipeAdded += r.rowCount;
    }
  }
  log.push(`dòng công thức món thêm mới: ${recipeAdded}`);
  if (recipeSkipped.length) log.push(`món không có trong CSDL, bỏ qua: ${recipeSkipped.join('; ')}`);

  // 3. Công thức topping: tương tự.
  let toppingAdded = 0;
  const toppingSkipped = [];
  for (const [topping, items] of Object.entries(TOPPING_RECIPES)) {
    const t = await client.query('SELECT id FROM "Topping" WHERE name = $1 ORDER BY id LIMIT 1', [topping]);
    if (t.rowCount === 0) { toppingSkipped.push(topping); continue; }
    for (const [ing, quantity] of Object.entries(items)) {
      const r = await client.query(
        `INSERT INTO "ToppingRecipeItem" ("toppingId", "ingredientId", quantity) VALUES ($1, $2, $3)
         ON CONFLICT ("toppingId", "ingredientId") DO NOTHING`,
        [t.rows[0].id, ingId.get(ing), quantity],
      );
      toppingAdded += r.rowCount;
    }
  }
  log.push(`dòng công thức topping thêm mới: ${toppingAdded}`);
  if (toppingSkipped.length) log.push(`topping không có trong CSDL, bỏ qua: ${toppingSkipped.join('; ')}`);

  // 4. Tài khoản thanh toán TEST (tiền giả): thêm tài khoản chưa có; không đổi số dư tài khoản đã có.
  const pinHash = await bcrypt.hash(TEST_PIN, 10);
  let accAdded = 0;
  for (const [provider, identifier, holderName, balance] of ACCOUNTS) {
    const r = await client.query(
      `INSERT INTO "PaymentAccount" (provider, identifier, "holderName", "pinHash", balance)
       VALUES ($1::"PaymentProvider", $2, $3, $4, $5)
       ON CONFLICT (provider, identifier) DO NOTHING`,
      [provider, identifier, holderName, pinHash, balance],
    );
    accAdded += r.rowCount;
  }
  log.push(`tài khoản test thêm mới: ${accAdded}`);

  // 5. Quà đổi điểm: thêm quà chưa có (theo tên).
  let rewardAdded = 0;
  for (const [name, description, pointsCost] of REWARDS) {
    const r = await client.query(
      `INSERT INTO "Reward" (name, description, "pointsCost")
       SELECT $1::text, $2::text, $3::int
       WHERE NOT EXISTS (SELECT 1 FROM "Reward" WHERE name = $1::text)`,
      [name, description, pointsCost],
    );
    rewardAdded += r.rowCount;
  }
  log.push(`quà đổi điểm thêm mới: ${rewardAdded}`);

  await client.query('COMMIT');
  console.log(`[seed-missing] Hoàn tất. ${log.join(' | ')}`);
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('[seed-missing] Lỗi, đã hoàn tác:', error);
  process.exitCode = 1;
} finally {
  await client.end();
}
