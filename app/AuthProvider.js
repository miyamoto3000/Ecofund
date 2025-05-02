"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const getTokenFromCookies = () => {
      if (typeof window !== "undefined") {
        return document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("token="))
          ?.split("=")[1] || null;
      }
      return null;
    };

    const validateToken = async () => {
      const token = getTokenFromCookies();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/validate", {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` },
          credentials: "include",
        });

        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push("/login");
        }
      } catch (error) {
        setIsAuthenticated(false);
        router.push("/login");
      }
    };

    validateToken();
  }, [pathname, router]);

  if (isAuthenticated === null) return <p>Loading...</p>; // Prevent flashing while checking auth state

  return <>{children}</>;
}