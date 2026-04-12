import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import { clearSession, getStoredSession } from "../lib/api";
import { useToast } from "./ToastProvider";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/clubs", label: "Clubs" },
  { href: "/projects", label: "Projects" },
  { href: "/workshops", label: "Workshops" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState({ token: null, user: null });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    function syncSession() {
      setSession(getStoredSession());
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("authChange", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("authChange", syncSession);
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogout() {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Log out of your account?");
      if (!confirmed) {
        return;
      }
    }

    clearSession();
    setIsUserMenuOpen(false);
    toast.info("You have been logged out.");
    router.push("/");
  }

  const isLoggedIn = Boolean(session.token && session.user);
  const isLoginActive = router.pathname === "/login";
  const isRegisterActive = router.pathname === "/register";

  return (
    <header className="site-header">
      <div className="navbar">
        <Link href="/" className="brand" aria-label="Events Community home">
          <Image
            src="/logo.png"
            alt="Events Community Logo"
            width={64}
            height={64}
            className="brand-logo"
            quality={75}
            sizes="(max-width: 480px) 52px, 64px"
            priority
          />
          <span className="brand-copy">
            <strong>Events Community</strong>
            <span>Karakalpakstan</span>
          </span>
        </Link>

        <div className="nav-panel">
          <nav className="nav-menu" aria-label="Primary">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link${isActive ? " nav-link-active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="nav-actions">
            {isLoggedIn ? (
              <div className="user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="user-avatar-button"
                  aria-label={isUserMenuOpen ? "Close account menu" : "Open account menu"}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="account-menu"
                  onClick={() => setIsUserMenuOpen((current) => !current)}
                >
                  <span className="user-avatar-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="user-avatar-svg">
                      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" />
                    </svg>
                  </span>
                  <span
                    className={`user-menu-caret${isUserMenuOpen ? " user-menu-caret-open" : ""}`}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 20 20" className="user-menu-caret-svg">
                      <path d="M5.25 7.5 10 12.25 14.75 7.5" />
                    </svg>
                  </span>
                </button>

                {isUserMenuOpen ? (
                  <div id="account-menu" className="user-menu-dropdown" role="menu">
                    <button type="button" className="user-menu-item" role="menuitem" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`nav-action-link${isLoginActive ? " nav-action-link-active" : ""}`}
                >
                  Login
                </Link>
                <Link href="/register" className={`nav-cta${isRegisterActive ? " nav-cta-active" : ""}`}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
