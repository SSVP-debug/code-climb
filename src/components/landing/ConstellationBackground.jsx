import { useEffect, useRef } from "react";

// A deliberately short list: this renders inside the hero's code panel
// only, sized to that one container, so every label stays legible instead
// of scattering illegible topic names across the whole page.
const TOPICS = ["Arrays", "Graphs", "DP", "Hashing"];

/**
 * Contained canvas, sized to its parent (not the viewport), that renders a
 * soft, slowly drifting network of nodes labelled with DSA topics — the
 * literal skill graph a solved problem gets filed into. Lives once, behind
 * the hero's live-judge panel, rather than repeating as page-wide wallpaper
 * behind every section. Disabled entirely under prefers-reduced-motion
 * (renders nothing, since a static scatter of faint dots adds no value
 * without the motion).
 */
function ConstellationBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width, height, dpr;
    let nodes = [];
    let frameId;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = width < 480 ? 6 : 9;
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        label: i < TOPICS.length ? TOPICS[i] : null,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      const linkDist = width < 640 ? 140 : 220;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            ctx.strokeStyle = `rgba(45, 212, 191, ${0.1 * (1 - dist / linkDist)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(45, 212, 191, 0.45)";
        ctx.fill();

        if (n.label) {
          ctx.font = "11px var(--font-mono-ui, monospace)";
          ctx.fillStyle = "rgba(232, 234, 237, 0.22)";
          ctx.fillText(n.label, n.x + 8, n.y + 4);
        }
      }

      frameId = requestAnimationFrame(step);
    }

    resize();
    step();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full opacity-80"
    />
  );
}

export default ConstellationBackground;