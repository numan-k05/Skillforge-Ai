import { useCallback } from "react";
import { ShoppingBag } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import CatalogLayout from "../../layouts/CatalogLayout.jsx";
import useRemoteData from "../../hooks/useRemoteData.js";
import Button from "../../components/ui/Button.jsx";
import { Badge, Card } from "../../components/ui/Card.jsx";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import { getProducts } from "../../services/commerceService.js";
import "./StorePage.css";

export const money = (amount, currency) => new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount / 100);

export default function StorePage() {
  const [params,setParams]=useSearchParams();
  const type=params.get("type")||"skill_pass";
  const productId=params.get("productId");
  const skillId=params.get("skillId");
  const fetcher=useCallback(()=>getProducts("USD"),[]);
  const {data,error,loading,reload}=useRemoteData(fetcher);
  const products=(data||[]).filter(p=>productId?String(p.id)===productId:p.kind===type&&(!skillId||p.skills.some(s=>String(s.id)===skillId)));
  return <CatalogLayout>
    <header className="sf-page-heading"><div><span className="sf-eyebrow"><ShoppingBag size={16}/> CHOOSE YOUR LEARNING ACCESS</span><h1>What would you like to learn?</h1><p>Choose one skill for a focused course, or one career bundle for several related courses. Your purchase covers only the content listed in that product.</p></div><Button to="/purchases" variant="secondary">My access</Button></header>
    <ol className="sf-purchase-steps" aria-label="Purchase steps"><li aria-current="step">1. Choose a skill or career</li><li>2. Review your selection</li><li>3. Confirm payment</li><li>4. Start learning</li></ol>
    <p className="sf-store__notice">Pay by bank transfer or Easypaisa after selecting a product. Access starts after owner approval. Free planning tools and course previews remain available.</p>
    <div className="sf-checkout__actions sf-store__filters"><Button variant={type==="skill_pass"&&!productId?"primary":"secondary"} onClick={()=>setParams({type:"skill_pass"})}>Skill Pass · one skill</Button><Button variant={type==="career_bundle"&&!productId?"primary":"secondary"} onClick={()=>setParams({type:"career_bundle"})}>Career Bundle · related skills</Button><Button variant={type==="subscription"&&!productId?"primary":"secondary"} onClick={()=>setParams({type:"subscription"})}>Monthly · all access</Button><Button to="/dashboard" variant="secondary">Continue free</Button></div>
    {loading?<Skeleton rows={4}/>:error?<ErrorState message={error.message} onRetry={reload}/>:products.length?<div className="sf-store__grid">{products.map(p=><Card key={p.id}><Badge>{p.kind==="career_bundle"?"Career Bundle":p.kind==="subscription"?"30-day subscription":"Skill Pass"}</Badge><h2>{p.name}</h2><p>{p.description}</p><div className="sf-inline-badges">{p.kind!=="subscription"&&p.skills.map(s=><Badge key={s.id}>{s.name}</Badge>)}</div><strong className="sf-store__price">{p.manualPrice?money(p.manualPrice.amountMinor,p.manualPrice.currency):money(p.price.amountMinor,p.price.currency)} <small>{p.kind==="subscription"?"per 30 days":"one time"}</small></strong><p>{p.includes.courses.length} course(s), {p.includes.assessments.length} assessment(s), {p.includes.projects.length} project(s), and {p.includes.certificates.length} certificate program(s).</p>{p.kind==="subscription"&&<p>Manual renewal only. Access expires after 30 days; progress stays saved.</p>}{!p.manualPrice&&p.savingsMinor>0&&<p className="sf-store__savings">Save {money(p.savingsMinor,p.price.currency)} compared with the included individual Skill Passes.</p>}<Button to={p.hasAccess?`/my-access/${p.id}`:`/purchase/${p.id}/confirm`}>{p.hasAccess?"Open my content":"Select and review"}</Button></Card>)}</div>:<EmptyState title="No matching products" description="Choose another skill or career using the options above."/>}
  </CatalogLayout>;
}
