-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CREATOR', 'REVIEWER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ASSET_CREATED', 'ASSET_UPDATED', 'DOCUMENT_UPLOADED', 'STATUS_CHANGED', 'DUPLICATE_FLAGGED', 'DUPLICATE_REVIEWED');

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CREATOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "LandAsset" (
    "asset_id" TEXT NOT NULL,
    "land_id" TEXT,
    "survey_no" TEXT,
    "owner_name" TEXT,
    "area" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "asset_type" TEXT,
    "description" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandAsset_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "Document" (
    "document_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "document_type" TEXT,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "WorkflowHistory" (
    "history_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "previous_status" "AssetStatus",
    "new_status" "AssetStatus" NOT NULL,
    "action_by" TEXT NOT NULL,
    "remarks" TEXT,
    "action_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowHistory_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "DuplicateFlag" (
    "flag_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "matched_asset_id" TEXT NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "survey_similarity" DOUBLE PRECISION,
    "owner_similarity" DOUBLE PRECISION,
    "area_similarity" DOUBLE PRECISION,
    "location_similarity" DOUBLE PRECISION,
    "reason" TEXT,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateFlag_pkey" PRIMARY KEY ("flag_id")
);

-- CreateTable
CREATE TABLE "AssetEvent" (
    "event_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "performed_by" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetEvent_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "LandAsset_survey_no_idx" ON "LandAsset"("survey_no");

-- CreateIndex
CREATE INDEX "LandAsset_owner_name_idx" ON "LandAsset"("owner_name");

-- CreateIndex
CREATE INDEX "LandAsset_created_by_idx" ON "LandAsset"("created_by");

-- CreateIndex
CREATE INDEX "LandAsset_status_idx" ON "LandAsset"("status");

-- CreateIndex
CREATE INDEX "Document_asset_id_idx" ON "Document"("asset_id");

-- CreateIndex
CREATE INDEX "Document_uploaded_by_idx" ON "Document"("uploaded_by");

-- CreateIndex
CREATE INDEX "WorkflowHistory_asset_id_idx" ON "WorkflowHistory"("asset_id");

-- CreateIndex
CREATE INDEX "WorkflowHistory_action_by_idx" ON "WorkflowHistory"("action_by");

-- CreateIndex
CREATE INDEX "DuplicateFlag_asset_id_idx" ON "DuplicateFlag"("asset_id");

-- CreateIndex
CREATE INDEX "DuplicateFlag_matched_asset_id_idx" ON "DuplicateFlag"("matched_asset_id");

-- CreateIndex
CREATE INDEX "DuplicateFlag_review_status_idx" ON "DuplicateFlag"("review_status");

-- CreateIndex
CREATE INDEX "AssetEvent_asset_id_idx" ON "AssetEvent"("asset_id");

-- CreateIndex
CREATE INDEX "AssetEvent_performed_by_idx" ON "AssetEvent"("performed_by");

-- AddForeignKey
ALTER TABLE "LandAsset" ADD CONSTRAINT "LandAsset_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "LandAsset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "LandAsset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateFlag" ADD CONSTRAINT "DuplicateFlag_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "LandAsset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateFlag" ADD CONSTRAINT "DuplicateFlag_matched_asset_id_fkey" FOREIGN KEY ("matched_asset_id") REFERENCES "LandAsset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateFlag" ADD CONSTRAINT "DuplicateFlag_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetEvent" ADD CONSTRAINT "AssetEvent_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "LandAsset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetEvent" ADD CONSTRAINT "AssetEvent_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
