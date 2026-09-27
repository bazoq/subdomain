-- Indexes for the real query patterns of every tenant-scoped table (tenantId + status/createdAt/isActive/sortOrder),
-- indexes on every FK column that lacked one, and real foreign keys for Property.agentId / ClassSchedule.trainerId
-- (previously dangling string references to TeamMember). Generated with
--   prisma migrate diff --from-schema <previous schema> --to-schema prisma/schema.prisma --script
-- and reviewed by hand. Runs inside one transaction (prisma migrate deploy); tables are small at this stage so
-- plain CREATE INDEX (not CONCURRENTLY, which cannot run in a transaction) is fine.

-- Data guard: null out references that would violate the new foreign keys (no-op on a fresh database).
UPDATE "Property" p SET "agentId" = NULL
WHERE p."agentId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "TeamMember" t WHERE t."id" = p."agentId");
UPDATE "ClassSchedule" c SET "trainerId" = NULL
WHERE c."trainerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "TeamMember" t WHERE t."id" = c."trainerId");

-- DropIndex
DROP INDEX "GalleryItem_tenantId_album_idx";

-- CreateIndex
CREATE INDEX "Tenant_isDemo_status_idx" ON "Tenant"("isDemo", "status");

-- CreateIndex
CREATE INDEX "TenantUser_tenantId_role_isActive_idx" ON "TenantUser"("tenantId", "role", "isActive");

-- CreateIndex
CREATE INDEX "Session_superUserId_idx" ON "Session"("superUserId");

-- CreateIndex
CREATE INDEX "Session_tenantUserId_idx" ON "Session"("tenantUserId");

-- CreateIndex
CREATE INDEX "Session_tenantId_idx" ON "Session"("tenantId");

-- CreateIndex
CREATE INDEX "SitePage_tenantId_enabled_sortOrder_idx" ON "SitePage"("tenantId", "enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Media_tenantId_createdAt_idx" ON "Media"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Media_confirmed_createdAt_idx" ON "Media"("confirmed", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entity_entityId_idx" ON "AuditLog"("tenantId", "entity", "entityId");

-- CreateIndex
CREATE INDEX "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "SuperLead_status_createdAt_idx" ON "SuperLead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductCategory_tenantId_parentId_idx" ON "ProductCategory"("tenantId", "parentId");

-- CreateIndex
CREATE INDEX "ProductCategory_parentId_idx" ON "ProductCategory"("parentId");

-- CreateIndex
CREATE INDEX "Product_tenantId_createdAt_idx" ON "Product"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductVariant_tenantId_idx" ON "ProductVariant"("tenantId");

-- CreateIndex
CREATE INDEX "Customer_tenantId_createdAt_idx" ON "Customer"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_tenantId_createdAt_idx" ON "Order"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_tenantId_customerPhone_idx" ON "Order"("tenantId", "customerPhone");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_prescriptionId_idx" ON "Order"("prescriptionId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_tenantId_idx" ON "OrderItem"("tenantId");

-- CreateIndex
CREATE INDEX "Coupon_tenantId_isActive_idx" ON "Coupon"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ShippingZone_tenantId_isActive_sortOrder_idx" ON "ShippingZone"("tenantId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Prescription_tenantId_createdAt_idx" ON "Prescription"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_mediaId_idx" ON "Prescription"("mediaId");

-- CreateIndex
CREATE INDEX "MenuCategory_tenantId_isActive_sortOrder_idx" ON "MenuCategory"("tenantId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "MenuItem_tenantId_isAvailable_isFeatured_idx" ON "MenuItem"("tenantId", "isAvailable", "isFeatured");

-- CreateIndex
CREATE INDEX "MenuItem_tenantId_createdAt_idx" ON "MenuItem"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ModifierGroup_tenantId_sortOrder_idx" ON "ModifierGroup"("tenantId", "sortOrder");

-- CreateIndex
CREATE INDEX "Modifier_groupId_sortOrder_idx" ON "Modifier"("groupId", "sortOrder");

-- CreateIndex
CREATE INDEX "Modifier_tenantId_idx" ON "Modifier"("tenantId");

-- CreateIndex
CREATE INDEX "MenuItemModifierGroup_groupId_idx" ON "MenuItemModifierGroup"("groupId");

-- CreateIndex
CREATE INDEX "FoodOrder_tenantId_createdAt_idx" ON "FoodOrder"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "FoodOrder_tenantId_customerPhone_idx" ON "FoodOrder"("tenantId", "customerPhone");

-- CreateIndex
CREATE INDEX "FoodOrder_tenantId_scheduledFor_idx" ON "FoodOrder"("tenantId", "scheduledFor");

-- CreateIndex
CREATE INDEX "FoodOrder_customerId_idx" ON "FoodOrder"("customerId");

-- CreateIndex
CREATE INDEX "FoodOrderItem_menuItemId_idx" ON "FoodOrderItem"("menuItemId");

-- CreateIndex
CREATE INDEX "FoodOrderItem_tenantId_idx" ON "FoodOrderItem"("tenantId");

-- CreateIndex
CREATE INDEX "DeliveryZone_tenantId_isActive_sortOrder_idx" ON "DeliveryZone"("tenantId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Reservation_tenantId_status_date_idx" ON "Reservation"("tenantId", "status", "date");

-- CreateIndex
CREATE INDEX "Reservation_tenantId_createdAt_idx" ON "Reservation"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Job_tenantId_isActive_isFeatured_createdAt_idx" ON "Job"("tenantId", "isActive", "isFeatured", "createdAt");

-- CreateIndex
CREATE INDEX "Job_tenantId_createdAt_idx" ON "Job"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Job_tenantId_deadline_idx" ON "Job"("tenantId", "deadline");

-- CreateIndex
CREATE INDEX "Application_tenantId_createdAt_idx" ON "Application"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Application_jobId_idx" ON "Application"("jobId");

-- CreateIndex
CREATE INDEX "TravelPackage_tenantId_isActive_isFeatured_sortOrder_idx" ON "TravelPackage"("tenantId", "isActive", "isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "TravelPackage_tenantId_createdAt_idx" ON "TravelPackage"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_tenantId_createdAt_idx" ON "Booking"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_packageId_idx" ON "Booking"("packageId");

-- CreateIndex
CREATE INDEX "Property_tenantId_isActive_isFeatured_sortOrder_idx" ON "Property"("tenantId", "isActive", "isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "Property_tenantId_createdAt_idx" ON "Property"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Property_agentId_idx" ON "Property"("agentId");

-- CreateIndex
CREATE INDEX "MembershipPlan_tenantId_isActive_sortOrder_idx" ON "MembershipPlan"("tenantId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ClassSchedule_tenantId_isActive_dayOfWeek_idx" ON "ClassSchedule"("tenantId", "isActive", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ClassSchedule_trainerId_idx" ON "ClassSchedule"("trainerId");

-- CreateIndex
CREATE INDEX "TeamMember_tenantId_isActive_sortOrder_idx" ON "TeamMember"("tenantId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Service_tenantId_isActive_isFeatured_sortOrder_idx" ON "Service"("tenantId", "isActive", "isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "Testimonial_tenantId_isActive_sortOrder_idx" ON "Testimonial"("tenantId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "FaqItem_tenantId_isActive_sortOrder_idx" ON "FaqItem"("tenantId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "GalleryItem_tenantId_album_sortOrder_idx" ON "GalleryItem"("tenantId", "album", "sortOrder");

-- CreateIndex
CREATE INDEX "TenantPost_tenantId_published_publishedAt_idx" ON "TenantPost"("tenantId", "published", "publishedAt");

-- CreateIndex
CREATE INDEX "TenantPost_tenantId_updatedAt_idx" ON "TenantPost"("tenantId", "updatedAt");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

