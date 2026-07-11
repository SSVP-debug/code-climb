import { Link } from "react-router-dom";
import PageMeta from "../components/seo/PageMeta";
import { SUPPORT_EMAIL } from "../config/site.js";

const LAST_UPDATED = "11 July 2026";

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <PageMeta
        title="Terms of Service · Code Club"
        description="The terms that govern your use of Code Club."
        path="/terms"
      />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition">
          ← Back to Code Club
        </Link>

        <h1 className="text-3xl font-black mt-6 mb-2">Terms of Service</h1>
        <p className="text-xs text-zinc-600 mb-2">Last updated: {LAST_UPDATED}</p>

        <div className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-10">
          Draft — these terms describe Code Club's current product behavior
          as implemented, but have not yet been reviewed by a lawyer. Do not
          treat them as final, binding terms until they have been.
        </div>

        <Section title="Using Code Club">
          <p>
            Code Club is a DSA practice and interview-preparation platform.
            You need a Google account to sign in. You're responsible for
            keeping your account secure and for the activity that happens
            under it.
          </p>
          <p>
            We're currently in early access — features, pricing, and the
            problem catalog will keep changing. We'll try to give notice
            before anything that affects your existing data or subscription.
          </p>
        </Section>

        <Section title="Your code and content">
          <p>
            Code you write and submit stays yours. By submitting it, you give
            us permission to store it, run it (via Judge0) to grade it, and
            show it back to you in your submission history — we don't use
            your submitted code to train AI models or share it publicly.
          </p>
          <p>
            If you make your profile public, your solve history, XP, streak,
            and achievements become visible to anyone with the link,
            including recruiters using our candidate search.
          </p>
        </Section>

        <Section title="Subscriptions and payment">
          <p>
            Paid plans are billed through Razorpay. Prices are shown in INR
            at checkout. Subscriptions renew automatically unless cancelled
            before the renewal date. Refunds are handled case-by-case — email
            us if something's gone wrong with a charge.
          </p>
        </Section>

        <Section title="Recruiters and college placement offices">
          <p>
            If you sign up as a recruiter, you're agreeing to only use
            candidate data (search results, skills test outcomes) for
            legitimate hiring purposes — not to contact candidates outside
            the platform without their consent, or to redistribute candidate
            data.
          </p>
          <p>
            Company and institution accounts (recruiter, TPO) are expected to
            sign up with a work or institutional email — personal email
            addresses aren't accepted for these account types.
          </p>
        </Section>

        <Section title="What's not allowed">
          <p>
            Sharing hidden test cases or answer keys obtained through the
            platform, attempting to circumvent rate limits or the code
            execution sandbox, scraping the problem catalog at scale, or
            using another person's account.
          </p>
        </Section>

        <Section title="Certificates">
          <p>
            Certificates issued through Code Club reflect problems solved on
            this platform, verified through your submission history. They
            are not an accredited or university-issued qualification.
          </p>
        </Section>

        <Section title="Changes and termination">
          <p>
            We may suspend accounts that violate these terms. You can stop
            using Code Club and request account deletion at any time — see
            our <Link to="/privacy" className="text-green-400 hover:text-green-300">Privacy Policy</Link> for how.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms:{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-green-400 hover:text-green-300"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}

export default TermsPage;