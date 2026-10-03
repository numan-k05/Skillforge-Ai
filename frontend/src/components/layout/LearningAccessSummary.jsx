import { useCallback } from "react";
import useRemoteData from "../../hooks/useRemoteData.js";
import { getCommerceAccount } from "../../services/commerceService.js";
import { Card } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";

export default function LearningAccessSummary(){
  const fetcher=useCallback(()=>getCommerceAccount(),[]);
  const {data,error,loading,reload}=useRemoteData(fetcher);
  return <Card className="sf-learning-access"><h2>{data?.access.length?"Your unlocked learning paths":"Your learning access"}</h2>{loading?<p>Checking your access…</p>:error?<><p>Could not load your access.</p><Button variant="secondary" onClick={reload}>Try again</Button></>:data.access.length?<><p>Open a selection to see only its included courses, assessments, projects, and certificate programs.</p><div className="sf-inline-actions">{data.access.map(item=><Button key={item.productId} to={`/my-access/${item.productId}`} variant="secondary">{item.name}</Button>)}</div></>:<><p>You are using Free: explore skills and careers, plan your learning, and preview courses. Full paid courses and their activities show a lock until you unlock the matching selection.</p><div className="sf-inline-actions"><Button to="/courses" variant="secondary">Browse free previews</Button><Button to="/store">Choose a skill or career</Button></div></>}</Card>;
}
