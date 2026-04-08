/**
 * Admin Login Layout
 * Bypasses the main AdminLayout to prevent redirect loops
 */
export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
