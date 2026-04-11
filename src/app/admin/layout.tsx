import { SessionProvider } from "next-auth/react";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: "Admin — Carol & João",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
