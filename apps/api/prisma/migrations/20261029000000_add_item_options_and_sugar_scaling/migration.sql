-- Lưu mức đường/đá khách chọn cho từng dòng đơn (null = đơn cũ chưa ghi nhận).
ALTER TABLE "OrderItem" ADD COLUMN "sugar" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN "ice" INTEGER;

-- Nguyên liệu có lượng dùng thay đổi theo mức đường khách chọn.
ALTER TABLE "Ingredient" ADD COLUMN "sugarScaled" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Ingredient" SET "sugarScaled" = true WHERE "name" = 'Đường';
