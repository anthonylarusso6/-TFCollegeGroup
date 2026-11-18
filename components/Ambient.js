import { useEffect, useRef } from "react";

// App-wide living background: slow-drifting aurora blobs tinted by the current
// screen's mood (html[data-mood]) and the time of day (html[data-daypart]),
// with a light scroll parallax and film grain. All motion is transform-only so
// it runs on the GPU compositor; it stops entirely under Reduce Motion.
function daypart(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 9) return "dawn";
  if (h >= 9 && h < 17) return "day";
  if (h >= 17 && h < 21) return "dusk";
  return "night";
}

export default function Ambient() {
  const ref = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.getAttribute("data-mood")) root.setAttribute("data-mood", "base");
    const setPart = () => root.setAttribute("data-daypart", daypart());
    setPart();
    const t = setInterval(setPart, 5 * 60 * 1000);

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (ref.current) ref.current.style.setProperty("--amb-scroll", String(Math.min(window.scrollY, 4000)));
      });
    };
    if (!reduce) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearInterval(t);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="tf-amb" aria-hidden="true">
      <div className="tf-amb-par tf-amb-par-a">
        <div className="tf-amb-blob tf-amb-b1" />
        <div className="tf-amb-blob tf-amb-b3" />
      </div>
      <div className="tf-amb-par tf-amb-par-b">
        <div className="tf-amb-blob tf-amb-b2" />
        <div className="tf-amb-blob tf-amb-b4" />
        <div className="tf-amb-blob tf-amb-sky" />
      </div>
      <div className="tf-amb-vignette" />
      <div className="tf-amb-grain" />
    </div>
  );
}
