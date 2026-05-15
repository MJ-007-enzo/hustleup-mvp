import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="container">
      <span className="badge">Pricing</span>
      <h1>Choose your HustleUp plan.</h1>

      <p className="hero-copy">
        Start free. Upgrade when you want better visibility, premium job access,
        and stronger profile positioning.
      </p>

      <section className="grid grid-3">
        <div className="card">
          <span className="tag">Beginner</span>
          <div className="price">Free</div>
          <p>For new job seekers testing HustleUp.</p>
          <p>✓ Create profile</p>
          <p>✓ Browse jobs</p>
          <p>✓ Limited applications</p>
          <p>✓ Basic visibility</p>
          <Link className="btn" href="/auth">
            Start free
          </Link>
        </div>

        <div className="card">
          <span className="tag">Basic</span>
          <div className="price">₹99</div>
          <p>For active users who want better opportunities.</p>
          <p>✓ More job access</p>
          <p>✓ Better profile visibility</p>
          <p>✓ Application tracking</p>
          <p>✓ Basic badge</p>
          <Link className="btn btn-primary" href="/auth">
            Choose Basic
          </Link>
        </div>

        <div className="card">
          <span className="tag">Premium</span>
          <div className="price">₹299</div>
          <p>For serious job seekers who want priority positioning.</p>
          <p>✓ Premium badge</p>
          <p>✓ Priority job access</p>
          <p>✓ Stronger profile ranking</p>
          <p>✓ Future certification access</p>
          <Link className="btn btn-primary" href="/auth">
            Choose Premium
          </Link>
        </div>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>For job owners</h2>
        <p>
          Business pricing can be added later. For MVP testing, job posting is
          open so you can validate demand first.
        </p>

        <div className="actions">
          <Link className="btn btn-primary" href="/post-job">
            Post a job
          </Link>
          <Link className="btn" href="/applications">
            Manage applicants
          </Link>
        </div>
      </section>
    </main>
  );
}