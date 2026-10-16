// Datos operativos de demo: organizaciones, usuarios, membresías, establecimientos y lotes.
// Uso: npm run db:seed [-- --reset] [-- --allow-remote]
//
// Las contraseñas son fixtures de demo, no secretos (docs/07). Por eso el script se niega a
// correr contra una base que no sea local salvo con --allow-remote.

import { createPrismaClient } from "../src/db/client";
import type { MembershipRole as Role } from "../src/generated/prisma/enums";
import { newId } from "../src/lib/ids";
import { hashPassword } from "../src/lib/password";

const DEMO_PASSWORD = "demo1234";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const args = new Set(process.argv.slice(2));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL no está definida (copiá .env.example a .env.local).",
  );
  process.exit(1);
}
if (!LOCAL_HOSTS.has(new URL(url).hostname) && !args.has("--allow-remote")) {
  console.error(
    `Negado: DATABASE_URL apunta a "${new URL(url).hostname}", que no es local.\n` +
      "El seed crea usuarios con contraseñas conocidas. Usá --allow-remote si es intencional.",
  );
  process.exit(1);
}

const db = createPrismaClient(url);

const orgA = { id: newId(), name: "La Esperanza Agropecuaria (demo)" };
const orgB = { id: newId(), name: "Estancia San Roque (demo)" };

const demoUsers: { email: string; name: string; org: string; role: Role }[] = [
  {
    email: "owner@demo.local",
    name: "Titular Demo",
    org: orgA.id,
    role: "owner",
  },
  {
    email: "vet@demo.local",
    name: "Profesional Demo",
    org: orgA.id,
    role: "professional",
  },
  {
    email: "operator@demo.local",
    name: "Operador Demo",
    org: orgA.id,
    role: "operator",
  },
  // Usuario de otra organización: sirve para el caso de escritura cruzada (docs/09, caso 2).
  {
    email: "other-org@demo.local",
    name: "Titular San Roque",
    org: orgB.id,
    role: "owner",
  },
];

const estEsperanza = {
  id: newId(),
  orgId: orgA.id,
  name: "La Esperanza",
  publicLabel: "Est. La Esperanza",
  officialCode: "22.012.0.00456/00",
  address: "Ruta Provincial 5 km 42, Chaco",
  notes: "Establecimiento principal de la demo.",
};
const estOmbu = {
  id: newId(),
  orgId: orgA.id,
  name: "El Ombú",
  publicLabel: "Est. El Ombú",
  officialCode: "22.012.0.00789/00",
};
const estSanRoque = {
  id: newId(),
  orgId: orgB.id,
  name: "San Roque",
  publicLabel: "Est. San Roque",
  officialCode: "18.004.0.01234/00",
};

const demoLots = [
  {
    establishmentId: estEsperanza.id,
    orgId: orgA.id,
    name: "Recría 2025",
    publicLabel: "Recría 2025",
  },
  {
    establishmentId: estEsperanza.id,
    orgId: orgA.id,
    name: "Vaquillonas",
    publicLabel: "Vaquillonas",
  },
  {
    establishmentId: estOmbu.id,
    orgId: orgA.id,
    name: "Invernada",
    publicLabel: "Invernada",
  },
  {
    establishmentId: estSanRoque.id,
    orgId: orgB.id,
    name: "Rodeo general",
    publicLabel: "Rodeo general",
  },
];

async function main() {
  const existing = await db.user.findFirst({ select: { id: true } });
  if (existing && !args.has("--reset")) {
    console.log(
      "La base ya tiene datos. Usá `npm run db:seed -- --reset` para volver a sembrar.",
    );
    return;
  }

  // Un hash (y una sal) por usuario, calculados fuera de la transacción.
  const hashes = await Promise.all(
    demoUsers.map(() => hashPassword(DEMO_PASSWORD)),
  );

  await db.$transaction(async (tx) => {
    if (args.has("--reset")) {
      // Orden inverso a las FK. Sesiones, cuentas y membresías caen en cascada.
      await tx.lot.deleteMany();
      await tx.establishment.deleteMany();
      await tx.organization.deleteMany();
      await tx.user.deleteMany();
      await tx.verification.deleteMany();
    }

    await tx.organization.createMany({ data: [orgA, orgB] });

    for (const [i, u] of demoUsers.entries()) {
      const userId = newId();
      await tx.user.create({
        data: {
          id: userId,
          email: u.email,
          name: u.name,
          emailVerified: true,
          // Misma forma que crea Better Auth para email/contraseña.
          accounts: {
            create: {
              id: newId(),
              accountId: userId,
              providerId: "credential",
              password: hashes[i],
            },
          },
          memberships: { create: { orgId: u.org, role: u.role } },
        },
      });
    }

    await tx.establishment.createMany({
      data: [estEsperanza, estOmbu, estSanRoque],
    });
    await tx.lot.createMany({ data: demoLots });
  });

  console.log(
    "Seed listo. Usuarios de demo (contraseña para todos: %s):",
    DEMO_PASSWORD,
  );
  console.table(
    demoUsers.map((u) => ({
      email: u.email,
      rol: u.role,
      organización: u.org === orgA.id ? orgA.name : orgB.name,
    })),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
