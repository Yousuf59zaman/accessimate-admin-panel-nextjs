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
import { signInWithPopup } from "firebase/auth";
import { fetchCitizen, XCTN_TOKEN } from "@/app/lib/fetchCitizen";
import { auth, googleProvider, facebookProvider } from "@/app/lib/firebase";

const LOGIN_ENDPOINT = "/customer/login";
const LOGOUT_ENDPOINT = "/customer/logout";
const CURRENT_USER_ENDPOINT = "/customer/user";
const SSO_LOGIN_ENDPOINT = "/customer/sso-login";

interface CitizenUser {
  id?: number;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

interface LoginResponse {
  data?: {
    token?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface CitizenAuthContextType {
  citizenUser: CitizenUser | null;
  isCitizenLoggedIn: boolean;
  isLoading: boolean;
  login: (credentials: {
    login_id: string;
    password: string;
  }) => Promise<LoginResponse | undefined>;
  googleLogin: () => Promise<LoginResponse | undefined>;
  facebookLogin: () => Promise<LoginResponse | undefined>;
  logout: () => Promise<void>;
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

  const isCitizenLoggedIn = !!citizenUser;

  // Fetch current user on mount (replaces plugins/authCitizen.ts)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = Cookies.get(XCTN_TOKEN);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = (await fetchCitizen(CURRENT_USER_ENDPOINT, {
          method: "POST",
        })) as Record<string, unknown>;
        const data = (response?.data ?? response) as CitizenUser;
        setCitizenUser(data);
      } catch (error: unknown) {
        const err = error as Record<string, Record<string, number>>;
        if ([401, 400, 419].includes(err?.response?.status)) {
          setCitizenUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = useCallback(
    async (credentials: { login_id: string; password: string }) => {
      if (isCitizenLoggedIn) return;

      const response = await fetchCitizen<LoginResponse>(LOGIN_ENDPOINT, {
        method: "POST",
        body: credentials as unknown as Record<string, unknown>,
      });

      // Set the token cookie
      if (response?.data?.token) {
        Cookies.set(XCTN_TOKEN, response.data.token, { expires: 7 });
      }

      return response;
    },
    [isCitizenLoggedIn],
  );

  const googleLogin = useCallback(async () => {
    if (isCitizenLoggedIn) return;

    // Clear SID cookie if present
    Cookies.remove("SID");

    googleProvider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    const response = await fetchCitizen<LoginResponse>(SSO_LOGIN_ENDPOINT, {
      method: "POST",
      body: { idToken },
    });

    if (response?.data?.token) {
      Cookies.set(XCTN_TOKEN, response.data.token, { expires: 7 });
    }

    return response;
  }, [isCitizenLoggedIn]);

  const facebookLogin = useCallback(async () => {
    if (isCitizenLoggedIn) return;

    // Clear SID cookie if present
    Cookies.remove("SID");

    facebookProvider.setCustomParameters({ auth_type: "reauthenticate" });
    const result = await signInWithPopup(auth, facebookProvider);
    const idToken = await result.user.getIdToken();

    const response = await fetchCitizen<LoginResponse>(SSO_LOGIN_ENDPOINT, {
      method: "POST",
      body: { idToken },
    });

    if (response?.data?.token) {
      Cookies.set(XCTN_TOKEN, response.data.token, { expires: 7 });
    }

    return response;
  }, [isCitizenLoggedIn]);

  const logout = useCallback(async () => {
    if (!isCitizenLoggedIn) return;

    try {
      await fetchCitizen(LOGOUT_ENDPOINT, { method: "POST" });
    } catch {
      // Ignore logout API errors
    }

    setCitizenUser(null);
    Cookies.remove(XCTN_TOKEN);
    router.push("/");
  }, [isCitizenLoggedIn, router]);

  return (
    <CitizenAuthContext.Provider
      value={{
        citizenUser,
        isCitizenLoggedIn,
        isLoading,
        login,
        googleLogin,
        facebookLogin,
        logout,
      }}
    >
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
