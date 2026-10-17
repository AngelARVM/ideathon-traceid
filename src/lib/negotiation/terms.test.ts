import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { distanceKm } from "@/lib/geo";
import {
  allowedActions,
  confirmBlockReason,
  effectiveTerms,
  totalAmount,
} from "./terms";

const original = {
  quantityTons: "80",
  pricePerTon: "26000",
  counterQuantityTons: null,
  counterPricePerTon: null,
};

describe("effectiveTerms", () => {
  test("sin contraoferta usa los términos originales", () => {
    assert.deepEqual(effectiveTerms(original), {
      quantityTons: "80",
      pricePerTon: "26000",
    });
  });

  test("con contraoferta completa usa los términos de la contraoferta", () => {
    assert.deepEqual(
      effectiveTerms({
        ...original,
        counterQuantityTons: "60",
        counterPricePerTon: "27500",
      }),
      { quantityTons: "60", pricePerTon: "27500" },
    );
  });

  test("con contraoferta solo de precio conserva la cantidad original", () => {
    assert.deepEqual(
      effectiveTerms({ ...original, counterPricePerTon: "27500" }),
      { quantityTons: "80", pricePerTon: "27500" },
    );
  });
});

describe("totalAmount", () => {
  test("guion de demo: 80 Tn × $ 27.500", () => {
    assert.equal(totalAmount("80", "27500"), "2200000.00");
  });

  test("3 decimales de Tn × 2 de precio redondea a 2 decimales", () => {
    // 80,125 × 27.500,55 = 2.203.481,56875
    assert.equal(totalAmount("80.125", "27500.55"), "2203481.57");
  });

  test("redondea la mitad hacia arriba sin errores de float", () => {
    // En float, 1.005 * 1 se redondea a 1.00.
    assert.equal(totalAmount("1.005", "1"), "1.01");
    assert.equal(totalAmount("0.001", "0.01"), "0.00");
  });
});

describe("allowedActions (tabla §8.2)", () => {
  const seller = { id: "s1", role: "seller" as const };
  const buyer = { id: "b1", role: "buyer" as const };
  const offer = {
    sellerId: "s1",
    status: "available" as const,
    quantityTons: "650",
    estimatedDate: null,
  };
  const proposal = (
    status: Parameters<typeof allowedActions>[0]["status"],
  ) => ({
    ...original,
    status,
    buyerId: "b1",
  });

  test("pending: el vendedor dueño acepta, rechaza o contraoferta", () => {
    assert.deepEqual(allowedActions(proposal("pending"), offer, seller), [
      "accept",
      "reject",
      "counter",
    ]);
  });

  test("pending con oferta retirada: el vendedor solo puede rechazar", () => {
    assert.deepEqual(
      allowedActions(
        proposal("pending"),
        { ...offer, status: "withdrawn" },
        seller,
      ),
      ["reject"],
    );
  });

  test("pending: el comprador no tiene acciones", () => {
    assert.deepEqual(allowedActions(proposal("pending"), offer, buyer), []);
  });

  test("accepted: el comprador dueño confirma", () => {
    assert.deepEqual(allowedActions(proposal("accepted"), offer, buyer), [
      "confirm",
    ]);
  });

  test("accepted: el vendedor ya no tiene acciones", () => {
    assert.deepEqual(allowedActions(proposal("accepted"), offer, seller), []);
  });

  test("countered: el comprador dueño acepta o rechaza la contraoferta", () => {
    assert.deepEqual(allowedActions(proposal("countered"), offer, buyer), [
      "confirm",
      "rejectCounter",
    ]);
  });

  test("rejected y confirmed son terminales", () => {
    for (const status of ["rejected", "confirmed"] as const) {
      assert.deepEqual(allowedActions(proposal(status), offer, seller), []);
      assert.deepEqual(allowedActions(proposal(status), offer, buyer), []);
    }
  });

  test("un tercero no tiene acciones", () => {
    assert.deepEqual(
      allowedActions(proposal("pending"), offer, { id: "s2", role: "seller" }),
      [],
    );
    assert.deepEqual(
      allowedActions(proposal("accepted"), offer, { id: "b2", role: "buyer" }),
      [],
    );
  });
});

describe("confirmBlockReason", () => {
  const offer = {
    sellerId: "s1",
    status: "available" as const,
    quantityTons: "650",
    estimatedDate: null,
  };

  test("oferta disponible con stock: se puede confirmar", () => {
    assert.equal(confirmBlockReason(original, offer), null);
  });

  test("oferta estimada: bloquea con la fecha estimada", () => {
    assert.equal(
      confirmBlockReason(original, {
        ...offer,
        status: "estimated",
        estimatedDate: new Date("2027-05-01"),
      }),
      "La oferta todavía es estimada (disponible aprox. 01/05/2027)",
    );
  });

  test("oferta retirada: bloquea", () => {
    assert.equal(
      confirmBlockReason(original, { ...offer, status: "withdrawn" }),
      "La oferta fue retirada",
    );
  });

  test("stock insuficiente: bloquea con el stock restante", () => {
    assert.equal(
      confirmBlockReason(original, { ...offer, quantityTons: "50" }),
      "Stock insuficiente: quedan 50 Tn",
    );
  });

  test("usa la cantidad de la contraoferta", () => {
    assert.equal(
      confirmBlockReason(
        { ...original, counterQuantityTons: "40" },
        { ...offer, quantityTons: "50" },
      ),
      null,
    );
  });
});

describe("distanceKm", () => {
  test("Bella Vista–Corrientes ≈ 118 km", () => {
    const bellaVista = { lat: -28.5096, lng: -59.0434 }; // seed §5
    const corrientes = { lat: -27.4692, lng: -58.8306 };
    assert.equal(distanceKm(bellaVista, corrientes), 118);
  });
});
