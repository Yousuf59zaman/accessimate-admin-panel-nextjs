import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CITIZEN_SESSION_COOKIE } from "@/app/lib/auth/constants";

export default async function CitizenRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  if (!cookieStore.has(CITIZEN_SESSION_COOKIE)) redirect("/login");
  return children;
}
