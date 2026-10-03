import { useRef, useCallback, useEffect,useMemo,useState } from "react";
import { Code2, Filter, RefreshCw, Search, Sparkles, Trophy } from "lucide-react";
import AppNav from "../../components/layout/AppNav.jsx"; import Button from "../../components/ui/Button.jsx"; import {Card} from "../../components/ui/Card.jsx"; import ChallengeCard from "../../components/challenges/ChallengeCard.jsx"; import * as api from "../../services/challengeService.js"; import {ApiError} from "../../services/apiClient.js"; import "./ChallengesPage.css";
const DIFFICULTIES=["beginner","intermediate","advanced"];
export default function ChallengesPage(){const [all,setAll]=useState([]),[recommended,setRecommended]=useState([]),[tab,setTab]=useState("recommended"),[difficulty,setDifficulty]=useState(""),[search,setSearch]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState("");
const requestVersion = useRef(0);
const fetchData = useCallback(async () => {
    const version = ++requestVersion.current;
    const commit = (update) => { if (version === requestVersion.current) update(); };
    try{const [a,r]=await Promise.all([api.getChallenges({difficulty}),api.getRecommendedChallenges(8)]);

commit(() => setAll(a));commit(() => setRecommended(r.challenges||[]))}catch(e){commit(() => setError(e instanceof ApiError?e.message:"Could not load coding challenges."))}finally{commit(() => setLoading(false))}}, [difficulty]);
  function load() {setLoading(true);setError("");return fetchData();
  }

useEffect(() => {
    fetchData();
    return () => { requestVersion.current += 1; };
  }, [fetchData]);
const visible=useMemo(()=>{const src=tab==="recommended"?recommended:all;const t=search.trim().toLowerCase();return src.filter(c=>!t||`${c.title} ${c.description} ${c.language||""} ${(c.skills||[]).map(s=>s.name).join(" ")}`.toLowerCase().includes(t))},[tab,all,recommended,search]);
return <div><AppNav/><main id="main-content" tabIndex="-1" className="container sf-challenges"><header className="sf-challenges__header"><div><div className="sf-challenges__eyebrow"><Code2 size={15}/> Practice Lab</div><h1>Coding Challenges</h1><p>Strengthen the skills on your roadmap with short, focused problems and immediate feedback.</p></div><Button variant="secondary" onClick={load} disabled={loading} icon={<RefreshCw size={15}/>}>Refresh</Button></header><Card className="sf-challenges__hero"><div className="sf-challenges__hero-icon"><Sparkles size={22}/></div><div><strong>Challenges matched to your skill gaps</strong><p>SkillForge prioritizes practice around skills that matter for your current career path.</p></div><Trophy size={25}/></Card><div className="sf-challenges__tabs"><button className={tab==="recommended"?"active":""} onClick={()=>setTab("recommended")}>For you <Sparkles size={14}/></button><button className={tab==="all"?"active":""} onClick={()=>setTab("all")}>All challenges</button></div><div className="sf-challenges__filters"><label><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search challenges or skills…"/></label><label><Filter size={15}/><select value={difficulty} onChange={e=>{setLoading(true);setError("");setDifficulty(e.target.value)}}><option value="">All levels</option>{DIFFICULTIES.map(d=><option key={d} value={d}>{d[0].toUpperCase()+d.slice(1)}</option>)}</select></label></div>{error&&<Card className="sf-challenges__error">{error}<Button variant="secondary" onClick={load}>Try again</Button></Card>}{loading?<Card className="sf-challenges__state"><RefreshCw className="spin"/><h2>Loading challenges…</h2></Card>:visible.length?<div className="sf-challenges__grid">{visible.map(c=><ChallengeCard key={c.challengeId} challenge={c} recommended={tab==="recommended"}/>)}</div>:<Card className="sf-challenges__state"><h2>No challenges found</h2><p>Try another search or difficulty level.</p></Card>}</main></div>}
