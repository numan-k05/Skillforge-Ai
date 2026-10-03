import { HOW_IT_WORKS } from "../../data/landingContent.js";
import "./HowItWorks.css";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="how">
      <div className="container">
        <div className="section-head">
          <h2>How it works</h2>
          <p>Four steps from "here's what I know" to a plan built around it.</p>
        </div>

        <ol className="how__list">
          {HOW_IT_WORKS.map((item) => (
            <li key={item.step} className="how__item">
              <span className="how__step">{item.step}</span>
              <div>
                <h3 className="how__title">{item.title}</h3>
                <p className="how__body">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
