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
import { fetchCitizen } from "@/app/lib/fetchCitizen";

const LOGIN_ENDPOINT = "/customer/login";
const DEMO_LOGIN_ENDPOINT = "/customer/demo-login";
const LOGOUT_ENDPOINT = "/customer/logout";
const CURRENT_USER_ENDPOINT = "/customer/user";

export interface CitizenUser {
  id?: string;
  name?: string;
  email?: string;
  login_id?: string;
  roles?: string[];
  is_demo?: boolean;
  [key: string]: unknown;
}

interface LoginResponse {
  status?: boolean;
  message?: string;
  data?: { user?: CitizenUser; [key: string]: unknown };
}

interface CurrentUserResponse {
  status?: boolean;
  data?: CitizenUser;
}

interface CitizenAuthContextType {
  citizenUser: CitizenUser | null;
  isCitizenLoggedIn: boolean;
  isLoading: boolean;
  login: (credentials: {
    login_id: string;
    password: string;
  }) => Promise<LoginResponse | undefined>;
  demoLogin: () => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<CitizenUser | null>;
}

const CitizenAuthContext = createContext<CitizenAuthContextType | undefined>(
  undefined,
);

export function CitizenAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [citizenUser, setCitizenUser] = useState<CitizenUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isCitizenRoute = [
    "/dashboard",
    "/audit",
    "/accessibility",
    "/embeded-code",
    "/developer-resourse",
    "/document-pdf",
    "/billing-payments",
    "/settings",
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));

  const hydrateCurrentUser = useCallback(async () => {
    const response = await fetchCitizen<CurrentUserResponse>(
      CURRENT_USER_ENDPOINT,
      { method: "POST" },
    );
    const user = response.data ?? null;
    setCitizenUser(user);
    return user;
  }, []);

  useEffect(() => {
    if (!isCitizenRoute) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const hydrate = async () => {
      try {
        await hydrateCurrentUser();
      } catch {
        setCitizenUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void hydrate();
  }, [hydrateCurrentUser, isCitizenRoute]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setCitizenUser(null);
      setIsLoading(false);
      router.replace("/login");
      router.refresh();
    };
    window.addEventListener(
      "accessimate:citizen-unauthorized",
      handleUnauthorized,
    );
    return () =>
      window.removeEventListener(
        "accessimate:citizen-unauthorized",
        handleUnauthorized,
      );
  }, [router]);

  const enterDashboard = useCallback(async () => {
    await hydrateCurrentUser();
    router.replace("/dashboard");
    router.refresh();
  }, [hydrateCurrentUser, router]);

  const login = useCallback(
    async (credentials: { login_id: string; password: string }) => {
      if (citizenUser) return undefined;
      const response = await fetchCitizen<LoginResponse>(LOGIN_ENDPOINT, {
        method: "POST",
        body: credentials,
      });
      await enterDashboard();
      return response;
    },
    [citizenUser, enterDashboard],
  );

  const demoLogin = useCallback(async () => {
    const response = await fetchCitizen<LoginResponse>(DEMO_LOGIN_ENDPOINT, {
      method: "POST",
    });
    await enterDashboard();
    return response;
  }, [enterDashboard]);

  const logout = useCallback(async () => {
    try {
      await fetchCitizen(LOGOUT_ENDPOINT, { method: "POST" });
    } catch {
      // The BFF clears the session on logout and invalid-session responses.
    } finally {
      setCitizenUser(null);
      router.replace("/");
      router.refresh();
    }
  }, [router]);

  const value = useMemo(
    () => ({
      citizenUser,
      isCitizenLoggedIn: Boolean(citizenUser),
      isLoading,
      login,
      demoLogin,
      logout,
      refreshUser: hydrateCurrentUser,
    }),
    [citizenUser, demoLogin, hydrateCurrentUser, isLoading, login, logout],
  );

  return (
    <CitizenAuthContext.Provider value={value}>
      {children}
    </CitizenAuthContext.Provider>
  );
}

export function useCitizenAuth() {
  const context = useContext(CitizenAuthContext);
  if (context === undefined) {
    throw new Error("useCitizenAuth must be used within a CitizenAuthProvider");
  }
  return context;
}
