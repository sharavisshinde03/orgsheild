
"use client";

import "@/lib/amplify";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_PATHS = [
  "/signin",
  "/signup",
  "/verify-email",
  "/forgot-password",
];

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAuthentication() {
      const isPublicPath = PUBLIC_PATHS.includes(pathname);

      try {
        const session = await fetchAuthSession();

        const isSignedIn = Boolean(
          session.tokens?.accessToken
        );

        if (!active) return;

        // Allow public authentication pages to remain accessible,
        // even if the user already has an active session.
        if (isPublicPath) {
          setChecking(false);
          return;
        }

        // Protect dashboard and other private pages.
        if (!isSignedIn) {
          router.replace("/signin");
          return;
        }

        setChecking(false);
      } catch {
        if (!active) return;

        if (isPublicPath) {
          setChecking(false);
          return;
        }

        router.replace("/signin");
      }
    }

    setChecking(true);
    void checkAuthentication();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
        <p className="text-sm font-medium text-slate-500">
          Checking your session...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
