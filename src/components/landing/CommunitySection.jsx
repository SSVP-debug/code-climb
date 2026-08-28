import { Users, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import Button from "../ui/Button";
import { WhatsappMark, DiscordMark } from "../icons/BrandIcons";
import { WHATSAPP_LINK, DISCORD_INVITE_URL } from "../../config/site.js";

// Community — Phase 3G, new section (blueprint position 09).
//
// Sits in the narrative spine (blueprint §13 groups Problem, Product
// Demonstration, Verification, Community, Opportunities as the core
// argument — see index.css's Phase 3A token comment), directly after
// Feature Constellation. Where the sections before it are about what one
// person can prove on their own, this is the one turn toward "you're not
// doing this alone" — the transition into Opportunities' "and here's
// where that goes."
//
// Content authenticity: every destination below is a real, already-live
// part of the product, not invented for this section.
//  - The Club (/club) is the actual community hub — leaderboard, public
//    and private contests, battle rooms (see pages/ClubPage.jsx). It's
//    the primary action because it's the one destination that's always
//    there regardless of deployment config, and because "leaderboards
//    and contests with everyone else on the same catalog" is the most
//    concrete version of "people building alongside you" the product
//    actually has today.
//  - WhatsApp / Discord are Code Club's real external channels, sourced
//    from config/site.js — the same single source of truth already used
//    by ContactChannels.jsx and LandingFooter.jsx. Both are env-driven
//    with no hardcoded fallback, so an unconfigured channel is simply
//    omitted here too, exactly like those two components — never a dead
//    link. No member counts, avatars, or quotes are invented for either;
//    the copy stays limited to what the channel is.
//
// No testimonials, no fabricated numbers, no fake activity feed — per
// this phase's brief, an editorial destination list stands in for social
// proof rather than manufacturing it.
function CommunitySection() {
  const secondaryChannels = [
    WHATSAPP_LINK && {
      key: "whatsapp",
      label: "WhatsApp",
      href: WHATSAPP_LINK,
      Icon: WhatsappMark,
      description: "Message the Code Club team directly.",
    },
    DISCORD_INVITE_URL && {
      key: "discord",
      label: "Discord",
      href: DISCORD_INVITE_URL,
      Icon: DiscordMark,
      description: "Join the server and talk to other students.",
    },
  ].filter(Boolean);

  return (
    <Reveal as="section" className="px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-12 md:gap-8">
        {/* Left — narrative beat, mirrors The Problem's column width so the
            spine reads consistently on desktop. */}
        <div className="md:col-span-5">
          <p className="mb-4 font-mono-ui text-lp-label uppercase tracking-lp-label text-zinc-500">
            Community
          </p>
          <h2 className="text-lp-h2-spine font-display font-bold tracking-tight text-white">
            Solving is solo.
            <br />
            The rest of it isn&apos;t.
          </h2>
          <p className="mt-4 max-w-sm text-zinc-400">
            Every problem is yours to work through on your own. The
            leaderboard, the contests, and everyone else grinding the same
            catalog aren&apos;t.
          </p>
        </div>

        {/* Right — destinations. The Club gets the visual weight; chat
            channels sit underneath, quieter, exactly matching the
            hierarchy the brief calls for. */}
        <div className="md:col-span-6 md:col-start-7">
          <div className="flex items-start gap-5 border-t border-ink-800 py-6 first:pt-0">
            <Users
              size={20}
              strokeWidth={2}
              className="mt-0.5 flex-shrink-0 text-verdict-accept"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="font-display text-lg font-semibold text-white">
                The Club
              </p>
              <p className="mt-1.5 text-zinc-400">
                Leaderboards, public and private contests, and everyone
                else working through the same problems — all under one
                roof.
              </p>
              <Button to="/club" variant="secondary" size="sm" className="mt-4 group">
                Open the Club
                <ArrowRight
                  size={14}
                  className="transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>

          {secondaryChannels.length > 0 && (
            <ul className="border-t border-ink-800 divide-y divide-ink-800">
              {secondaryChannels.map(({ key, label, href, Icon, description }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdict-accept focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 rounded-sm"
                  >
                    <Icon
                      size={18}
                      className="flex-shrink-0 text-zinc-500 transition group-hover:text-zinc-300"
                      aria-hidden="true"
                    />
                    <span className="flex-1">
                      <span className="block font-display font-semibold text-white">
                        {label}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </span>
                      <span className="mt-0.5 block text-sm text-zinc-500">
                        {description}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      className="flex-shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-400"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Reveal>
  );
}

export default CommunitySection;