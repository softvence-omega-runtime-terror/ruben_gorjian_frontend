/**
 * Utility functions for handling "return to last page" redirects
 * with security validation to prevent open redirect vulnerabilities.
 */

const MAX_RETURN_TO_LENGTH = 2048;
const RETURN_TO_COOKIE_NAME = "talexia_return_to";
const RETURN_TO_COOKIE_MAX_AGE = 30 * 60; // 30 minutes

/**
 * Validates a returnTo URL to prevent open redirect attacks.
 * Only allows same-origin relative paths.
 * 
 * @param input - The returnTo value to validate
 * @returns The validated safe path, or null if invalid
 */
export function validateReturnTo(input: string | null | undefined): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  // Check length
  if (input.length > MAX_RETURN_TO_LENGTH) {
    return null;
  }

  // Decode URL-encoded input
  let decoded: string;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    return null;
  }

  // Must start with "/" (relative path)
  if (!decoded.startsWith("/")) {
    return null;
  }

  // Reject protocol-relative URLs (//example.com)
  if (decoded.startsWith("//")) {
    return null;
  }

  // Reject absolute URLs (http://, https://)
  const lower = decoded.toLowerCase();
  if (lower.includes("http://") || lower.includes("https://")) {
    return null;
  }

  // Reject encoded protocols (%2F%2F, %68%74%74%70, etc.)
  const encodedLower = input.toLowerCase();
  if (
    encodedLower.includes("%2f%2f") ||
    encodedLower.includes("%68%74%74%70") ||
    encodedLower.includes("javascript:") ||
    encodedLower.includes("data:")
  ) {
    return null;
  }

  // Reject auth pages to prevent loops
  if (decoded.startsWith("/login") || decoded.startsWith("/signup")) {
    return null;
  }

  // Allow the path (will be validated again on use)
  return decoded;
}

/**
 * Gets returnTo from query params, validates it, and returns safe value or default.
 */
export function getReturnToFromQuery(
  searchParams: URLSearchParams,
  defaultValue: string = "/dashboard"
): string {
  const returnTo = searchParams.get("returnTo") || searchParams.get("redirect"); // backward compat
  const validated = validateReturnTo(returnTo);
  return validated || defaultValue;
}

/**
 * Gets returnTo from cookie, validates it, and returns safe value or null.
 */
export function getReturnToFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const returnToCookie = cookies.find((c) => c.startsWith(`${RETURN_TO_COOKIE_NAME}=`));
  
  if (!returnToCookie) return null;

  const value = returnToCookie.split("=")[1];
  if (!value) return null;

  // Decode cookie value
  try {
    const decoded = decodeURIComponent(value);
    return validateReturnTo(decoded);
  } catch {
    return null;
  }
}

/**
 * Sets returnTo in a cookie (for OAuth persistence).
 * Returns the cookie string to set.
 */
export function setReturnToCookie(returnTo: string): string {
  const validated = validateReturnTo(returnTo);
  if (!validated) {
    return `${RETURN_TO_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
  }

  const encoded = encodeURIComponent(validated);
  const secure = typeof process !== "undefined" && process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${RETURN_TO_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${RETURN_TO_COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly${secure}`;
}

/**
 * Clears the returnTo cookie.
 */
export function clearReturnToCookie(): string {
  return `${RETURN_TO_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
}

