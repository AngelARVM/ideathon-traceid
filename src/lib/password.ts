// Sin `server-only`: lo usa también el seed, que corre fuera de Next.
import { hash, verify } from "@node-rs/argon2";

// argon2id con los parámetros por defecto de @node-rs/argon2 (19 MiB, t=2, p=1, OWASP).
export const hashPassword = (password: string): Promise<string> =>
  hash(password);

export const verifyPassword = ({
  hash: stored,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> => verify(stored, password);
