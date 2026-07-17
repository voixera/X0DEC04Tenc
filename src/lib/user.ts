const USER_ID_STORAGE_KEY = "x0dec04t_user_id";
const FALLBACK_USER_ID = "anonymous";

export function normalizeUserId(value: FormDataEntryValue | string | null | undefined): string {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw) {
    return FALLBACK_USER_ID;
  }

  return raw.replace(/[^a-zA-Z0-9._:-]/g, "_").slice(0, 128) || FALLBACK_USER_ID;
}

function createUserId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 14);

  return `user_${random}`;
}

export function getClientUserId(): string {
  if (typeof window === "undefined") {
    return FALLBACK_USER_ID;
  }

  try {
    const existing = normalizeUserId(window.localStorage.getItem(USER_ID_STORAGE_KEY));
    if (existing !== FALLBACK_USER_ID) {
      return existing;
    }

    const next = createUserId();
    window.localStorage.setItem(USER_ID_STORAGE_KEY, next);
    return next;
  } catch {
    return FALLBACK_USER_ID;
  }
}
