-- SubMarket: dropea el esquema legado de TraceID y crea el del MVP (docs/00-mvp-spec.md §6).
-- CreateEnum
CREATE TYPE "Province" AS ENUM ('corrientes', 'misiones', 'chaco');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('buyer', 'seller');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('cascarilla_arroz', 'chips_forestales', 'aserrin_virutas', 'biomasa_pellets', 'orujos_bagazos');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('available', 'estimated', 'withdrawn');

-- CreateEnum
CREATE TYPE "Presentation" AS ENUM ('granel', 'big_bag', 'fardos');

-- CreateEnum
CREATE TYPE "Freight" AS ENUM ('retiro_en_planta', 'entrega_vendedor', 'a_convenir');

-- CreateEnum
CREATE TYPE "DemandStatus" AS ENUM ('open', 'withdrawn');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('pending', 'accepted', 'countered', 'rejected', 'confirmed');

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "animal_identifiers" DROP CONSTRAINT "animal_identifiers_animal_id_fkey";

-- DropForeignKey
ALTER TABLE "animal_lot_history" DROP CONSTRAINT "animal_lot_history_animal_id_fkey";

-- DropForeignKey
ALTER TABLE "animal_lot_history" DROP CONSTRAINT "animal_lot_history_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "animal_lot_history" DROP CONSTRAINT "animal_lot_history_moved_by_fkey";

-- DropForeignKey
ALTER TABLE "animals" DROP CONSTRAINT "animals_current_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "animals" DROP CONSTRAINT "animals_org_id_fkey";

-- DropForeignKey
ALTER TABLE "establishments" DROP CONSTRAINT "establishments_org_id_fkey";

-- DropForeignKey
ALTER TABLE "lots" DROP CONSTRAINT "lots_establishment_id_fkey";

-- DropForeignKey
ALTER TABLE "lots" DROP CONSTRAINT "lots_org_id_fkey";

-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_org_id_fkey";

-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_user_id_fkey";

-- DropForeignKey
ALTER TABLE "outbox" DROP CONSTRAINT "outbox_record_id_fkey";

-- DropForeignKey
ALTER TABLE "records" DROP CONSTRAINT "records_animal_id_fkey";

-- DropForeignKey
ALTER TABLE "records" DROP CONSTRAINT "records_author_id_fkey";

-- DropForeignKey
ALTER TABLE "records" DROP CONSTRAINT "records_org_id_fkey";

-- DropForeignKey
ALTER TABLE "records" DROP CONSTRAINT "records_rectifies_record_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropTable
-- `users` se recrea en vez de alterarse: las filas legadas no tienen rol ni localidad (D13).
DROP TABLE "users";

-- DropTable
DROP TABLE "accounts";

-- DropTable
DROP TABLE "animal_identifiers";

-- DropTable
DROP TABLE "animal_lot_history";

-- DropTable
DROP TABLE "animals";

-- DropTable
DROP TABLE "establishments";

-- DropTable
DROP TABLE "lots";

-- DropTable
DROP TABLE "memberships";

-- DropTable
DROP TABLE "organizations";

-- DropTable
DROP TABLE "outbox";

-- DropTable
DROP TABLE "records";

-- DropTable
DROP TABLE "sessions";

-- DropTable
DROP TABLE "verifications";

-- DropEnum
DROP TYPE "animal_species";

-- DropEnum
DROP TYPE "chain_status";

-- DropEnum
DROP TYPE "identifier_kind";

-- DropEnum
DROP TYPE "membership_role";

-- DropEnum
DROP TYPE "record_type";

-- DropEnum
DROP TYPE "submission_status";

-- CreateTable
CREATE TABLE "localities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" "Province" NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "localities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "role" "Role" NOT NULL,
    "locality_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity_tons" DECIMAL(12,3) NOT NULL,
    "price_per_ton" DECIMAL(14,2),
    "status" "OfferStatus" NOT NULL,
    "estimated_date" DATE,
    "locality_id" TEXT NOT NULL,
    "humidity_pct" DECIMAL(5,2),
    "calorific_kcal_kg" INTEGER,
    "presentation" "Presentation",
    "freight" "Freight" NOT NULL DEFAULT 'a_convenir',
    "has_weighbridge" BOOLEAN NOT NULL DEFAULT false,
    "lab_analysis" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demands" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "description" TEXT,
    "quantity_tons" DECIMAL(12,3) NOT NULL,
    "max_price_per_ton" DECIMAL(14,2),
    "needed_by" DATE,
    "radius_km" INTEGER NOT NULL DEFAULT 200,
    "locality_id" TEXT NOT NULL,
    "status" "DemandStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "quantity_tons" DECIMAL(12,3) NOT NULL,
    "price_per_ton" DECIMAL(14,2) NOT NULL,
    "message" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'pending',
    "counter_quantity_tons" DECIMAL(12,3),
    "counter_price_per_ton" DECIMAL(14,2),
    "counter_message" TEXT,
    "responded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreements" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "quantity_tons" DECIMAL(12,3) NOT NULL,
    "price_per_ton" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(16,2) NOT NULL,
    "offer_title" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "origin_locality" TEXT NOT NULL,
    "humidity_pct" DECIMAL(5,2),
    "calorific_kcal_kg" INTEGER,
    "presentation" "Presentation",
    "freight" "Freight" NOT NULL,
    "has_weighbridge" BOOLEAN NOT NULL,
    "lab_analysis" TEXT,
    "closing_comment" TEXT,
    "confirmed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offers_status_category_idx" ON "offers"("status", "category");

-- CreateIndex
CREATE INDEX "demands_status_category_idx" ON "demands"("status", "category");

-- CreateIndex
CREATE INDEX "proposals_offer_id_status_idx" ON "proposals"("offer_id", "status");

-- CreateIndex
CREATE INDEX "proposals_buyer_id_status_idx" ON "proposals"("buyer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "agreements_proposal_id_key" ON "agreements"("proposal_id");

-- CreateIndex
CREATE INDEX "agreements_seller_id_idx" ON "agreements"("seller_id");

-- CreateIndex
CREATE INDEX "agreements_buyer_id_idx" ON "agreements"("buyer_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_locality_id_fkey" FOREIGN KEY ("locality_id") REFERENCES "localities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_locality_id_fkey" FOREIGN KEY ("locality_id") REFERENCES "localities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demands" ADD CONSTRAINT "demands_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demands" ADD CONSTRAINT "demands_locality_id_fkey" FOREIGN KEY ("locality_id") REFERENCES "localities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

