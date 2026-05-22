// Customer portal
export async function getCustomerPortalUrl(): Promise<string | null> {
  const res = await fetch("/api/billing/portal", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Unable to open billing portal");
  }
  const data = await res.json();
  return data.url || null;
}
