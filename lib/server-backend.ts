<<<<<<< HEAD
import { cookies } from "next/headers"
=======
import { cookies } from "next/headers";
>>>>>>> 7ff57f1 (api set the submission)

const backendUrl = process.env.BACKEND_API_URL;

export function getBackendUrl() {
  if (!backendUrl) {
    throw new Error("BACKEND_API_URL is not configured");
  }
  return backendUrl.replace(/\/$/, "");
<<<<<<< HEAD
<<<<<<< HEAD
}

export async function getBackendHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  return {
    "Content-Type": "application/json",
    ...(token ? { Cookie: `token=${token}` } : {}),
  }
}
=======
};

/**
 * Common headers for backend requests:
 * - ngrok-skip-browser-warning for dev bypass
 * - forwarding browser cookies for auth
 */
const getBackendHeaders = async () => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore ? cookieStore.toString() : "";
  
  return {
    "ngrok-skip-browser-warning": "true",
    ...(cookieHeader ? { cookie: cookieHeader } : {}),
  };
};

export { getBackendUrl, getBackendHeaders };
>>>>>>> 7ff57f1 (api set the submission)
=======
}

export async function getBackendHeaders(): Promise<Record<string, string>> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore ? cookieStore.toString() : "";
    const headers: Record<string, string> = {
      "ngrok-skip-browser-warning": "true",
    };
    if (cookieHeader) {
      headers.cookie = cookieHeader;
    }
    return headers;
  } catch {
    return { "ngrok-skip-browser-warning": "true" };
  }
}
>>>>>>> 859ff39 (updated)
