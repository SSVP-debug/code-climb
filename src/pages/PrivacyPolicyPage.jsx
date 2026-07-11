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

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <PageMeta
        title="Privacy Policy · Code Club"
        description="How Code Club collects, uses, and protects your data."
        path="/privacy"
      />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition">
          ← Back to Code Club
        </Link>

        <h1 className="text-3xl font-black mt-6 mb-2">Privacy Policy</h1>
        <p className="text-xs text-zinc-600 mb-2">Last updated: {LAST_UPDATED}</p>

        <div className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-10">
          Draft — this policy describes Code Club's actual data practices as
          implemented, but has not yet been reviewed by a lawyer. Do not treat
          it as a final, binding legal document until it has been.
        </div>

        <Section title="What we collect">
          <p>
            When you sign in with Google, we receive your name, email
            address, and profile photo from Firebase Authentication. We don't
            see or store your Google password.
          </p>
          <p>
            As you use Code Club, we store your problem submissions, code,
            XP, streak history, achievements, and any settings you choose
            (like your active theme). This is stored in our MongoDB database.
          </p>
          <p>
            If you connect a LeetCode username, we store your self-reported
            LeetCode stats separately from your Code Club activity — this
            data is never used to calculate your XP or leaderboard rank.
          </p>
          <p>
            If you subscribe to a paid plan, payment is processed by
            Razorpay. We do not store your card, UPI, or bank details — only
            your subscription status and plan.
          </p>
          <p>
            If you sign up as a recruiter or a college placement officer
            (TPO), we additionally store your company/institution email and
            any candidate searches or skills tests you create.
          </p>
        </Section>

        <Section title="How we use it">
          <p>
            To run the core product: tracking your solved problems, computing
            XP and streaks, showing your submission history, and generating
            AI hints, mock interviews, and weekly review emails using your
            activity.
          </p>
          <p>
            To operate the recruiter and placement-office features: if you
            make your profile public, recruiters can find you through
            candidate search. Your solve history, XP, and public username are
            visible on your public profile page. Your private submissions and
            account email are never shown to recruiters.
          </p>
          <p>
            To send you email: weekly review summaries, and account-related
            notices (like a certificate being issued). We use Resend to send
            these. You are not signed up for marketing email by default.
          </p>
        </Section>

        <Section title="What we don't do">
          <p>
            We don't sell your data to third parties. We don't share your
            private submission code with recruiters or anyone else — only
            aggregate stats (problems solved, streak, XP) are visible on a
            public profile, and only if you've made it public.
          </p>
        </Section>

        <Section title="Third-party services we use">
          <p>
            Firebase (Google) for authentication, MongoDB for our database,
            Judge0 for running and grading your code, Anthropic (Claude) for
            AI hints and mock interviews, Razorpay for payments, Resend for
            email delivery, and Sentry for error monitoring. Each of these
            processes the minimum data needed to do its job — for example,
            Judge0 receives your submitted code and test inputs, but not your
            identity.
          </p>
        </Section>

        <Section title="Cookies and local storage">
          <p>
            We use your browser's local storage to remember things like your
            in-progress code per problem and your last search filter on the
            Problems page — this stays on your device and isn't sent to our
            servers unless you submit or run code. We don't use third-party
            advertising cookies.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can make your public profile private at any time from your
            Profile settings. You can request deletion of your account and
            associated data by emailing us (see below) — we'll confirm once
            it's done.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy or your data:{" "}
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

export default PrivacyPolicyPage;