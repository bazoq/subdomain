-- Idempotency key for checkout (commerce handoff): a client-generated key per checkout attempt, so a retried
-- placeOrder / placeFoodOrder can return the original order instead of creating a duplicate. Nullable: existing
-- rows and any writer that does not send a key are unaffected (Postgres treats NULLs as distinct in unique
-- indexes). Generated with
--   prisma migrate diff --from-schema <previous schema> --to-schema prisma/schema.prisma --script
-- and reviewed by hand. Additive only; safe to deploy before the application starts writing the column.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "FoodOrder" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_tenantId_idempotencyKey_key" ON "Order"("tenantId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "FoodOrder_tenantId_idempotencyKey_key" ON "FoodOrder"("tenantId", "idempotencyKey");
