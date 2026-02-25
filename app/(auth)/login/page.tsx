import type { Metadata } from "next";
import CitizenLogin from "@/app/components/auth/CitizenLogin";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to Accessimate",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      <CitizenLogin />
    </div>
  );
}
