import { ArrowRight } from "lucide-react";
import { Card, Badge } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import "./CareerCard.css";

/**
 * A single career in the Career Explorer grid. Only renders fields the
 * backend actually returns for a list-view career — no skill counts or
 * other per-career stats, since GET /careers doesn't include them (and
 * fetching them per-card would mean one request per career).
 */
export default function CareerCard({ career }) {
  return (
    <Card className="sf-careercard" as="article">
      <div className="sf-careercard__top">
        {career.category?.name && <Badge tone="blue">{career.category.name}</Badge>}
      </div>
      <h3 className="sf-careercard__title">{career.title}</h3>
      {career.shortDescription && (
        <p className="sf-careercard__desc">{career.shortDescription}</p>
      )}
      <Button
        to={`/careers/${career.careerId}`}
        variant="secondary"
        size="md"
        className="sf-careercard__cta"
        icon={<ArrowRight size={15} />}
      >
        View Career
      </Button>
    </Card>
  );
}
