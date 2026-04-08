/**
 * Validates and sanitizes storage keys to prevent path traversal attacks
 * Storage keys should:
 * - Not contain path traversal sequences (../, ..\\)
 * - Not start with / or \
 * - Not contain null bytes
 * - Only contain alphanumeric, hyphens, underscores, dots, and forward slashes
 * - Not exceed reasonable length (512 chars)
 */
export function sanitizeStorageKey(key: string | null | undefined): string | null {
  if (!key || typeof key !== "string") {
    return null;
  }

  // Remove leading/trailing whitespace
  const trimmed = key.trim();

  // Check for empty string
  if (trimmed.length === 0) {
    return null;
  }

  // Check length
  if (trimmed.length > 512) {
    console.error("Storage key exceeds maximum length");
    return null;
  }

  // Check for path traversal sequences
  if (trimmed.includes("..") || trimmed.includes("../") || trimmed.includes("..\\")) {
    console.error("Storage key contains invalid path traversal sequences");
    return null;
  }

  // Check for null bytes
  if (trimmed.includes("\0")) {
    console.error("Storage key contains null bytes");
    return null;
  }

  // Check for absolute paths (leading slash)
  if (trimmed.startsWith("/") || trimmed.startsWith("\\")) {
    console.error("Storage key cannot start with / or \\");
    return null;
  }

  // Avoid control characters; we will URL-encode path segments to handle spaces/special chars
  const controlChars = /[\u0000-\u001F\u007F]/;
  if (controlChars.test(trimmed)) {
    console.error("Storage key contains control characters");
    return null;
  }

  // Normalize: remove multiple consecutive slashes
  const normalized = trimmed.replace(/\/+/g, "/");

  return normalized;
}

/**
 * Validates a storage key and constructs a safe URL
 * Returns null if the storage key is invalid
 */
export function buildStorageUrl(
  baseUrl: string,
  storageKey: string | null | undefined
): string | null {
  if (!storageKey) {
    return null;
  }

  const sanitized = sanitizeStorageKey(storageKey);
  if (!sanitized) {
    return null;
  }

  // Ensure baseUrl doesn't end with slash and storageKey doesn't start with slash
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanKey = sanitized.replace(/^\/+/, "");
  const encodedKey = cleanKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${cleanBase}/${encodedKey}`;
}


