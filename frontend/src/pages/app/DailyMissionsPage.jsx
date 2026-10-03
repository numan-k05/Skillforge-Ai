import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Flame, RefreshCw, Sparkles, Target } from "lucide-react";
import AppNav from "../../components/layout/AppNav.jsx";
import Button from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import MissionCard from "../../components/missions/MissionCard.jsx";
import * as missionApi from "../../services/missionService.js";
import { ApiError } from "../../services/apiClient.js";
import "./DailyMissionsPage.css";

function todayString(){const d=new Date();const offset=d.getTimezoneOffset();return new Date(d.getTime()-offset*60000).toISOString().slice(0,10)}
function prettyDate(value){return new Date(`${value}T00:00:00`).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}

export default function DailyMissionsPage(){
  const [date,setDate]=useState(todayString()); const [data,setData]=useState(null); const [loading,setLoading]=useState(true); const [busyId,setBusyId]=useState(null); const [error,setError]=useState("");
  const requestVersion = useRef(0);
  const fetchData = useCallback(async () => {
    const version = ++requestVersion.current;
    const commit = (update) => { if (version === requestVersion.current) update(); };
    try{const result = await missionApi.getDailyMissions(date); commit(() => setData(result))}catch(e){commit(() => setError(e instanceof ApiError?e.message:"Could not load Daily Missions."))}finally{commit(() => setLoading(false))}}, [date]);
  function load() {setLoading(true);setError("");return fetchData();
  }

  useEffect(() => {
    fetchData();
    return () => { requestVersion.current += 1; };
  }, [fetchData]);
  async function update(id,status){setBusyId(id);setError("");try{await missionApi.updateMissionStatus(id,status);await load()}catch(e){setError(e instanceof ApiError?e.message:"Could not update mission.")}finally{setBusyId(null)}}
  async function regenerate(){setLoading(true);setError("");try{setData(await missionApi.generateDailyMissions(date))}catch(e){setError(e instanceof ApiError?e.message:"Could not regenerate missions.")}finally{setLoading(false)}}
  const stats=data?.stats||{}; const percent=stats.total?Math.round(stats.completed/stats.total*100):0;
  const missionCount=useMemo(()=>data?.missions?.length||0,[data]);
  return <div><AppNav/><main id="main-content" tabIndex="-1" className="container sf-missions">
    <header className="sf-missions__hero"><div><div className="sf-missions__eyebrow"><Sparkles size={15}/> Personalized daily plan</div><h1>Daily Missions</h1><p>Small, focused actions generated from your career path, skill gaps, and active projects.</p></div><div className="sf-missions__date"><CalendarDays size={17}/><input type="date" value={date} max={todayString()} onChange={e=>{setLoading(true);setError("");setDate(e.target.value)}}/></div></header>
    {error&&<Card className="sf-missions__alert">{error}<Button size="sm" variant="ghost" onClick={load}>Try again</Button></Card>}
    {loading?<Card className="sf-missions__loading"><RefreshCw className="spin" size={22}/><h2>Building your missions…</h2><p>Matching today's actions to your current skill gaps.</p></Card>:data&&<>
      <section className="sf-missions__summary"><Card><Target size={19}/><span>Today's focus</span><strong>{missionCount} missions</strong><small>{prettyDate(data.date)}</small></Card><Card><CheckCircle2 size={19}/><span>Completed</span><strong>{stats.completed || 0} / {stats.total || 0}</strong><div className="sf-missions__progress"><i style={{width:`${percent}%`}}/></div></Card><Card><Flame size={19}/><span>Focused time</span><strong>{stats.completedMinutes || 0} / {stats.totalMinutes || 0} min</strong><small>{percent}% of today's plan complete</small></Card></section>
      <div className="sf-missions__toolbar"><div><h2>{date===todayString()?"Today's missions":"Mission history"}</h2><p>{data.engine === "personalized" ? "Personalized by your SkillForge profile." : "Generated plan."}</p></div><Button variant="secondary" size="sm" onClick={regenerate} icon={<RefreshCw size={14}/>}>Refresh plan</Button></div>
      <section className="sf-missions__list">{data.missions.map(m=><MissionCard key={m.missionId} mission={m} onStatus={update} busy={busyId===m.missionId}/>)}</section>
    </>}
  </main></div>
}
