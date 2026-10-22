import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('OrdersService idempotency', () => {
  let service: OrdersService;
  let prisma: {
    $transaction: ReturnType<typeof vi.fn>;
    idempotencyRecord: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  let tx: Record<string, any>;

  const dto = {
    userId: 1,
    items: [
      {
        productId: 1,
        quantity: 1,
        size: 'M',
        toppings: [],
      },
    ],
  };

  const order = {
    id: 101,
    userId: 1,
    subtotal: 30000,
    discount: 0,
    total: 30000,
    items: [],
  };

  beforeEach(async () => {
    tx = {
      idempotencyRecord: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 1 }),
      },
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          price: 30000,
        }),
      },
      topping: {
        findUnique: vi.fn(),
      },
      promotion: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      order: {
        create: vi.fn().mockResolvedValue(order),
      },
    };

    prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
      idempotencyRecord: {
        findUnique: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject a request without an idempotency key', async () => {
    await expect(service.create(dto)).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should return the existing order for the same key and payload', async () => {


    // Lấy hash thực tế từ lần gọi đầu bằng cách tạo record qua mock.
    const crypto = await import('node:crypto');
    const normalizedPayload = {
      userId: 1,
      items: [
        {
          productId: 1,
          quantity: 1,
          size: 'M',
          toppings: [],
        },
      ],
      promoCode: null,
    };
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(normalizedPayload))
      .digest('hex');

    tx.idempotencyRecord.findUnique.mockResolvedValue({
      requestHash: hash,
      order,
    });

    await expect(service.create(dto, 'test-key')).resolves.toEqual(order);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('should reject the same key with a different payload', async () => {
    tx.idempotencyRecord.findUnique.mockResolvedValue({
      requestHash: 'different-hash',
      order,
    });

    await expect(service.create(dto, 'test-key')).rejects.toThrow(
      ConflictException,
    );

    expect(tx.order.create).not.toHaveBeenCalled();
  });
  it('should return the existing order after a P2002 race', async () => {
    const crypto = await import('node:crypto');

    const normalizedPayload = {
      userId: 1,
      items: [
        {
          productId: 1,
          quantity: 1,
          size: 'M',
          toppings: [],
        },
      ],
      promoCode: null,
    };

    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(normalizedPayload))
      .digest('hex');

    prisma.$transaction.mockRejectedValue({ code: 'P2002' });

    prisma.idempotencyRecord.findUnique.mockResolvedValue({
      requestHash,
      order,
    });

    await expect(service.create(dto, 'test-key')).resolves.toEqual(order);

    expect(prisma.idempotencyRecord.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_key: {
            userId: 1,
            key: 'test-key',
          },
        },
      }),
    );
  });
  it('should rethrow P2002 when no idempotency record exists', async () => {
    const originalError = { code: 'P2002' };

    prisma.$transaction.mockRejectedValue(originalError);
    prisma.idempotencyRecord.findUnique.mockResolvedValue(null);

    await expect(service.create(dto, 'test-key')).rejects.toBe(originalError);
  });
});
