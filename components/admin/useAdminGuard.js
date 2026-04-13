import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { getStoredSession } from "../../lib/api";

export default function useAdminGuard() {
  const router = useRouter();
  const [session, setSession] = useState({ token: null, user: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function syncSession() {
      const nextSession = getStoredSession();
      setSession(nextSession);

      if (!nextSession.token) {
        router.replace("/login");
        return;
      }

      if (!nextSession.user?.is_admin) {
        router.replace("/");
        return;
      }

      setReady(true);
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("authChange", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("authChange", syncSession);
    };
  }, [router]);

  return {
    ready,
    session,
    token: session.token || "",
  };
}
