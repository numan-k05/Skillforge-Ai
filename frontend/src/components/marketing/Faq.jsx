import { useState } from "react";
import { Plus } from "lucide-react";
import { FAQ } from "../../data/landingContent.js";
import "./Faq.css";

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="faq">
      <div className="container faq__grid">
        <div className="section-head faq__head">
          <h2>Questions, answered plainly</h2>
          <p>Learn how skill analysis, personalized roadmaps, and progress tracking work in the current platform.</p>
        </div>

        <div className="faq__list">
          {FAQ.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.q} className={`faq__item ${open ? "faq__item--open" : ""}`}>
                <button
                  className="faq__question"
                  onClick={() => setOpenIndex(open ? -1 : i)}
                  aria-expanded={open}
                >
                  {item.q}
                  <Plus size={18} className="faq__icon" />
                </button>
                {open && <p className="faq__answer">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
