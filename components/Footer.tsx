import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <Link href="/" className="footer-logo">
            HustleUp
          </Link>
          <p>
            India-first part-time job marketplace connecting students, freshers,
            and businesses through verified profiles and simple hiring tools.
          </p>
        </div>

        <div>
          <h4>Platform</h4>
          <Link href="/jobs">Jobs</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/applications">Applications</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>

        <div>
          <h4>Users</h4>
          <Link href="/auth">Create account</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/post-job">Post job</Link>
          <Link href="/admin">Admin</Link>
        </div>

        <div>
          <h4>Contact</h4>
          <p>For MVP testing and early access.</p>
          <p>Support email can be added later.</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} HustleUp. Built for early MVP validation.</p>
      </div>
    </footer>
  );
}