import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";

export const defaultEmployeePassword = "1";
export const validEmployeePassword = value =>
  typeof value === "string" && value.trim().length > 0 && Buffer.byteLength(value) <= 72;
export const hashEmployeePassword = value => bcrypt.hash(value, 10);
export const passwordDigest = value => createHash("sha256").update(value).digest("hex");
export const isPasswordHash = value => /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);

export async function matchesEmployeePassword(value, stored) {
  if (!validEmployeePassword(value) || !stored) return false;
  if (isPasswordHash(stored)) return bcrypt.compare(value, stored.replace(/^\$2y\$/, "$2b$"));
  return timingSafeEqual(Buffer.from(passwordDigest(value), "hex"), Buffer.from(passwordDigest(stored), "hex"));
}
