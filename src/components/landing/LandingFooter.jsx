import { Link } from "react-router-dom";
import { Heart, Mail, Code2 } from "lucide-react";
import {
  SUPPORT_EMAIL,
  WHATSAPP_LINK,
  DISCORD_INVITE_URL,
  GITHUB_URL,
  TWITTER_URL,
  LINKEDIN_URL,
} from "../../config/site.js";
import { GithubMark, LinkedinMark, WhatsappMark, DiscordMark, XMark } from "../icons/BrandIcons";

// Social row: public profiles (GitHub/Twitter/LinkedIn) plus the same
// official contact channels (WhatsApp/Discord) already used elsewhere,
// unified into one icon-button style. Each is env-driven and simply
// omitted when unconfigured (see config/site.js) — the mailto fallback
// is the one exception, since SUPPORT_EMAIL always has a real value.
function useSocialLinks() {
  return [
    { key: "github", label: "GitHub", href: GITHUB_URL, Icon: GithubMark },
    { key: "twitter", label: "Twitter", href: TWITTER_URL, Icon: XMark },
    { key: "linkedin", label: "LinkedIn", href: LINKEDIN_URL, Icon: LinkedinMark },
    { key: "whatsapp", label: "WhatsApp", href: WHATSAPP_LINK, Icon: WhatsappMark },
    { key: "discord", label: "Discord", href: DISCORD_INVITE_URL, Icon: DiscordMark },
    { key: "email", label: "Email", href: `mailto:${SUPPORT_EMAIL}`, Icon: Mail },
  ].filter((l) => l.href);
}

function FooterColumn({ title, links }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-zinc-200 tracking-wide">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map(({ label, ...linkProps }) => (
          <li key={label}>
            {linkProps.to ? (
              <Link
                to={linkProps.to}
                className="text-sm text-zinc-500 hover:text-zinc-200 transition"
              >
                {label}
              </Link>
            ) : (
              <a
                href={linkProps.href}
                className="text-sm text-zinc-500 hover:text-zinc-200 transition"
              >
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LandingFooter({ user }) {
  const dashboardOrPortal = user ? "/dashboard" : "/portal";
  const socialLinks = useSocialLinks();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-700 bg-ink-900/40">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
        {/* Brand */}
        <div className="lg:col-span-5 flex flex-col gap-4 sm:col-span-2">
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: "var(--theme-primary-alpha, rgba(45,212,191,0.12))",
                color: "var(--theme-primary, #2dd4bf)",
              }}
            >
              <Code2 size={18} aria-hidden="true" />
            </span>
            <span className="text-xl font-bold tracking-tight">Code Club</span>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
            Solve curated DSA problems, run live AI mock interviews, and build
            a placement-ready profile. Gamified progress tracking, built for
            engineering students.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-zinc-600">
            Made with
            <Heart size={12} className="fill-current text-zinc-600" aria-hidden="true" />
            by developers, for developers
          </p>
        </div>

        <div className="lg:col-span-3">
          <FooterColumn
            title="Quick Links"
            links={[
              { label: "Problems", to: "/problems" },
              { label: "Dashboard", to: dashboardOrPortal },
              { label: "Club", to: "/club" },
              { label: "Pricing", to: "/pricing" },
            ]}
          />
        </div>

        <div className="lg:col-span-4">
          <FooterColumn
            title="Resources"
            links={[
              { label: "For TPOs", to: "/portal" },
              { label: "For Recruiters", to: "/portal" },
              { label: "Privacy Policy", to: "/privacy" },
              { label: "Terms of Service", to: "/terms" },
              { label: "Contact", href: `mailto:${SUPPORT_EMAIL}` },
            ]}
          />
        </div>
      </div>

      <div className="border-t border-ink-700">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © {year} Code Club. All rights reserved.
          </p>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2.5">
              {socialLinks.map(({ key, label, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target={key === "email" ? undefined : "_blank"}
                  rel={key === "email" ? undefined : "noopener noreferrer"}
                  aria-label={label}
                  title={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-zinc-800/80 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-700 hover:border-zinc-700 transition"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
