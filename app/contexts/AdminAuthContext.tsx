"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { fetchAdmin, XADM_TOKEN } from "@/app/lib/fetchAdmin";

const LOGIN_ENDPOINT = "/admin/login";
const LOGOUT_ENDPOINT = "/admin/logout";
const CURRENT_USER_ENDPOINT = "/admin/user";

interface AdminUser {
  id?: number;
  name?: string;
  email?: string;
  login_id?: string;
  [key: string]: unknown;
}

interface LoginResponse {
  data?: {
    token?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  login: (credentials: {
    login_id: string;
    password: string;
  }) => Promise<LoginResponse | undefined>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAdminLoggedIn = !!adminUser;

  // Fetch current user on mount (replaces plugins/authAdmin.ts)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = Cookies.get(XADM_TOKEN);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = (await fetchAdmin(CURRENT_USER_ENDPOINT, {
          method: "POST",
        })) as Record<string, unknown>;
        const data = (response?.data ?? response) as AdminUser;
        setAdminUser(data);
      } catch (error: unknown) {
        const err = error as Record<string, Record<string, number>>;
        if ([401, 400, 419].includes(err?.response?.status)) {
          setAdminUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = useCallback(
    async (credentials: { login_id: string; password: string }) => {
      if (isAdminLoggedIn) return;

      const response = await fetchAdmin<LoginResponse>(LOGIN_ENDPOINT, {
        method: "POST",
        body: credentials as unknown as Record<string, unknown>,
      });

      // Set the token cookie
      if (response?.data?.token) {
        Cookies.set(XADM_TOKEN, response.data.token, { expires: 7 });
      }

      return response;
    },
    [isAdminLoggedIn],
  );

  const logout = useCallback(async () => {
    if (!isAdminLoggedIn) return;

    try {
      await fetchAdmin(LOGOUT_ENDPOINT, { method: "POST" });
    } catch {
      // Ignore logout API errors
    }

    setAdminUser(null);
    Cookies.remove(XADM_TOKEN);
    router.push("/");
  }, [isAdminLoggedIn, router]);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdminLoggedIn,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
