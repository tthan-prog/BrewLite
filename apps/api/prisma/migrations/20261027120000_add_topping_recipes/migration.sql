-- CreateTable
CREATE TABLE "ToppingRecipeItem" (
    "id" SERIAL NOT NULL,
    "toppingId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ToppingRecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToppingRecipeItem_ingredientId_idx" ON "ToppingRecipeItem"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "ToppingRecipeItem_toppingId_ingredientId_key" ON "ToppingRecipeItem"("toppingId", "ingredientId");

-- AddForeignKey
ALTER TABLE "ToppingRecipeItem" ADD CONSTRAINT "ToppingRecipeItem_toppingId_fkey" FOREIGN KEY ("toppingId") REFERENCES "Topping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToppingRecipeItem" ADD CONSTRAINT "ToppingRecipeItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
