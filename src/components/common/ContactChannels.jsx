import { Mail } from "lucide-react";
import { WhatsappMark, DiscordMark } from "../icons/BrandIcons";
import {
  WHATSAPP_LINK,
  DISCORD_INVITE_URL,
  CONTACT_EMAIL,
  CONTACT_EMAIL_LINK,
} from "../../config/site.js";

/**
 * ContactChannels — Code Club's official communication channels
 * (WhatsApp, Discord, email), sourced entirely from src/config/site.js.
 *
 * Values come from VITE_CODECLUB_WHATSAPP / VITE_CODECLUB_DISCORD /
 * VITE_CODECLUB_EMAIL (see .env.example). Nothing here is hardcoded —
 * this component only knows how to *display* a channel once site.js says
 * it's configured. A channel with no env var set is simply omitted, so a
 * partially-configured deployment (e.g. Discord not set up yet) never
 * shows a dead link.
 *
 * Two variants:
 *  - "inline": compact icon links for tight spaces (global footer).
 *  - "panel":  full cards with a description + labeled CTA, for a
 *    dedicated community/contact section (Club page).
 */
const CHANNELS = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    cta: "Message",
    href: WHATSAPP_LINK,
    Icon: WhatsappMark,
    description: "Chat with the Code Club team directly on WhatsApp.",
  },
  {
    key: "discord",
    label: "Discord",
    cta: "Join Discord",
    href: DISCORD_INVITE_URL,
    Icon: DiscordMark,
    description: "Join the Code Club community server to chat with other students.",
  },
  {
    key: "email",
    label: "Email",
    cta: "Email Us",
    href: CONTACT_EMAIL_LINK,
    Icon: Mail,
    description: `Reach the team directly at ${CONTACT_EMAIL}.`,
  },
];

// Literal class strings only (Tailwind JIT can't resolve interpolated
// class names like `grid-cols-${n}`) — keyed by how many channels ended
// up configured so the grid still looks balanced with 1, 2, or 3 cards.
const PANEL_GRID_CLASSES = {
  1: "grid gap-4",
  2: "grid sm:grid-cols-2 gap-4",
  3: "grid sm:grid-cols-3 gap-4",
};

function ContactChannels({ variant = "panel", className = "" }) {
  const channels = CHANNELS.filter((c) => c.href);

  // Nothing configured (e.g. a fresh clone with no .env yet) — render
  // nothing rather than an empty shell.
  if (channels.length === 0) return null;

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {channels.map(({ key, label, href, Icon }) => (
          <a
            key={key}
            href={href}
            target={key === "email" ? undefined : "_blank"}
            rel={key === "email" ? undefined : "noopener noreferrer"}
            className="text-zinc-600 hover:text-zinc-400 transition"
            aria-label={label}
            title={label}
          >
            <Icon size={16} />
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={`${PANEL_GRID_CLASSES[channels.length]} ${className}`}>
      {channels.map(({ key, label, cta, href, Icon, description }) => (
        <div
          key={key}
          className="flex flex-col gap-3 bg-zinc-800/60 border border-zinc-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-2.5">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: "var(--theme-primary-alpha, rgba(45,212,191,0.12))",
                color: "var(--theme-primary, #2dd4bf)",
              }}
            >
              <Icon size={16} />
            </span>
            <span className="font-semibold text-sm">{label}</span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed flex-1">{description}</p>
          <a
            href={href}
            target={key === "email" ? undefined : "_blank"}
            rel={key === "email" ? undefined : "noopener noreferrer"}
            className="text-xs font-semibold text-center rounded-lg py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition"
            style={{ color: "var(--theme-primary, #2dd4bf)" }}
          >
            {cta}
          </a>
        </div>
      ))}
    </div>
  );
}

export default ContactChannels;