-- Nguyên liệu chỉ bị trừ khi thanh toán thành công. Cột consumed ghi nhận dòng nào đã trừ.
ALTER TABLE "OrderIngredientUse" ADD COLUMN "consumed" BOOLEAN NOT NULL DEFAULT false;

-- Đơn cũ đã trừ kho lúc tạo đơn (và được hoàn khi hủy): đơn chưa hủy = đã trừ.
UPDATE "OrderIngredientUse" u SET "consumed" = true
FROM "Order" o
WHERE o."id" = u."orderId" AND o."status" <> 'CANCELLED';
