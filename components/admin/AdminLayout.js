import Link from "next/link";
import { useRouter } from "next/router";

import Breadcrumbs from "../Breadcrumbs";
import { clearSession } from "../../lib/api";
import { ADMIN_LOGIN_PATH } from "../../lib/admin";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", match: "/admin" },
  { href: "/admin/registrations", label: "Registrations", match: "/admin/registrations" },
  { href: "/admin/opportunities", label: "Opportunities", match: "/admin/opportunities" },
  { href: "/admin/users", label: "Users", match: "/admin/users" },
  { href: "/admin/admins", label: "Admins", match: "/admin/admins" },
];

export default function AdminLayout({ title, description, children, actions }) {
  const router = useRouter();
  const breadcrumbs = [{ href: "/", label: "Home" }, { href: "/admin", label: "Admin" }];

  if (router.pathname !== "/admin") {
    breadcrumbs.push({ label: title });
  }

  function handleLogout() {
    clearSession();
    router.replace(ADMIN_LOGIN_PATH);
  }

  return (
    <main className="page-shell page-stack">
      <Breadcrumbs items={breadcrumbs} />

      <section className="admin-hero">
        <div className="admin-hero-copy">
          <span className="eyebrow">Admin panel</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="admin-hero-actions">
          {actions}
          <button type="button" className="button button-secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </section>

      <nav className="admin-nav" aria-label="Admin sections">
        {adminNavItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? router.pathname === "/admin"
              : router.pathname.startsWith(item.match);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link${isActive ? " admin-nav-link-active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </main>
  );
}
