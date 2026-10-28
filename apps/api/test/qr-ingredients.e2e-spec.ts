// Test tích hợp trên PostgreSQL thật: nguyên liệu/công thức, thanh toán QR, điểm thưởng, đổi quà.
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp, loginStaff, registerUser } from './helpers.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { vnpaySign } from '../src/payments/gateways/vnpay.js';

describe('Nguyên liệu, QR, điểm thưởng (e2e, PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let alice: { token: string; id: number };
  let bob: { token: string; id: number };
  let staffToken: string;
  const run = Date.now();
  let seq = 0;
  const key = () => `qk-${run}-${++seq}`;
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  /** Đồ uống có công thức: 30 đơn vị nguyên liệu mỗi ly, kho = ingredientStock. */
  async function drinkWithRecipe(ingredientStock: number, price = 30000) {
    const ingredient = await prisma.ingredient.create({
      data: { name: `NL ${run}-${++seq}`, unit: 'g', stock: ingredientStock },
    });
    const product = await prisma.product.create({
      data: { name: `Drink ${run}-${++seq}`, price, stock: 0 },
    });
    await prisma.recipeItem.create({
      data: {
        productId: product.id,
        ingredientId: ingredient.id,
        quantity: 30,
      },
    });
    return { ingredient, product };
  }
  const ingStock = async (id: number) =>
    (await prisma.ingredient.findUniqueOrThrow({ where: { id } })).stock;

  const placeOrder = (token: string, productId: number, quantity = 1) =>
    request(http)
      .post('/orders')
      .set(auth(token))
      .set('Idempotency-Key', key())
      .send({ items: [{ productId, quantity, size: 'S' }] });

  async function pendingOrder(token: string, price = 50000) {
    const { product } = await drinkWithRecipe(10_000, price);
    const res = await placeOrder(token, product.id).expect(201);
    return res.body as { id: number; total: number };
  }

  async function testAccount(
    provider: 'BANK' | 'MOMO' | 'VNPAY',
    balance: number,
  ) {
    return prisma.paymentAccount.create({
      data: {
        provider,
        identifier: `T${run}${++seq}`,
        holderName: 'TEST',
        pinHash: await bcrypt.hash('123456', 4),
        balance,
      },
    });
  }

  beforeAll(async () => {
    ({ app, prisma } = await createApp());
    http = app.getHttpServer();
    const a = await registerUser(app, `qa-${run}@test.dev`);
    alice = { token: a.accessToken, id: a.user.id };
    const b = await registerUser(app, `qb-${run}@test.dev`);
    bob = { token: b.accessToken, id: b.user.id };
    staffToken = (await loginStaff(app)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Nguyên liệu và công thức', () => {
    it('trừ nguyên liệu theo công thức; đặt vượt lượng còn lại bị chặn 400', async () => {
      const { ingredient, product } = await drinkWithRecipe(100);
      await placeOrder(alice.token, product.id, 3).expect(201);
      expect(await ingStock(ingredient.id)).toBe(10);

      const res = await placeOrder(alice.token, product.id, 1).expect(400);
      expect(JSON.stringify(res.body)).toContain('Không đủ nguyên liệu');
      expect(await ingStock(ingredient.id)).toBe(10); // không bị trừ khi bị chặn
      expect(
        (await prisma.product.findUniqueOrThrow({ where: { id: product.id } }))
          .stock,
      ).toBe(0); // không đụng Product.stock
    });

    it('nhu cầu cộng dồn giữa các dòng của cùng một đơn', async () => {
      const { ingredient, product } = await drinkWithRecipe(100);
      // Mỗi dòng 2 ly = 60 (đủ), nhưng hai dòng = 120 > 100.
      const res = await request(http)
        .post('/orders')
        .set(auth(alice.token))
        .set('Idempotency-Key', key())
        .send({
          items: [
            { productId: product.id, quantity: 2, size: 'S' },
            { productId: product.id, quantity: 2, size: 'M' },
          ],
        })
        .expect(400);
      expect(JSON.stringify(res.body)).toContain('Không đủ nguyên liệu');
      expect(await ingStock(ingredient.id)).toBe(100);
    });

    it('đồng thời: kho đủ 3 ly thì đúng 3 trong 6 yêu cầu thành công, kho không âm', async () => {
      const { ingredient, product } = await drinkWithRecipe(100);
      const results = await Promise.all(
        Array.from({ length: 6 }, () => placeOrder(alice.token, product.id, 1)),
      );
      const ok = results.filter((r) => r.status === 201).length;
      expect(ok).toBe(3);
      expect(results.filter((r) => r.status === 400).length).toBe(3);
      expect(await ingStock(ingredient.id)).toBe(10);
    });

    it('hủy đơn hoàn lại đúng lượng nguyên liệu (một lần)', async () => {
      const { ingredient, product } = await drinkWithRecipe(100);
      const order = (await placeOrder(alice.token, product.id, 2).expect(201))
        .body as { id: number };
      expect(await ingStock(ingredient.id)).toBe(40);
      await request(http)
        .patch(`/orders/${order.id}/status`)
        .set(auth(staffToken))
        .send({ status: 'CANCELLED' })
        .expect(200);
      expect(await ingStock(ingredient.id)).toBe(100);
      await request(http)
        .patch(`/orders/${order.id}/status`)
        .set(auth(staffToken))
        .send({ status: 'CANCELLED' })
        .expect(400);
      expect(await ingStock(ingredient.id)).toBe(100);
    });

    it('GET /products trả công thức, số ly tối đa và available', async () => {
      const { product } = await drinkWithRecipe(70);
      const list = (await request(http).get('/products').expect(200)).body as {
        id: number;
        maxQuantity: number;
        available: boolean;
        recipe: { quantity: number; unit: string }[];
      }[];
      const row = list.find((p) => p.id === product.id)!;
      expect(row.maxQuantity).toBe(2); // floor(70/30)
      expect(row.available).toBe(true);
      expect(row.recipe).toEqual([
        expect.objectContaining({ quantity: 30, unit: 'g' }),
      ]);
      await placeOrder(alice.token, product.id, 2).expect(201);
      const after = (await request(http).get(`/products/${product.id}`))
        .body as {
        available: boolean;
        maxQuantity: number;
      };
      expect(after).toMatchObject({ available: false, maxQuantity: 0 });
    });

    it('chỉ STAFF xem kho và nhập thêm nguyên liệu', async () => {
      const { ingredient } = await drinkWithRecipe(5);
      await request(http)
        .get('/ingredients')
        .set(auth(alice.token))
        .expect(403);
      await request(http).get('/ingredients').expect(401);
      await request(http)
        .patch(`/ingredients/${ingredient.id}/restock`)
        .set(auth(alice.token))
        .send({ quantity: 10 })
        .expect(403);
      const res = await request(http)
        .patch(`/ingredients/${ingredient.id}/restock`)
        .set(auth(staffToken))
        .send({ quantity: 10 })
        .expect(200);
      expect(res.body.stock).toBe(15);
      await request(http)
        .patch(`/ingredients/${ingredient.id}/restock`)
        .set(auth(staffToken))
        .send({ quantity: -1 })
        .expect(400);
    });

    it('sản phẩm chưa có công thức vẫn dùng Product.stock như trước', async () => {
      const p = await prisma.product.create({
        data: { name: `Legacy ${run}`, price: 20000, stock: 1 },
      });
      await placeOrder(alice.token, p.id, 1).expect(201);
      await placeOrder(alice.token, p.id, 1).expect(400);
    });
  });

  describe('Nguyên liệu theo size và topping', () => {
    async function toppingWithRecipe(ingredientId: number, perPortion: number) {
      const t = await prisma.topping.create({
        data: { name: `TP ${run}-${++seq}`, price: 5000 },
      });
      await prisma.toppingRecipeItem.create({
        data: { toppingId: t.id, ingredientId, quantity: perPortion },
      });
      return t;
    }

    it('size lớn dùng nhiều nguyên liệu hơn: S=30, M=38 (làm tròn lên), L=45', async () => {
      const { ingredient, product } = await drinkWithRecipe(1000);
      for (const [size, used] of [
        ['S', 30],
        ['M', 38],
        ['L', 45],
      ] as const) {
        const before = await ingStock(ingredient.id);
        await request(http)
          .post('/orders')
          .set(auth(alice.token))
          .set('Idempotency-Key', key())
          .send({ items: [{ productId: product.id, quantity: 1, size }] })
          .expect(201);
        expect(before - (await ingStock(ingredient.id))).toBe(used);
      }
    });

    it('size L không đủ nguyên liệu dù size S còn đủ', async () => {
      const { ingredient, product } = await drinkWithRecipe(40); // S=30 đủ, L=45 thiếu
      await request(http)
        .post('/orders')
        .set(auth(alice.token))
        .set('Idempotency-Key', key())
        .send({ items: [{ productId: product.id, quantity: 1, size: 'L' }] })
        .expect(400);
      expect(await ingStock(ingredient.id)).toBe(40);
      await placeOrder(alice.token, product.id, 1).expect(201); // size S
    });

    it('topping trừ nguyên liệu riêng, nhân số phần và số ly; hủy đơn hoàn lại', async () => {
      const { product } = await drinkWithRecipe(1000);
      const topIng = await prisma.ingredient.create({
        data: { name: `TPNL ${run}-${++seq}`, unit: 'g', stock: 100 },
      });
      const topping = await toppingWithRecipe(topIng.id, 10);
      const res = await request(http)
        .post('/orders')
        .set(auth(alice.token))
        .set('Idempotency-Key', key())
        .send({
          items: [
            {
              productId: product.id,
              quantity: 3,
              size: 'S',
              toppings: [{ toppingId: topping.id, quantity: 2 }],
            },
          ],
        })
        .expect(201);
      expect(await ingStock(topIng.id)).toBe(100 - 3 * 2 * 10);
      await request(http)
        .patch(`/orders/${res.body.id}/status`)
        .set(auth(staffToken))
        .send({ status: 'CANCELLED' })
        .expect(200);
      expect(await ingStock(topIng.id)).toBe(100);
    });

    it('hết nguyên liệu của topping thì không đặt được ly có topping đó', async () => {
      const { product } = await drinkWithRecipe(1000);
      const topIng = await prisma.ingredient.create({
        data: { name: `TPNL ${run}-${++seq}`, unit: 'g', stock: 15 },
      });
      const topping = await toppingWithRecipe(topIng.id, 10);
      const body = (qty: number) => ({
        items: [
          {
            productId: product.id,
            quantity: qty,
            size: 'S',
            toppings: [{ toppingId: topping.id, quantity: 1 }],
          },
        ],
      });
      const res = await request(http)
        .post('/orders')
        .set(auth(alice.token))
        .set('Idempotency-Key', key())
        .send(body(2))
        .expect(400);
      expect(JSON.stringify(res.body)).toContain('Không đủ nguyên liệu');
    });

    it('POST /products/availability: chỉ trả số ly, tính theo size, topping và giỏ hàng, không lộ tồn kho', async () => {
      const { product } = await drinkWithRecipe(100);
      const ask = (candidate: object, cart: object[] = []) =>
        request(http)
          .post('/products/availability')
          .send({ cart, candidate })
          .expect(200);

      const s = await ask({ productId: product.id, size: 'S' });
      expect(s.body).toEqual({ maxAdditional: 3 }); // floor(100/30)
      expect(
        (await ask({ productId: product.id, size: 'L' })).body.maxAdditional,
      ).toBe(2); // floor(100/45)

      // Giỏ đã có 2 ly size L (90) -> còn 10 nguyên liệu, không đủ cho thêm ly nào.
      const withCart = await ask({ productId: product.id, size: 'S' }, [
        { productId: product.id, size: 'L', quantity: 2 },
      ]);
      expect(withCart.body.maxAdditional).toBe(0);
      expect(JSON.stringify(s.body)).not.toMatch(/stock|ingredient/i);

      await request(http)
        .post('/products/availability')
        .send({ candidate: { productId: 999999999, size: 'S' } })
        .expect(404);
      await request(http)
        .post('/products/availability')
        .send({ candidate: { productId: product.id, size: 'XL' } })
        .expect(400);
    });

    it('GET /products có recipeBySize; GET /toppings có công thức topping', async () => {
      const { product } = await drinkWithRecipe(100);
      const list = (await request(http).get('/products').expect(200)).body as {
        id: number;
        recipeBySize: Record<string, { quantity: number }[]>;
      }[];
      const row = list.find((p) => p.id === product.id)!;
      expect(row.recipeBySize.S[0].quantity).toBe(30);
      expect(row.recipeBySize.M[0].quantity).toBe(38);
      expect(row.recipeBySize.L[0].quantity).toBe(45);
      const tops = (await request(http).get('/toppings').expect(200)).body as {
        recipe: unknown[];
      }[];
      expect(tops.some((t) => t.recipe.length > 0)).toBe(true);
    });

    it('kho cho STAFF liệt kê món/topping dùng nguyên liệu và số ly còn làm được', async () => {
      const { ingredient } = await drinkWithRecipe(100);
      const res = await request(http)
        .get('/ingredients')
        .set(auth(staffToken))
        .expect(200);
      const row = (
        res.body as {
          id: number;
          cupsRemaining: number;
          usedBy: { kind: string }[];
        }[]
      ).find((i) => i.id === ingredient.id)!;
      expect(row.cupsRemaining).toBe(3);
      expect(row.usedBy[0].kind).toBe('DRINK');
    });
  });

  describe('Thanh toán QR (mô phỏng)', () => {
    const createIntent = (token: string, orderId: number, provider = 'BANK') =>
      request(http)
        .post('/payments/intents')
        .set(auth(token))
        .send({ orderId, provider });

    it('tạo QR, quét + xác nhận bằng tài khoản test -> đơn PAID, cộng điểm, trừ số dư', async () => {
      const order = await pendingOrder(alice.token, 50000); // total 50.000
      const acc = await testAccount('BANK', 1_000_000);
      const before = (
        await prisma.user.findUniqueOrThrow({ where: { id: alice.id } })
      ).points;

      const intent = (await createIntent(alice.token, order.id).expect(201))
        .body as {
        token: string;
        mode: string;
        qrContent: string;
        amount: number;
      };
      expect(intent.mode).toBe('SIMULATED');
      expect(intent.qrContent).toMatch(new RegExp(`/pay/${intent.token}$`));
      expect(intent.amount).toBe(50000);

      const pending = (
        await request(http).get(`/payments/intents/${intent.token}`).expect(200)
      ).body;
      expect(pending.status).toBe('PENDING');

      // Sai PIN / sai tài khoản: cùng một thông báo, chưa trừ tiền.
      await request(http)
        .post(`/payments/intents/${intent.token}/confirm`)
        .send({ accountNumber: acc.identifier, pin: '000000' })
        .expect(400);
      await request(http)
        .post(`/payments/intents/${intent.token}/confirm`)
        .send({ accountNumber: 'khong-ton-tai', pin: '123456' })
        .expect(400);

      const done = await request(http)
        .post(`/payments/intents/${intent.token}/confirm`)
        .send({ accountNumber: acc.identifier, pin: '123456' })
        .expect(200);
      expect(done.body).toMatchObject({ status: 'PAID', pointsEarned: 5 });

      const o = await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
      });
      expect(o.status).toBe('PAID');
      expect(
        (
          await prisma.paymentAccount.findUniqueOrThrow({
            where: { id: acc.id },
          })
        ).balance,
      ).toBe(950_000);
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: alice.id } }))
          .points,
      ).toBe(before + 5);
      expect(done.body.pointsBalance).toBe(before + 5);

      // Xác nhận lặp: không trừ tiền, không cộng điểm lần hai.
      await request(http)
        .post(`/payments/intents/${intent.token}/confirm`)
        .send({ accountNumber: acc.identifier, pin: '123456' })
        .expect(200);
      expect(
        (
          await prisma.paymentAccount.findUniqueOrThrow({
            where: { id: acc.id },
          })
        ).balance,
      ).toBe(950_000);
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: alice.id } }))
          .points,
      ).toBe(before + 5);
      expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(
        1,
      );
    });

    it('số dư không đủ -> 400, đơn vẫn PENDING, số dư giữ nguyên', async () => {
      const order = await pendingOrder(alice.token, 50000);
      const acc = await testAccount('MOMO', 1_000);
      const { token } = (
        await createIntent(alice.token, order.id, 'MOMO').expect(201)
      ).body;
      await request(http)
        .post(`/payments/intents/${token}/confirm`)
        .send({ accountNumber: acc.identifier, pin: '123456' })
        .expect(400);
      expect(
        (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
          .status,
      ).toBe('PENDING');
      expect(
        (
          await prisma.paymentAccount.findUniqueOrThrow({
            where: { id: acc.id },
          })
        ).balance,
      ).toBe(1_000);
    });

    it('tài khoản của nhà cung cấp khác không dùng được cho phiên này', async () => {
      const order = await pendingOrder(alice.token);
      const bank = await testAccount('BANK', 1_000_000);
      const { token } = (
        await createIntent(alice.token, order.id, 'VNPAY').expect(201)
      ).body;
      await request(http)
        .post(`/payments/intents/${token}/confirm`)
        .send({ accountNumber: bank.identifier, pin: '123456' })
        .expect(400);
    });

    it('chỉ chủ đơn tạo được QR; đơn đã thanh toán không tạo thêm', async () => {
      const order = await pendingOrder(alice.token);
      await createIntent(bob.token, order.id).expect(404);
      await createIntent(alice.token, 999_999_999).expect(404);
      await request(http)
        .post('/payments/intents')
        .send({ orderId: order.id, provider: 'BANK' })
        .expect(401);
      await request(http)
        .post('/payments/intents')
        .set(auth(alice.token))
        .send({ orderId: order.id, provider: 'PAYPAL' })
        .expect(400);
    });

    it('QR hết hạn không thanh toán được; tạo QR mới làm QR cũ vô hiệu', async () => {
      const order = await pendingOrder(alice.token);
      const acc = await testAccount('BANK', 1_000_000);
      const first = (await createIntent(alice.token, order.id).expect(201))
        .body;
      const second = (await createIntent(alice.token, order.id).expect(201))
        .body;
      expect(
        (await request(http).get(`/payments/intents/${first.token}`)).body
          .status,
      ).toBe('EXPIRED');
      await request(http)
        .post(`/payments/intents/${first.token}/confirm`)
        .send({ accountNumber: acc.identifier, pin: '123456' })
        .expect(400);

      await prisma.paymentIntent.update({
        where: { token: second.token },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      await request(http)
        .post(`/payments/intents/${second.token}/confirm`)
        .send({ accountNumber: acc.identifier, pin: '123456' })
        .expect(400);
      expect(
        (await request(http).get(`/payments/intents/${second.token}`)).body
          .status,
      ).toBe('EXPIRED');
      expect(
        (
          await prisma.paymentAccount.findUniqueOrThrow({
            where: { id: acc.id },
          })
        ).balance,
      ).toBe(1_000_000);
    });

    it('token không tồn tại -> 404', async () => {
      await request(http).get('/payments/intents/deadbeef').expect(404);
    });

    it('xác nhận đồng thời cùng một QR chỉ trừ tiền và cộng điểm một lần', async () => {
      const order = await pendingOrder(alice.token, 50000);
      const acc = await testAccount('BANK', 1_000_000);
      const { token } = (await createIntent(alice.token, order.id).expect(201))
        .body;
      await Promise.all(
        Array.from({ length: 4 }, () =>
          request(http)
            .post(`/payments/intents/${token}/confirm`)
            .send({ accountNumber: acc.identifier, pin: '123456' }),
        ),
      );
      expect(
        (
          await prisma.paymentAccount.findUniqueOrThrow({
            where: { id: acc.id },
          })
        ).balance,
      ).toBe(950_000);
      expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(
        1,
      );
      expect(
        await prisma.loyaltyTransaction.count({
          where: { orderId: order.id, type: 'EARN' },
        }),
      ).toBe(1);
    });

    it('danh sách tài khoản test công khai, không lộ PIN', async () => {
      await testAccount('BANK', 1);
      const res = await request(http)
        .get('/payments/test-accounts')
        .expect(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(JSON.stringify(res.body)).not.toMatch(/pin/i);
    });

    it('POST /payments với MOMO/BANK/VNPAY bị từ chối; WALLET trả pointsEarned', async () => {
      const order = await pendingOrder(alice.token, 50000);
      await request(http)
        .post('/payments')
        .set(auth(alice.token))
        .set('Idempotency-Key', key())
        .send({ orderId: order.id, method: 'MOMO' })
        .expect(400);
      const res = await request(http)
        .post('/payments')
        .set(auth(alice.token))
        .set('Idempotency-Key', key())
        .send({ orderId: order.id, method: 'WALLET' })
        .expect(200);
      expect(res.body.payment.status).toBe('SUCCESS');
      expect(res.body.pointsEarned).toBe(5);
      expect(typeof res.body.pointsBalance).toBe('number');
    });
  });

  describe('Cổng VNPay sandbox (ký + callback)', () => {
    const SECRET = 'TEST_SECRET_ONLY_FOR_UNIT_TESTS';
    beforeAll(() => {
      process.env.VNPAY_TMN_CODE = 'TESTCODE';
      process.env.VNPAY_HASH_SECRET = SECRET;
    });
    afterAll(() => {
      delete process.env.VNPAY_TMN_CODE;
      delete process.env.VNPAY_HASH_SECRET;
    });

    function signedReturn(token: string, amount: number, code = '00') {
      const params: Record<string, string> = {
        vnp_Amount: String(amount * 100),
        vnp_ResponseCode: code,
        vnp_TransactionNo: '14000001',
        vnp_TransactionStatus: code,
        vnp_TxnRef: token,
      };
      params.vnp_SecureHash = vnpaySign(params, SECRET).hash;
      return params;
    }

    it('tạo URL có chữ ký; return hợp lệ -> PAID; gọi lại không thanh toán lần hai', async () => {
      const order = await pendingOrder(alice.token, 50000);
      const intent = (
        await request(http)
          .post('/payments/intents')
          .set(auth(alice.token))
          .send({ orderId: order.id, provider: 'VNPAY' })
          .expect(201)
      ).body;
      expect(intent.mode).toBe('SANDBOX');
      expect(intent.payUrl).toContain('vnp_SecureHash=');
      expect(intent.payUrl).toContain(`vnp_TxnRef=${intent.token}`);
      expect(intent.payUrl).toContain('vnp_Amount=5000000');

      // Chữ ký giả -> bị bỏ qua.
      const forged = signedReturn(intent.token, 50000);
      forged.vnp_SecureHash = 'a'.repeat(128);
      await request(http)
        .get('/payments/vnpay/return')
        .query(forged)
        .expect(302);
      expect(
        (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
          .status,
      ).toBe('PENDING');

      // Sai số tiền (chữ ký đúng nhưng khác tổng đơn) -> bị bỏ qua.
      await request(http)
        .get('/payments/vnpay/return')
        .query(signedReturn(intent.token, 1000))
        .expect(302);
      expect(
        (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
          .status,
      ).toBe('PENDING');

      const ok = await request(http)
        .get('/payments/vnpay/return')
        .query(signedReturn(intent.token, 50000))
        .expect(302);
      expect(ok.headers.location).toContain(`/pay/${intent.token}`);
      expect(
        (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
          .status,
      ).toBe('PAID');

      const ipn = await request(http)
        .get('/payments/vnpay/ipn')
        .query(signedReturn(intent.token, 50000))
        .expect(200);
      expect(ipn.body.RspCode).toBe('02'); // đã xác nhận trước đó
      expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(
        1,
      );
    });

    it('cổng báo thất bại -> phiên FAILED, đơn vẫn PENDING', async () => {
      const order = await pendingOrder(alice.token, 50000);
      const intent = (
        await request(http)
          .post('/payments/intents')
          .set(auth(alice.token))
          .send({ orderId: order.id, provider: 'VNPAY' })
      ).body;
      await request(http)
        .get('/payments/vnpay/ipn')
        .query(signedReturn(intent.token, 50000, '24'))
        .expect(200);
      expect(
        (await request(http).get(`/payments/intents/${intent.token}`)).body
          .status,
      ).toBe('FAILED');
      expect(
        (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
          .status,
      ).toBe('PENDING');
    });
  });

  describe('Điểm thưởng và đổi quà', () => {
    it('GET /rewards công khai; /rewards/me cần đăng nhập', async () => {
      const list = (await request(http).get('/rewards').expect(200))
        .body as unknown[];
      expect(list.length).toBeGreaterThan(0);
      await request(http).get('/rewards/me').expect(401);
      const me = (
        await request(http)
          .get('/rewards/me')
          .set(auth(alice.token))
          .expect(200)
      ).body;
      expect(me).toHaveProperty('points');
      expect(Array.isArray(me.history)).toBe(true);
    });

    it('đổi quà trừ điểm, sinh mã; thiếu điểm -> 400', async () => {
      const reward = await prisma.reward.create({
        data: { name: `Quà ${run}`, pointsCost: 20 },
      });
      const u = await registerUser(app, `qr-${run}@test.dev`);
      await request(http)
        .post(`/rewards/${reward.id}/redeem`)
        .set(auth(u.accessToken))
        .expect(400);
      await prisma.user.update({
        where: { id: u.user.id },
        data: { points: 25 },
      });
      const res = await request(http)
        .post(`/rewards/${reward.id}/redeem`)
        .set(auth(u.accessToken))
        .expect(200);
      expect(res.body).toMatchObject({ pointsSpent: 20, pointsBalance: 5 });
      expect(res.body.code).toMatch(/^GIFT-[0-9A-F]{8}$/);
      const me = (
        await request(http).get('/rewards/me').set(auth(u.accessToken))
      ).body;
      expect(me.points).toBe(5);
      expect(me.redemptions).toHaveLength(1);
      await request(http)
        .post(`/rewards/${reward.id}/redeem`)
        .set(auth(u.accessToken))
        .expect(400);
      await request(http)
        .post('/rewards/999999999/redeem')
        .set(auth(u.accessToken))
        .expect(404);
    });

    it('đổi quà đồng thời: đủ điểm cho 1 lần thì chỉ 1 lần thành công', async () => {
      const reward = await prisma.reward.create({
        data: { name: `Quà đua ${run}`, pointsCost: 30 },
      });
      const u = await registerUser(app, `qrace-${run}@test.dev`);
      await prisma.user.update({
        where: { id: u.user.id },
        data: { points: 40 },
      });
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(http)
            .post(`/rewards/${reward.id}/redeem`)
            .set(auth(u.accessToken)),
        ),
      );
      expect(results.filter((r) => r.status === 200)).toHaveLength(1);
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: u.user.id } }))
          .points,
      ).toBe(10);
    });

    it('hủy đơn đã thanh toán trừ lại điểm đã cộng (đối soát REVERSAL)', async () => {
      const order = await pendingOrder(alice.token, 50000);
      const acc = await testAccount('BANK', 1_000_000);
      const { token } = (
        await request(http)
          .post('/payments/intents')
          .set(auth(alice.token))
          .send({ orderId: order.id, provider: 'BANK' })
      ).body;
      const before = (
        await prisma.user.findUniqueOrThrow({ where: { id: alice.id } })
      ).points;
      await request(http)
        .post(`/payments/intents/${token}/confirm`)
        .send({ accountNumber: acc.identifier, pin: '123456' })
        .expect(200);
      await request(http)
        .patch(`/orders/${order.id}/status`)
        .set(auth(staffToken))
        .send({ status: 'CANCELLED' })
        .expect(200);
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: alice.id } }))
          .points,
      ).toBe(before);
    });
  });
});
