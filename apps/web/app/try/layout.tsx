/**
 * Layout for public trial routes
 * No authentication required
 */
export default function TryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}
