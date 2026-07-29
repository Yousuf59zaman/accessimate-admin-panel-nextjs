import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE } from "@/app/lib/auth/constants";

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  if (!cookieStore.has(ADMIN_SESSION_COOKIE)) {
    redirect("/admin-login");
  }
  return children;
}
