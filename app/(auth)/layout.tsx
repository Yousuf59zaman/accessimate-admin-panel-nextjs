import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  CITIZEN_SESSION_COOKIE,
} from "@/app/lib/auth/constants";

export default async function GuestRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  if (cookieStore.has(ADMIN_SESSION_COOKIE)) redirect("/admin-panel");
  if (cookieStore.has(CITIZEN_SESSION_COOKIE)) redirect("/dashboard");
  return children;
}
