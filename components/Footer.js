import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-columns">
          <div className="footer-brand">
            <span className="section-label">Events Community</span>
            <h3>Discover clubs, projects, and workshops in Karakalpakstan.</h3>
            <p>
              A simple platform for students and young people to find opportunities, join
              communities, and take part in real local initiatives.
            </p>
          </div>

          <div className="footer-links">
            <h4>Explore</h4>
            <Link href="/clubs">Clubs</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/workshops">Workshops</Link>
          </div>

          <div className="footer-links">
            <h4>Account</h4>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </div>

        <p className="footer-meta">© 2026 Events Community. Built for youth opportunities in Karakalpakstan.</p>
      </div>
    </footer>
  );
}
