import { useRouter } from "next/router";
import { useEffect } from "react";

import { api, clearSession, getStoredSession, setSession } from "../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getStoredSession();

    if (!session.token) {
      router.replace("/login");
      return;
    }

    api
      .getMe(session.token)
      .then((user) => {
        if (user.is_admin) {
          setSession(session.token, {
            full_name: user.full_name,
            is_admin: true,
          });
          router.replace("/admin");
          return;
        }

        router.replace("/");
      })
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [router]);

  return (
    <main className="page-shell">
      <section className="empty-state">Redirecting...</section>
    </main>
  );
}
