/**
 * API Client
 * Re-exports API helper functions from api.ts
 * This file exists for compatibility with components that import from @/lib/api-client
 */
export { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./api";
