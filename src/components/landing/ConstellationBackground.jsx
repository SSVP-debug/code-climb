import { useEffect, useRef } from "react";

const TOPICS = [
  "Arrays", "Graphs", "DP", "Trees", "Strings",
  "Heaps", "Greedy", "Backtracking", "Hashing", "Bit Ops",
];

/**
 * Fixed, full-viewport canvas that renders a soft, slowly drifting network
 * of nodes labelled with DSA topics — a quiet nod to the "skill graph"
 * underlying progress tracking, sitting far behind foreground content.
 * Disabled entirely under prefers-reduced-motion (renders nothing, since
 * a static scatter of faint dots adds no value without the motion).
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

      const count = width < 640 ? 10 : width < 1024 ? 16 : 22;
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
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
            ctx.strokeStyle = `rgba(198, 255, 61, ${0.06 * (1 - dist / linkDist)})`;
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
        ctx.fillStyle = "rgba(198, 255, 61, 0.35)";
        ctx.fill();

        if (n.label) {
          ctx.font = "11px var(--font-mono-ui, monospace)";
          ctx.fillStyle = "rgba(232, 234, 237, 0.18)";
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
      className="pointer-events-none fixed inset-0 w-full h-full opacity-70"
    />
  );
}

export default ConstellationBackground;