import useScrollReveal from "../../hooks/useScrollReveal";

// Small wrapper: attaches scroll-reveal to any section. Shared across the
// landing components so each one animates in consistently as the user
// scrolls, without every file re-implementing the same hook wiring.
function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useScrollReveal();
  return (
    <Tag ref={ref} className={`lp-reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export default Reveal;