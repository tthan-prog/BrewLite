// Test tích hợp: các quy tắc "thực tế" — mức đường, kiểm tra giỏ, đơn bỏ dở, hoàn tiền, báo giá.
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp, loginStaff, registerUser } from './helpers.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { OrdersService } from '../src/orders/orders.service.js';

describe('Quy tắc thực tế (e2e, PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let user: { token: string; id: number };
  let staffToken: string;
  const run = Date.now();
  let seq = 0;
  const key = () => `rk-${run}-${++seq}`;
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  /** Món dùng 20 đơn vị đường (sugarScaled) + 10 đơn vị nguyên liệu thường cho 1 ly size S. */
  async function sweetDrink(sugarStock = 1000, otherStock = 1000) {
    const sugar = await prisma.ingredient.create({
      data: { name: `Duong ${run}-${++seq}`, unit: 'g', stock: sugarStock, sugarScaled: true },
    });
    const other = await prisma.ingredient.create({
      data: { name: `Tra ${run}-${++seq}`, unit: 'g', stock: otherStock },
    });
    const product = await prisma.product.create({
      data: { name: `Sweet ${run}-${++seq}`, price: 40000, stock: 0 },
    });
    await prisma.recipeItem.createMany({
      data: [
        { productId: product.id, ingredientId: sugar.id, quantity: 20 },
        { productId: product.id, ingredientId: other.id, quantity: 10 },
      ],
    });
    return { sugar, other, product };
  }
  const stock = async (id: number) =>
    (await prisma.ingredient.findUniqueOrThrow({ where: { id } })).stock;

  const order = (items: unknown[], promoCode?: string, token = user.token) =>
    request(http)
      .post('/orders')
      .set(auth(token))
      .set('Idempotency-Key', key())
      .send({ items, promoCode });

  /** Tạo đơn rồi thanh toán ví: nguyên liệu chỉ bị trừ ở bước thanh toán thành công. */
  const buy = async (items: unknown[]) => {
    const o = (await order(items).expect(201)).body;
    await request(http)
      .post('/payments')
      .set(auth(user.token))
      .set('Idempotency-Key', key())
      .send({ orderId: o.id, method: 'WALLET' })
      .expect(200);
    return o as { id: number };
  };

  beforeAll(async () => {
    ({ app, prisma } = await createApp());
    http = app.getHttpServer();
    const a = await registerUser(app, `rl-${run}@test.dev`);
    user = { token: a.accessToken, id: a.user.id };
    staffToken = (await loginStaff(app)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Mức đá', () => {
    it('đá viên nhân theo mức đá chọn; đường không bị ảnh hưởng bởi mức đá', async () => {
      const ice = await prisma.ingredient.create({
        data: { name: `Da ${run}-${++seq}`, unit: 'g', stock: 1000, iceScaled: true },
      });
      const { sugar, product } = await sweetDrink();
      await prisma.recipeItem.create({ data: { productId: product.id, ingredientId: ice.id, quantity: 100 } });
      await buy([{ productId: product.id, quantity: 1, size: 'S', ice: 100 }]);
      expect(await stock(ice.id)).toBe(1000 - 100);
      await buy([{ productId: product.id, quantity: 2, size: 'S', ice: 30, sugar: 100 }]);
      expect(await stock(ice.id)).toBe(1000 - 100 - 60);
      expect(await stock(sugar.id)).toBe(1000 - 20 - 40);
      await buy([{ productId: product.id, quantity: 1, size: 'S', ice: 0 }]);
      expect(await stock(ice.id)).toBe(1000 - 100 - 60);
    });
  });

  describe('Mức đường', () => {
    it('đường nhân theo mức đường chọn (100% = công thức, 50% = một nửa, 0% = không dùng); nguyên liệu khác không đổi', async () => {
      const { sugar, other, product } = await sweetDrink();
      await buy([{ productId: product.id, quantity: 1, size: 'S' }]); // mặc định 100%
      expect(await stock(sugar.id)).toBe(1000 - 20);
      await buy([{ productId: product.id, quantity: 1, size: 'S', sugar: 50 }]);
      expect(await stock(sugar.id)).toBe(1000 - 20 - 10);
      await buy([{ productId: product.id, quantity: 2, size: 'S', sugar: 0 }]);
      expect(await stock(sugar.id)).toBe(1000 - 20 - 10); // 0% không trừ đường
      expect(await stock(other.id)).toBe(1000 - 10 - 10 - 20); // 4 ly × 10
    });

    it('size L và đường 50%: 20 → 30 (size) → 15 (đường)', async () => {
      const { sugar, product } = await sweetDrink();
      await buy([{ productId: product.id, quantity: 1, size: 'L', sugar: 50 }]);
      expect(await stock(sugar.id)).toBe(1000 - 15);
    });

    it('lưu mức đường và đá của khách vào dòng đơn; đơn không gửi thì là null', async () => {
      const { product } = await sweetDrink();
      const withOpts = (
        await order([{ productId: product.id, quantity: 1, size: 'S', sugar: 30, ice: 70 }]).expect(201)
      ).body;
      expect(withOpts.items[0]).toMatchObject({ sugar: 30, ice: 70 });
      const without = (await order([{ productId: product.id, quantity: 1, size: 'S' }]).expect(201)).body;
      expect(without.items[0].sugar).toBeNull();
      await order([{ productId: product.id, quantity: 1, size: 'S', sugar: 150 }]).expect(400);
    });

    it('hủy đơn hoàn đúng lượng đường đã trừ theo mức đường', async () => {
      const { sugar, product } = await sweetDrink();
      const o = await buy([{ productId: product.id, quantity: 3, size: 'S', sugar: 30 }]);
      expect(await stock(sugar.id)).toBe(1000 - 3 * 6);
      await request(http)
        .patch(`/orders/${o.id}/status`)
        .set(auth(staffToken))
        .send({ status: 'CANCELLED' })
        .expect(200);
      expect(await stock(sugar.id)).toBe(1000);
    });

    it('availability trả nguyên liệu mỗi ly theo mức đường và số ly tối đa', async () => {
      const { product } = await sweetDrink(100, 1000); // đường 100: 100% → 5 ly, 50% → 10 ly
      const at = async (sugar: number) =>
        (
          await request(http)
            .post('/products/availability')
            .send({ candidate: { productId: product.id, size: 'S', sugar } })
            .expect(200)
        ).body;
      const full = await at(100);
      expect(full.maxAdditional).toBe(5);
      expect(full.perCup.map((l: { quantity: number }) => l.quantity).sort((a: number, b: number) => a - b)).toEqual([10, 20]);
      expect((await at(50)).maxAdditional).toBe(10);
      const none = await at(0);
      expect(none.perCup).toHaveLength(1); // 0% đường: chỉ còn nguyên liệu thường
    });
  });

  describe('Kiểm tra giỏ hàng', () => {
    const check = (cart: unknown[]) =>
      request(http).post('/products/cart-check').send({ cart }).expect(200);

    it('chặn theo nguyên liệu: kho đủ 3 ly thì 3 ly ok, 4 ly vượt; trả số ly tối đa cho từng dòng', async () => {
      const { product } = await sweetDrink(60, 1000); // đường 60 / 20 = 3 ly
      const ok = (await check([{ productId: product.id, size: 'S', quantity: 3 }])).body;
      expect(ok).toMatchObject({ ok: true, lines: [{ max: 3, ok: true }] });
      const bad = (await check([{ productId: product.id, size: 'S', quantity: 4 }])).body;
      expect(bad).toMatchObject({ ok: false, lines: [{ max: 3, ok: false }] });
    });

    it('hai dòng cùng món tranh nhau nguyên liệu', async () => {
      const { product } = await sweetDrink(60, 1000);
      const r = (
        await check([
          { productId: product.id, size: 'S', quantity: 2, sugar: 100 },
          { productId: product.id, size: 'S', quantity: 2, sugar: 100, toppings: [] },
        ])
      ).body;
      expect(r.ok).toBe(false);
      expect(r.lines.every((l: { max: number }) => l.max === 1)).toBe(true);
    });

    it('giới hạn 50 ly mỗi dòng dù nguyên liệu còn nhiều', async () => {
      const { product } = await sweetDrink(100_000, 100_000);
      const r = (await check([{ productId: product.id, size: 'S', quantity: 51 }])).body;
      expect(r).toMatchObject({ ok: false, lines: [{ max: 50, ok: false }] });
      expect((await check([{ productId: product.id, size: 'S', quantity: 50 }])).body.ok).toBe(true);
    });

    it('giỏ rỗng hoặc sản phẩm không tồn tại bị từ chối', async () => {
      await request(http).post('/products/cart-check').send({ cart: [] }).expect(400);
      await request(http)
        .post('/products/cart-check')
        .send({ cart: [{ productId: 999999999, size: 'S', quantity: 1 }] })
        .expect(404);
    });
  });

  describe('Báo giá và khuyến mãi', () => {
    it('quote: tạm tính theo size + topping, giảm theo mã; thông báo tiếng Việt khi mã sai/chưa đủ tối thiểu', async () => {
      const { product } = await sweetDrink();
      const topping = await prisma.topping.create({ data: { name: `Top ${run}-${++seq}`, price: 7000 } });
      const code = `Q${run}`;
      await prisma.promotion.create({ data: { code, type: 'PERCENT', value: 10, minOrder: 50000 } });
      const quote = async (items: unknown[], promoCode?: string) =>
        (await request(http).post('/products/quote').send({ items, promoCode }).expect(200)).body;

      // (40.000 + 5.000 size M + 7.000 topping) × 2 = 104.000
      const items = [{ productId: product.id, size: 'M', quantity: 2, toppings: [{ toppingId: topping.id, quantity: 1 }] }];
      expect(await quote(items)).toMatchObject({ subtotal: 104000, discount: 0, total: 104000, promoError: null });
      expect(await quote(items, code.toLowerCase())).toMatchObject({
        subtotal: 104000, discount: 10400, total: 93600, promoCode: code, promoError: null,
      });
      expect((await quote([{ productId: product.id, size: 'S', quantity: 1 }], code)).promoError).toMatch(/từ 50\.000/);
      expect((await quote(items, 'KHONGCO')).promoError).toBe('Mã khuyến mãi không hợp lệ.');

      // Báo giá khớp với đơn thật.
      const real = (await order(items, code).expect(201)).body;
      expect(real).toMatchObject({ subtotal: 104000, discount: 10400, total: 93600 });
    });

    it('hủy đơn trả lại lượt dùng mã khuyến mãi', async () => {
      const { product } = await sweetDrink();
      const code = `U${run}`;
      await prisma.promotion.create({ data: { code, type: 'FIXED', value: 5000, minOrder: 0 } });
      const o = (await order([{ productId: product.id, quantity: 1, size: 'S' }], code).expect(201)).body;
      expect((await prisma.promotion.findUniqueOrThrow({ where: { code } })).usageCount).toBe(1);
      await request(http)
        .patch(`/orders/${o.id}/status`)
        .set(auth(staffToken))
        .send({ status: 'CANCELLED' })
        .expect(200);
      expect((await prisma.promotion.findUniqueOrThrow({ where: { code } })).usageCount).toBe(0);
    });
  });

  describe('Đơn chưa thanh toán', () => {
    const backdate = (id: number, minutes: number) =>
      prisma.order.update({
        where: { id },
        data: { createdAt: new Date(Date.now() - minutes * 60_000) },
      });

    it('đơn bỏ dở quá hạn tự hủy (không hoàn dư nguyên liệu vì chưa từng trừ); đơn mới thì giữ nguyên', async () => {
      const { sugar, product } = await sweetDrink();
      const old = (await order([{ productId: product.id, quantity: 2, size: 'S' }]).expect(201)).body;
      const fresh = (await order([{ productId: product.id, quantity: 1, size: 'S' }]).expect(201)).body;
      expect(await stock(sugar.id)).toBe(1000); // đơn chưa thanh toán không giữ nguyên liệu
      await backdate(old.id, 60);

      await app.get(OrdersService).cancelStaleUnpaid();

      expect((await prisma.order.findUniqueOrThrow({ where: { id: old.id } })).status).toBe('CANCELLED');
      expect((await prisma.order.findUniqueOrThrow({ where: { id: fresh.id } })).status).toBe('PENDING');
      expect(await stock(sugar.id)).toBe(1000);
    });

    it('đơn đang có mã QR còn hạn thì không bị hủy; QR hết hạn thì hủy', async () => {
      const { product } = await sweetDrink();
      const o = (await order([{ productId: product.id, quantity: 1, size: 'S' }]).expect(201)).body;
      const intent = (
        await request(http).post('/payments/intents').set(auth(user.token)).send({ orderId: o.id, provider: 'MOMO' }).expect(201)
      ).body;
      await backdate(o.id, 60);
      await app.get(OrdersService).cancelStaleUnpaid();
      expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe('PENDING');

      await prisma.paymentIntent.update({ where: { token: intent.token }, data: { expiresAt: new Date(Date.now() - 1000) } });
      await app.get(OrdersService).cancelStaleUnpaid();
      expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe('CANCELLED');
    });

    it('đơn đã thanh toán không bị dọn dù cũ', async () => {
      const { product } = await sweetDrink();
      const o = (await order([{ productId: product.id, quantity: 1, size: 'S' }]).expect(201)).body;
      await request(http)
        .post('/payments')
        .set(auth(user.token))
        .set('Idempotency-Key', key())
        .send({ orderId: o.id, method: 'WALLET' })
        .expect(200);
      await backdate(o.id, 600);
      await app.get(OrdersService).cancelStaleUnpaid();
      expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe('PAID');
    });
  });

  describe('Hoàn tiền khi hủy đơn đã trả', () => {
    it('hủy đơn đã thanh toán bằng QR hoàn lại số dư tài khoản test, trả lại điểm và nguyên liệu', async () => {
      const { sugar, product } = await sweetDrink();
      const acc = await prisma.paymentAccount.create({
        data: {
          provider: 'BANK',
          identifier: `R${run}${++seq}`,
          holderName: 'TEST',
          pinHash: await bcrypt.hash('123456', 4),
          balance: 500_000,
        },
      });
      const o = (await order([{ productId: product.id, quantity: 1, size: 'S' }]).expect(201)).body; // 40.000
      const { token } = (
        await request(http).post('/payments/intents').set(auth(user.token)).send({ orderId: o.id, provider: 'BANK' }).expect(201)
      ).body;
      await request(http)
        .post(`/payments/intents/${token}/confirm`)
        .send({ accountNumber: acc.identifier, pin: '123456' })
        .expect(200);
      const balance = async () =>
        (await prisma.paymentAccount.findUniqueOrThrow({ where: { id: acc.id } })).balance;
      expect(await balance()).toBe(460_000);

      await request(http)
        .patch(`/orders/${o.id}/status`)
        .set(auth(staffToken))
        .send({ status: 'CANCELLED' })
        .expect(200);
      expect(await balance()).toBe(500_000);
      expect(await stock(sugar.id)).toBe(1000);

      // Không thể hủy lần hai để nhận tiền hai lần.
      await request(http)
        .patch(`/orders/${o.id}/status`)
        .set(auth(staffToken))
        .send({ status: 'CANCELLED' })
        .expect(400);
      expect(await balance()).toBe(500_000);
    });
  });
});
