"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/contexts/AdminAuthContext";

/**
 * Higher-Order Component (HOC) for protecting routes by role.
 *
 * Wraps a component and checks if the user is authenticated.
 * If not authenticated (after loading), redirects to the login page.
 *
 * Usage:
 *   export default withAuth(MyLayout, ['Admin']);
 */
function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _allowedRoles?: string[],
) {
  const AuthenticatedComponent = (props: P) => {
    const { isAdminLoggedIn, isLoading } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAdminLoggedIn) {
        router.push("/admin-login");
      }
    }, [isAdminLoggedIn, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!isAdminLoggedIn) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return AuthenticatedComponent;
}

export default withAuth;
