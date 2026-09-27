-- SuperLead.source (super-site handoff): the page / template code the platform lead was submitted from
-- (e.g. "home", "pricing", "template:901"). Until now `leads-actions.ts` appended "(via …)" to `message`;
-- the value now has its own nullable column so sales can filter/report on it without parsing text.
-- Nullable, no default, no backfill: existing rows keep `message` as-is and read as source = NULL.
-- No index: the table is small and the leads list is served by "SuperLead_status_createdAt_idx".
-- Hand-written; equivalent to
--   prisma migrate diff --from-schema <previous schema> --to-schema prisma/schema.prisma --script
-- Additive only; safe to deploy before the application starts writing the column.

-- AlterTable
ALTER TABLE "SuperLead" ADD COLUMN     "source" TEXT;
