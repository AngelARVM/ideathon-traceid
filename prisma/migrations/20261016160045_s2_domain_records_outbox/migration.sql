-- CreateEnum
CREATE TYPE "animal_species" AS ENUM ('bovine');

-- CreateEnum
CREATE TYPE "chain_status" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "identifier_kind" AS ENUM ('senasa_cii', 'senasa_printed', 'internal_tag', 'unknown_format');

-- CreateEnum
CREATE TYPE "record_type" AS ENUM ('registration', 'weighing', 'vaccination', 'deworming', 'feeding', 'movement', 'sale', 'slaughterhouse_delivery', 'death', 'other', 'rectification');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('pending', 'submitted', 'confirmed', 'failed');

-- CreateTable
CREATE TABLE "animals" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "species" "animal_species" NOT NULL DEFAULT 'bovine',
    "birth_date" DATE,
    "current_lot_id" TEXT,
    "chain_status" "chain_status" NOT NULL DEFAULT 'open',
    "record_count" INTEGER NOT NULL DEFAULT 0,
    "last_content_hash" BYTEA,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_identifiers" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "identifierKind" "identifier_kind" NOT NULL,
    "detected_format" TEXT,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replaced_at" TIMESTAMPTZ(6),
    "replacement_reason" TEXT,

    CONSTRAINT "animal_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_lot_history" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "moved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moved_by" TEXT NOT NULL,

    CONSTRAINT "animal_lot_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "records" (
    "record_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "type" "record_type" NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,
    "terminal" BOOLEAN NOT NULL DEFAULT false,
    "rectifies_record_id" TEXT,
    "data" JSONB NOT NULL,
    "canonical_payload" TEXT NOT NULL,
    "content_hash" BYTEA NOT NULL,
    "seq" INTEGER,
    "prev_hash" BYTEA,
    "status" "submission_status" NOT NULL DEFAULT 'pending',
    "tx_hash" TEXT,
    "ledger" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "records_pkey" PRIMARY KEY ("record_id")
);

-- CreateTable
CREATE TABLE "outbox" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "status" "submission_status" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ(6),
    "settled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "animals_org_id_idx" ON "animals"("org_id");

-- CreateIndex
CREATE INDEX "animals_current_lot_id_idx" ON "animals"("current_lot_id");

-- CreateIndex
CREATE INDEX "animal_identifiers_org_id_identifier_idx" ON "animal_identifiers"("org_id", "identifier");

-- CreateIndex
CREATE INDEX "animal_identifiers_animal_id_idx" ON "animal_identifiers"("animal_id");

-- CreateIndex
CREATE UNIQUE INDEX "animal_identifiers_one_active_per_animal_uq" ON "animal_identifiers"("animal_id") WHERE ("replaced_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "animal_identifiers_active_value_per_org_uq" ON "animal_identifiers"("org_id", "identifier") WHERE ("replaced_at" IS NULL);

-- CreateIndex
CREATE INDEX "animal_lot_history_animal_id_moved_at_idx" ON "animal_lot_history"("animal_id", "moved_at");

-- CreateIndex
CREATE INDEX "animal_lot_history_lot_id_idx" ON "animal_lot_history"("lot_id");

-- CreateIndex
CREATE INDEX "records_animal_id_created_at_idx" ON "records"("animal_id", "created_at");

-- CreateIndex
CREATE INDEX "records_status_idx" ON "records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "records_animal_seq_uq" ON "records"("animal_id", "seq") WHERE ("seq" IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "outbox_record_id_key" ON "outbox"("record_id");

-- CreateIndex
CREATE INDEX "outbox_status_next_attempt_at_idx" ON "outbox"("status", "next_attempt_at");

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_current_lot_id_fkey" FOREIGN KEY ("current_lot_id") REFERENCES "lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_identifiers" ADD CONSTRAINT "animal_identifiers_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_lot_history" ADD CONSTRAINT "animal_lot_history_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_lot_history" ADD CONSTRAINT "animal_lot_history_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_lot_history" ADD CONSTRAINT "animal_lot_history_moved_by_fkey" FOREIGN KEY ("moved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_rectifies_record_id_fkey" FOREIGN KEY ("rectifies_record_id") REFERENCES "records"("record_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox" ADD CONSTRAINT "outbox_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "records"("record_id") ON DELETE CASCADE ON UPDATE CASCADE;
