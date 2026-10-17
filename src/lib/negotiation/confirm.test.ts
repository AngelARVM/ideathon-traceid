// Tests con base local de la confirmación atómica (§8.3). Crean y borran sus propios datos, así
// que no tocan el fixture de demo. Se saltean si `DATABASE_URL` no apunta a localhost.

import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createPrismaClient } from "@/db/client";
import type { ProposalStatus } from "@/generated/prisma/enums";
import { newId } from "@/lib/ids";
import { ConfirmError, confirmProposalTx } from "./confirm";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin .env.local se usa el entorno tal cual.
}

const url = process.env.DATABASE_URL;
const local =
  !!url && ["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname);

describe("confirmProposalTx (base local)", { skip: !local }, () => {
  const db = local ? createPrismaClient() : (undefined as never);
  const run = `t-${newId()}`;
  const sellerId = `${run}-seller`;
  const buyerId = `${run}-buyer`;
  const otherBuyerId = `${run}-other`;

  before(async () => {
    await db.user.createMany({
      data: [
        {
          id: sellerId,
          name: "Test vendedor",
          role: "seller",
          localityId: "mercedes",
        },
        {
          id: buyerId,
          name: "Test comprador",
          role: "buyer",
          localityId: "bella-vista",
        },
        {
          id: otherBuyerId,
          name: "Test otro",
          role: "buyer",
          localityId: "obera",
        },
      ],
    });
  });

  after(async () => {
    const own = { startsWith: run };
    await db.agreement.deleteMany({ where: { offerId: own } });
    await db.proposal.deleteMany({ where: { offerId: own } });
    await db.offer.deleteMany({ where: { id: own } });
    await db.user.deleteMany({ where: { id: own } });
    await db.$disconnect();
  });

  async function fixture(opts: {
    stock: string;
    quantity: string;
    offerStatus?: "available" | "estimated";
    status?: ProposalStatus;
  }) {
    const offerId = `${run}-offer-${newId()}`;
    await db.offer.create({
      data: {
        id: offerId,
        sellerId,
        title: "Cascarilla de prueba",
        category: "cascarilla_arroz",
        description: "Fixture de test",
        quantityTons: opts.stock,
        pricePerTon: "28500",
        status: opts.offerStatus ?? "available",
        estimatedDate:
          opts.offerStatus === "estimated" ? new Date("2027-05-01") : null,
        localityId: "mercedes",
        humidityPct: "10.8",
        hasWeighbridge: true,
      },
    });
    const proposalId = newId();
    await db.proposal.create({
      data: {
        id: proposalId,
        offerId,
        buyerId,
        quantityTons: opts.quantity,
        pricePerTon: "26000",
        status: opts.status ?? "accepted",
      },
    });
    return { offerId, proposalId };
  }

  const confirm = (actor: string, proposalId: string, comment?: string) =>
    db.$transaction((tx) => confirmProposalTx(tx, actor, proposalId, comment));

  const stockOf = async (offerId: string) =>
    String(
      (await db.offer.findUniqueOrThrow({ where: { id: offerId } }))
        .quantityTons,
    );

  const statusOf = async (proposalId: string) =>
    (await db.proposal.findUniqueOrThrow({ where: { id: proposalId } })).status;

  test("stock insuficiente rechaza y no descuenta", async () => {
    const { offerId, proposalId } = await fixture({
      stock: "50",
      quantity: "80",
    });

    await assert.rejects(confirm(buyerId, proposalId), (e) => {
      assert.ok(e instanceof ConfirmError);
      assert.equal(e.message, "Stock insuficiente: quedan 50 Tn");
      return true;
    });
    assert.equal(await stockOf(offerId), "50");
    assert.equal(await statusOf(proposalId), "accepted");
    assert.equal(await db.agreement.count({ where: { proposalId } }), 0);
  });

  test("una oferta estimada rechaza", async () => {
    const { offerId, proposalId } = await fixture({
      stock: "300",
      quantity: "80",
      offerStatus: "estimated",
    });

    await assert.rejects(confirm(buyerId, proposalId), (e) => {
      assert.ok(e instanceof ConfirmError);
      assert.match(e.message, /^La oferta todavía es estimada/);
      return true;
    });
    assert.equal(await stockOf(offerId), "300");
    assert.equal(await statusOf(proposalId), "accepted");
  });

  test("dos confirmaciones concurrentes generan un solo acuerdo y descuentan una vez", async () => {
    const { offerId, proposalId } = await fixture({
      stock: "650",
      quantity: "80",
    });

    const results = await Promise.allSettled([
      confirm(buyerId, proposalId),
      confirm(buyerId, proposalId),
    ]);

    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const failed = results.filter((r) => r.status === "rejected");
    assert.equal(failed.length, 1);
    assert.ok(failed[0].reason instanceof ConfirmError);
    assert.equal(await db.agreement.count({ where: { proposalId } }), 1);
    assert.equal(await stockOf(offerId), "570");
    assert.equal(await statusOf(proposalId), "confirmed");
  });

  test("otro comprador es rechazado", async () => {
    const { offerId, proposalId } = await fixture({
      stock: "650",
      quantity: "80",
    });

    await assert.rejects(confirm(otherBuyerId, proposalId), (e) => {
      assert.ok(e instanceof ConfirmError);
      assert.equal(e.message, "La propuesta ya no se puede confirmar.");
      return true;
    });
    assert.equal(await stockOf(offerId), "650");
    assert.equal(await statusOf(proposalId), "accepted");
  });

  test("el acuerdo conserva sus términos después de editar la oferta", async () => {
    const { offerId, proposalId } = await fixture({
      stock: "650",
      quantity: "80",
      status: "countered",
    });
    await db.proposal.update({
      where: { id: proposalId },
      data: { counterPricePerTon: "27500" },
    });

    const { agreementId } = await confirm(
      buyerId,
      proposalId,
      "Retiramos el lunes con camión propio",
    );
    await db.offer.update({
      where: { id: offerId },
      data: {
        title: "Título editado",
        pricePerTon: "99999",
        humidityPct: "20",
        hasWeighbridge: false,
      },
    });

    const a = await db.agreement.findUniqueOrThrow({
      where: { id: agreementId },
    });
    assert.equal(a.offerTitle, "Cascarilla de prueba");
    assert.equal(String(a.quantityTons), "80");
    assert.equal(String(a.pricePerTon), "27500");
    assert.equal(String(a.totalAmount), "2200000");
    assert.equal(String(a.humidityPct), "10.8");
    assert.equal(a.hasWeighbridge, true);
    assert.equal(a.originLocality, "Mercedes");
    assert.equal(a.closingComment, "Retiramos el lunes con camión propio");
  });
});
