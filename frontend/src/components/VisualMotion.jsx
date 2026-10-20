import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Reveal content once as it enters the viewport; keep it visible without JS.
export default function VisualMotion() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observed = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    const scan = () => {
      document.querySelectorAll(".public-card, .public-section, .platform-step, .platform-map, .pricing-card, .sf-skill-card, .sf-careercard, .feature-row, .cover-photo").forEach((element, index) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.style.setProperty("--reveal-delay", `${(index % 3) * 65}ms`);
        element.classList.add("reveal-on-scroll");
        observer.observe(element);
      });
    };
    const mutations = new MutationObserver(scan);
    mutations.observe(document.getElementById("main-content") || document.getElementById("root"), { childList: true, subtree: true });
    scan();
    return () => {
      mutations.disconnect();
      observer.disconnect();
      observed.forEach(element => element.classList.remove("reveal-on-scroll", "is-visible"));
    };
  }, [pathname]);
  return null;
}
