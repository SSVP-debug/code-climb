/**
 * ProfileQuickNav
 *
 * Sticky pill-row navigation for the Profile page. Each pill scrolls to
 * the matching section anchor (id set on the section's wrapping element
 * in Profile.jsx, one per ContentSlot). Purely a scroll convenience — it
 * doesn't track "active section" via scroll-spy, keeping this cheap (no
 * IntersectionObserver) since the value here is jumping forward, not
 * showing reading position.
 */
function ProfileQuickNav({ items }) {
  function handleClick(e, targetId) {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (!el) return;
    const NAV_HEIGHT = 56; // approx. height of this sticky bar, so it doesn't cover the section header on landing
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <nav
      aria-label="Jump to profile section"
      className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--border)]"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => handleClick(e, item.id)}
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] transition whitespace-nowrap"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export default ProfileQuickNav;