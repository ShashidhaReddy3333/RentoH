export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await import("../auth").then(({ requireAuth }) => requireAuth());
  
  return children;
}