"use client";

import { useActionState, useState } from "react";
import { NewIdField } from "@/components/NewIdField";
import { type ActionState, createAnimalAction } from "../actions";
import {
  FormError,
  field,
  label,
  personalDataHint,
  SubmitButton,
} from "../form-ui";

interface Option {
  id: string;
  orgId: string;
  name: string;
  publicLabel: string;
}

export function NewAnimalForm({
  memberships,
  establishments,
  lots,
}: {
  memberships: { orgId: string; orgName: string }[];
  establishments: Option[];
  lots: (Option & { establishmentId: string })[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createAnimalAction,
    {},
  );
  const [orgId, setOrgId] = useState(memberships[0]?.orgId ?? "");
  const [establishmentId, setEstablishmentId] = useState(
    establishments.find((e) => e.orgId === memberships[0]?.orgId)?.id ?? "",
  );

  const orgEstablishments = establishments.filter((e) => e.orgId === orgId);
  const orgLots = lots.filter((l) => l.establishmentId === establishmentId);

  return (
    <form action={action} className="mt-6 space-y-5">
      {/* Los dos ULIDs los genera el cliente: el del animal es la clave de la cadena. */}
      <NewIdField name="animalId" />
      <NewIdField name="recordId" />

      <FormError state={state} />

      {memberships.length > 1 ? (
        <div>
          <label htmlFor="orgId" className={label}>
            Organización
          </label>
          <select
            id="orgId"
            name="orgId"
            value={orgId}
            onChange={(e) => {
              setOrgId(e.target.value);
              setEstablishmentId(
                establishments.find((x) => x.orgId === e.target.value)?.id ??
                  "",
              );
            }}
            className={field}
          >
            {memberships.map((m) => (
              <option key={m.orgId} value={m.orgId}>
                {m.orgName}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="orgId" value={orgId} />
      )}

      <div>
        <label htmlFor="identifier" className={label}>
          Identificador de la caravana
        </label>
        <input
          id="identifier"
          name="identifier"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="032 02 1234567890"
          className={`${field} font-mono-num`}
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Se guarda como texto, con los ceros a la izquierda. Si el formato no
          coincide con el CII de 15 dígitos ni con la caravana impresa, se
          guarda igual y queda marcado.
        </p>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" name="internalTag" className="rounded" />
          Es una caravana interna, no un identificador oficial
        </label>
      </div>

      <div>
        <label htmlFor="establishmentId" className={label}>
          Establecimiento
        </label>
        <select
          id="establishmentId"
          name="establishmentId"
          value={establishmentId}
          onChange={(e) => setEstablishmentId(e.target.value)}
          required
          className={field}
        >
          {orgEstablishments.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Al hito público solo va su etiqueta, nunca la dirección.
        </p>
      </div>

      <div>
        <label htmlFor="lotId" className={label}>
          Lote <span className="font-normal text-stone-500">(opcional)</span>
        </label>
        <select id="lotId" name="lotId" className={field} defaultValue="">
          <option value="">Sin lote</option>
          {orgLots.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="initialDiet" className={label}>
          Dieta base
        </label>
        <input
          id="initialDiet"
          name="initialDiet"
          required
          maxLength={200}
          placeholder="Pastura natural con suplemento mineral"
          className={field}
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Obligatoria: así todo animal tiene siempre una dieta declarada. Los
          hitos de dieta posteriores registran solo los cambios.{" "}
          {personalDataHint}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="birthDate" className={label}>
            Fecha de nacimiento{" "}
            <span className="font-normal text-stone-500">(opcional)</span>
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="occurredAt" className={label}>
            Fecha del alta
          </label>
          <input
            id="occurredAt"
            name="occurredAt"
            type="datetime-local"
            required
            defaultValue={new Date(
              Date.now() - new Date().getTimezoneOffset() * 60_000,
            )
              .toISOString()
              .slice(0, 16)}
            className={field}
          />
        </div>
      </div>

      <SubmitButton pending={pending}>Registrar animal</SubmitButton>
    </form>
  );
}
