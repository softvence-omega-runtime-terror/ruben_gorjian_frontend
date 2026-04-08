/**
 * Safely gets an environment variable with proper validation
 * Returns undefined if not set or empty, rather than an empty string
 * This prevents subtle bugs from empty string fallbacks
 */
export function getEnvVar(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  return value;
}

/**
 * Gets an environment variable with a default value
 * Only uses the default if the env var is undefined or empty
 */
export function getEnvVarWithDefault(key: string, defaultValue: string): string {
  return getEnvVar(key) ?? defaultValue;
}

/**
 * Gets a required environment variable
 * Throws an error if not set or empty
 */
export function getRequiredEnvVar(key: string): string {
  const value = getEnvVar(key);
  if (value === undefined) {
    throw new Error(`Required environment variable ${key} is not set or is empty`);
  }
  return value;
}



