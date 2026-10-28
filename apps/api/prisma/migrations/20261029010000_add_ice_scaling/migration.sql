-- Đá viên là nguyên liệu kho, lượng dùng theo mức đá khách chọn.
ALTER TABLE "Ingredient" ADD COLUMN "iceScaled" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "Ingredient" ("name", "unit", "stock", "sugarScaled", "iceScaled")
SELECT 'Đá viên', 'g', 60000, false, true
WHERE NOT EXISTS (SELECT 1 FROM "Ingredient" WHERE "name" = 'Đá viên');

-- Đá cho mọi món (lượng cho 1 ly size S); món đá xay dùng nhiều hơn.
INSERT INTO "RecipeItem" ("productId", "ingredientId", "quantity")
SELECT p."id", i."id", CASE WHEN p."id" IN (11, 12) THEN 200 ELSE 150 END
FROM "Product" p
JOIN "Ingredient" i ON i."name" = 'Đá viên'
WHERE p."id" BETWEEN 1 AND 12
  AND NOT EXISTS (SELECT 1 FROM "RecipeItem" r WHERE r."productId" = p."id" AND r."ingredientId" = i."id");

-- Món chưa có đường trong công thức (cà phê sữa, bạc xỉu, latte, trà chanh, trà sữa khoai môn).
INSERT INTO "RecipeItem" ("productId", "ingredientId", "quantity")
SELECT p."id", i."id", v."q"
FROM (VALUES (1, 10), (2, 8), (4, 8), (7, 10), (10, 15)) AS v("pid", "q")
JOIN "Product" p ON p."id" = v."pid"
JOIN "Ingredient" i ON i."name" = 'Đường'
WHERE NOT EXISTS (SELECT 1 FROM "RecipeItem" r WHERE r."productId" = p."id" AND r."ingredientId" = i."id");
