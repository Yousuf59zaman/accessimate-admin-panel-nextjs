"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchAdmin } from "@/app/lib/fetchAdmin";

const LOGIN_ENDPOINT = "/admin/login";
const DEMO_LOGIN_ENDPOINT = "/admin/demo-login";
const LOGOUT_ENDPOINT = "/admin/logout";
const CURRENT_USER_ENDPOINT = "/admin/user";

export interface AdminUser {
  id?: string;
  name?: string;
  email?: string;
  login_id?: string;
  user_info?: {
    first_name?: string;
    last_name?: string;
  };
  roles?: string[];
  permissions?: string[];
  is_demo?: boolean;
  [key: string]: unknown;
}

interface LoginResponse {
  status?: boolean;
  message?: string;
  data?: {
    user?: AdminUser;
    [key: string]: unknown;
  };
}

interface CurrentUserResponse {
  status?: boolean;
  data?: AdminUser;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  login: (credentials: {
    login_id: string;
    password: string;
  }) => Promise<LoginResponse | undefined>;
  demoLogin: () => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin-panel");

  const hydrateCurrentUser = useCallback(async () => {
    const response = await fetchAdmin<CurrentUserResponse>(
      CURRENT_USER_ENDPOINT,
      { method: "POST" },
    );
    const user = response.data ?? null;
    setAdminUser(user);
    return user;
  }, []);

  useEffect(() => {
    if (!isAdminRoute) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const hydrate = async () => {
      try {
        await hydrateCurrentUser();
      } catch {
        setAdminUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void hydrate();
  }, [hydrateCurrentUser, isAdminRoute]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setAdminUser(null);
      setIsLoading(false);
      router.replace("/admin-login");
      router.refresh();
    };
    window.addEventListener(
      "accessimate:admin-unauthorized",
      handleUnauthorized,
    );
    return () =>
      window.removeEventListener(
        "accessimate:admin-unauthorized",
        handleUnauthorized,
      );
  }, [router]);

  const enterPanel = useCallback(async () => {
    await hydrateCurrentUser();
    router.replace("/admin-panel");
    router.refresh();
  }, [hydrateCurrentUser, router]);

  const login = useCallback(
    async (credentials: { login_id: string; password: string }) => {
      if (adminUser) return undefined;
      const response = await fetchAdmin<LoginResponse>(LOGIN_ENDPOINT, {
        method: "POST",
        body: credentials,
      });
      await enterPanel();
      return response;
    },
    [adminUser, enterPanel],
  );

  const demoLogin = useCallback(async () => {
    const response = await fetchAdmin<LoginResponse>(DEMO_LOGIN_ENDPOINT, {
      method: "POST",
    });
    await enterPanel();
    return response;
  }, [enterPanel]);

  const logout = useCallback(async () => {
    try {
      await fetchAdmin(LOGOUT_ENDPOINT, { method: "POST" });
    } catch {
      // The BFF clears the session on logout and invalid-session responses.
    } finally {
      setAdminUser(null);
      router.replace("/");
      router.refresh();
    }
  }, [router]);

  const value = useMemo(
    () => ({
      adminUser,
      isAdminLoggedIn: Boolean(adminUser),
      isLoading,
      login,
      demoLogin,
      logout,
    }),
    [adminUser, demoLogin, isLoading, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
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
