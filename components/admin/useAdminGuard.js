import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { api, clearSession, getStoredSession, setSession } from "../../lib/api";
import { ADMIN_LOGIN_PATH, isAdminAuthError } from "../../lib/admin";

export default function useAdminGuard() {
  const router = useRouter();
  const [session, setSessionState] = useState({ token: null, user: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyAdminAccess() {
      const nextSession = getStoredSession();
      setSessionState(nextSession);

      if (!nextSession.token) {
        setReady(false);
        router.replace(ADMIN_LOGIN_PATH);
        return;
      }

      try {
        const user = await api.getMe(nextSession.token);

        if (!active) {
          return;
        }

        if (!user.is_admin) {
          clearSession();
          setReady(false);
          router.replace(ADMIN_LOGIN_PATH);
          return;
        }

        setSession(nextSession.token, {
          full_name: user.full_name,
          is_admin: true,
        });
        setSessionState({
          token: nextSession.token,
          user: { full_name: user.full_name, is_admin: true },
        });
        setReady(true);
      } catch (requestError) {
        if (!active) {
          return;
        }

        const message = requestError.message || "Failed to verify admin access";
        if (isAdminAuthError(message)) {
          clearSession();
          setReady(false);
          router.replace(ADMIN_LOGIN_PATH);
          return;
        }

        setReady(false);
        router.replace(ADMIN_LOGIN_PATH);
      }
    }

    function handleSessionChange() {
      setReady(false);
      verifyAdminAccess();
    }

    verifyAdminAccess();
    window.addEventListener("storage", handleSessionChange);
    window.addEventListener("authChange", handleSessionChange);

    return () => {
      active = false;
      window.removeEventListener("storage", handleSessionChange);
      window.removeEventListener("authChange", handleSessionChange);
    };
  }, [router]);

  return {
    ready,
    session,
    token: session.token || "",
  };
}
