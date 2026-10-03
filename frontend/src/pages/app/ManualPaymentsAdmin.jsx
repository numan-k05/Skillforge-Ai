import {useCallback,useEffect,useState} from 'react';
import useRemoteData from '../../hooks/useRemoteData.js';
import {Card} from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import {Field} from '../../components/ui/Field.jsx';
import {ErrorState,Skeleton} from '../../components/ui/Feedback.jsx';
import * as api from '../../services/manualPaymentService.js';
import {money} from './StorePage.jsx';

export default function ManualPaymentsAdmin(){
  const fetcher=useCallback(async()=>({settings:await api.getPaymentSettings(),submissions:await api.getSubmissions()}),[]);
  const {data,error,loading,reload}=useRemoteData(fetcher);
  return <section aria-label="Manual payment administration"><h1>Payment approvals</h1><p>Match the transaction ID and amount against money actually credited to your bank or Easypaisa account before approving. A screenshot alone does not confirm payment.</p><Button variant="secondary" onClick={reload}>Refresh payments</Button>{loading?<Skeleton rows={3}/>:error?<ErrorState message={error.message} onRetry={reload}/>:<><PaymentSettings key={JSON.stringify(data.settings)} settings={data.settings} onSaved={reload}/><h2>Latest 200 payment submissions</h2>{!data.submissions.length&&<p>No payment proofs submitted yet.</p>}{data.submissions.map(s=><Review key={s.id} submission={s} onSaved={reload}/>)}</>}</section>;
}
function PaymentSettings({settings,onSaved}){
  const [methods,setMethods]=useState(settings.methods);
  const [prices,setPrices]=useState(Object.fromEntries(settings.products.map(p=>[p.id,p.amount_minor?String(Number(p.amount_minor)/100):''])));
  const [notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  function change(index,key,value){setMethods(v=>v.map((m,i)=>i===index?{...m,[key]:value}:m));}
  async function save(e){e.preventDefault();setBusy(true);setNotice('');try{await api.savePaymentSettings({methods,prices:settings.products.filter(p=>prices[p.id]!=='').map(p=>({productId:Number(p.id),amountMinor:Math.round(Number(prices[p.id])*100)}))});onSaved();}catch(err){setNotice(err.message);}finally{setBusy(false);}}
  return <details><summary>Payment accounts and PKR prices</summary><Card as="form" className="sf-author-form" onSubmit={save}><p>Enter the exact rupee price customers must transfer. Existing orders retain their original price. Products without a PKR price cannot be purchased.</p>{methods.map((m,i)=><fieldset key={m.id||i}><legend>{m.name||'New payment method'}</legend><Field label="Method name" required maxLength={80} value={m.name} onChange={e=>change(i,'name',e.target.value)}/><Field label="Account title" required maxLength={120} value={m.account_title} onChange={e=>change(i,'account_title',e.target.value)}/><Field label="Account number or official IBAN" required maxLength={80} value={m.account_number} onChange={e=>change(i,'account_number',e.target.value)}/><Field label="Transfer instructions" maxLength={1000} value={m.instructions} onChange={e=>change(i,'instructions',e.target.value)}/><label><input type="checkbox" checked={m.enabled} onChange={e=>change(i,'enabled',e.target.checked)}/> Accept transfers to this account</label></fieldset>)}{methods.length<5&&<Button type="button" variant="secondary" onClick={()=>setMethods(v=>[...v,{name:'',account_title:'',account_number:'',instructions:'',enabled:false}])}>Add payment account</Button>}<h3>One-time prices in PKR</h3>{settings.products.map(p=><Field key={p.id} label={`${p.name} — PKR`} type="number" min="0.01" max="10000000" step="0.01" value={prices[p.id]} onChange={e=>setPrices(v=>({...v,[p.id]:e.target.value}))}/>)}{notice&&<p role="alert">{notice}</p>}<Button type="submit" disabled={busy}>{busy?'Saving…':'Save payment settings'}</Button></Card></details>;
}
function Review({submission:s,onSaved}){
  const [note,setNote]=useState(s.review_note),[verified,setVerified]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[image,setImage]=useState('');
  useEffect(()=>()=>{if(image)URL.revokeObjectURL(image);},[image]);
  async function proof(){try{setImage(await api.getProofImage(s.id));}catch(e){setNotice(e.message);}}
  async function decide(decision){setBusy(true);setNotice('');try{await api.reviewPayment(s.id,{decision,note,verified});onSaved();}catch(e){setNotice(e.message);}finally{setBusy(false);}}
  return <Card className="sf-author-form"><h3>Order #{s.order_id} — {s.status.replaceAll('_',' ')}</h3><p>{s.name} · {s.email}</p><p>{s.products}</p><strong>{money(Number(s.amount_minor),s.currency)}</strong><p>Transaction: {s.reference} · Date: {String(s.paid_date).slice(0,10)}</p><p>Sent to {s.destination.name}: {s.destination.account_number} ({s.destination.account_title})</p><Button variant="secondary" onClick={proof}>View private screenshot</Button>{image&&<img src={image} alt={`Payment screenshot for order ${s.order_id}`} style={{maxWidth:'100%',maxHeight:500,objectFit:'contain'}}/>}{s.order_status==='pending'&&<><Field label="Review note / correction instructions" as="textarea" maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}/><label><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/> I verified the matching transaction and full amount in my bank or Easypaisa account.</label><div className="sf-checkout__actions"><Button disabled={busy||!verified} onClick={()=>decide('approved')}>Approve and unlock selection</Button><Button variant="secondary" disabled={busy||!note.trim()} onClick={()=>decide('needs_information')}>Request correction</Button><Button variant="secondary" disabled={busy||!note.trim()} onClick={()=>decide('rejected')}>Reject</Button></div></>}{notice&&<p role="alert">{notice}</p>}</Card>;
}
