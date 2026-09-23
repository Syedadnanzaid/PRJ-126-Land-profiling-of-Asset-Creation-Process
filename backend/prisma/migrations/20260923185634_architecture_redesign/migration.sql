-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'APPLICANT', 'VERIFICATION_OFFICER', 'APPROVING_AUTHORITY');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'VERIFIED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('APPLICATION_CREATED', 'APPLICATION_SUBMITTED', 'DOCUMENT_UPLOADED', 'AI_DUPLICATE_CHECKED', 'REVIEW_STARTED', 'CORRECTION_REQUESTED', 'APPLICATION_RESUBMITTED', 'APPLICATION_VERIFIED', 'APPROVAL_REQUESTED', 'ASSET_APPROVED', 'ASSET_REJECTED', 'ASSET_CORRECTION_REQUESTED', 'ASSET_UPDATED');

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'APPLICANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "LandApplication" (
    "application_id" TEXT NOT NULL,
    "land_id" TEXT,
    "survey_no" TEXT,
    "owner_name" TEXT,
    "area" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "asset_type" TEXT,
    "description" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "applicant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandApplication_pkey" PRIMARY KEY ("application_id")
);

-- CreateTable
CREATE TABLE "LandAsset" (
    "asset_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "land_id" TEXT,
    "survey_no" TEXT,
    "owner_name" TEXT,
    "area" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "asset_type" TEXT,
    "description" TEXT,
    "approved_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandAsset_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "Document" (
    "document_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
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
    "application_id" TEXT NOT NULL,
    "previous_status" "ApplicationStatus",
    "new_status" "ApplicationStatus" NOT NULL,
    "action_by" TEXT NOT NULL,
    "remarks" TEXT,
    "action_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowHistory_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "DuplicateFlag" (
    "flag_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
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
    "application_id" TEXT,
    "asset_id" TEXT,
    "event_type" "EventType" NOT NULL,
    "performed_by" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetEvent_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "LandApplication_survey_no_idx" ON "LandApplication"("survey_no");

-- CreateIndex
CREATE INDEX "LandApplication_owner_name_idx" ON "LandApplication"("owner_name");

-- CreateIndex
CREATE INDEX "LandApplication_applicant_id_idx" ON "LandApplication"("applicant_id");

-- CreateIndex
CREATE INDEX "LandApplication_status_idx" ON "LandApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LandAsset_application_id_key" ON "LandAsset"("application_id");

-- CreateIndex
CREATE INDEX "LandAsset_survey_no_idx" ON "LandAsset"("survey_no");

-- CreateIndex
CREATE INDEX "LandAsset_owner_name_idx" ON "LandAsset"("owner_name");

-- CreateIndex
CREATE INDEX "LandAsset_approved_by_idx" ON "LandAsset"("approved_by");

-- CreateIndex
CREATE INDEX "Document_application_id_idx" ON "Document"("application_id");

-- CreateIndex
CREATE INDEX "Document_uploaded_by_idx" ON "Document"("uploaded_by");

-- CreateIndex
CREATE INDEX "WorkflowHistory_application_id_idx" ON "WorkflowHistory"("application_id");

-- CreateIndex
CREATE INDEX "WorkflowHistory_action_by_idx" ON "WorkflowHistory"("action_by");

-- CreateIndex
CREATE INDEX "DuplicateFlag_application_id_idx" ON "DuplicateFlag"("application_id");

-- CreateIndex
CREATE INDEX "DuplicateFlag_matched_asset_id_idx" ON "DuplicateFlag"("matched_asset_id");

-- CreateIndex
CREATE INDEX "DuplicateFlag_review_status_idx" ON "DuplicateFlag"("review_status");

-- CreateIndex
CREATE INDEX "AssetEvent_application_id_idx" ON "AssetEvent"("application_id");

-- CreateIndex
CREATE INDEX "AssetEvent_asset_id_idx" ON "AssetEvent"("asset_id");

-- CreateIndex
CREATE INDEX "AssetEvent_performed_by_idx" ON "AssetEvent"("performed_by");

-- AddForeignKey
ALTER TABLE "LandApplication" ADD CONSTRAINT "LandApplication_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandAsset" ADD CONSTRAINT "LandAsset_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "LandApplication"("application_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandAsset" ADD CONSTRAINT "LandAsset_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "LandApplication"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "LandApplication"("application_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateFlag" ADD CONSTRAINT "DuplicateFlag_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "LandApplication"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateFlag" ADD CONSTRAINT "DuplicateFlag_matched_asset_id_fkey" FOREIGN KEY ("matched_asset_id") REFERENCES "LandAsset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateFlag" ADD CONSTRAINT "DuplicateFlag_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetEvent" ADD CONSTRAINT "AssetEvent_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "LandApplication"("application_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetEvent" ADD CONSTRAINT "AssetEvent_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "LandAsset"("asset_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetEvent" ADD CONSTRAINT "AssetEvent_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
