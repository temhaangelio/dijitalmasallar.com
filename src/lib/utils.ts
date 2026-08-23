import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Accepts any RFC 4122 UUID layout. Rejects the loose `[0-9a-f-]{36}` shapes that let stray dashes through. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}
