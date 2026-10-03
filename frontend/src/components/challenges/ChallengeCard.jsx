import { CheckCircle2, Clock3, Code2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Card } from "../ui/Card.jsx";
import "./ChallengeCard.css";
const tone={beginner:"teal",intermediate:"blue",advanced:"neutral"};
export default function ChallengeCard({challenge,recommended=false}){const p=challenge.progress||{};return <Card className="sf-challenge-card"><div className="sf-challenge-card__top"><span className="sf-challenge-card__icon"><Code2 size={18}/></span><Badge tone={tone[challenge.difficulty]||"neutral"}>{challenge.difficulty}</Badge></div><h3>{challenge.title}</h3><p>{challenge.description}</p><div className="sf-challenge-card__meta"><span><Clock3 size={14}/> {challenge.estimatedMinutes} min</span>{challenge.language&&<span>{challenge.language}</span>}{p.status==="completed"&&<span className="sf-challenge-card__done"><CheckCircle2 size={14}/> Completed</span>}</div>{recommended&&<small className="sf-challenge-card__reason">Recommended from your current skill gaps</small>}<Link className="sf-challenge-card__link" to={`/challenges/${challenge.challengeId}`}>Open challenge <ArrowRight size={15}/></Link></Card>}
