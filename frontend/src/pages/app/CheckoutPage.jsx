import {useCallback,useState} from 'react';
import {useParams} from 'react-router-dom';
import AppNav from '../../components/layout/AppNav.jsx';
import Button from '../../components/ui/Button.jsx';
import {Card} from '../../components/ui/Card.jsx';
import {Field,Select} from '../../components/ui/Field.jsx';
import {ErrorState,Skeleton} from '../../components/ui/Feedback.jsx';
import useRemoteData from '../../hooks/useRemoteData.js';
import {getManualOrder,submitProof} from '../../services/manualPaymentService.js';
import {getReceipt} from '../../services/commerceService.js';
import {money} from './StorePage.jsx';
import './StorePage.css';
export default function CheckoutPage(){
 const {id}=useParams();
 const fetcher=useCallback(async()=>({...await getManualOrder(id),receipt:await getReceipt(id)}),[id]);
 const {data,error,loading,reload}=useRemoteData(fetcher);
 return <div><AppNav/><main className="container sf-checkout"><h1>Pay for your selection</h1>{loading?<Skeleton rows={4}/>:error?<ErrorState message={error.message} onRetry={reload}/>:<><Card><h2>{data.receipt.items.map(i=>i.name).join(', ')}</h2><p>Order #{id} · {data.order.status}</p><strong>{money(Number(data.order.total_minor),data.order.currency)}</strong><p>Only this selection unlocks after the owner verifies your payment.</p><Button variant="secondary" onClick={reload}>Refresh payment status</Button></Card>{data.order.status==='paid'?<Card><h2>Payment approved</h2><Button to={`/my-access/${data.receipt.items[0].productId}`}>Start learning</Button><Button variant="secondary" to={`/receipts/${id}`}>View receipt</Button></Card>:data.order.status==='pending'&&data.order.currency==='PKR'?<PaymentForm key={id+':'+data.submissions[0]?.status} id={id} data={data} onSubmitted={reload}/>:<p>This order cannot accept manual payment. <Button to="/store">Choose a new selection</Button></p>}{data.submissions.map(s=><Card key={s.id}><h3>Payment {s.status.replaceAll('_',' ')}</h3><p>Transaction: {s.reference}</p>{s.review_note&&<p>Owner's note: {s.review_note}</p>}{s.status==='pending'&&<p>Your proof is awaiting review. Please do not send the payment again.</p>}</Card>)}</>}</main></div>;
}
function PaymentForm({id,data,onSubmitted}){
 const [methodId,setMethodId]=useState(String(data.methods[0]?.id||'')),[reference,setReference]=useState(''),[paidDate,setPaidDate]=useState(''),[amount,setAmount]=useState(''),[file,setFile]=useState(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const method=data.methods.find(m=>String(m.id)===methodId);
 async function submit(e){e.preventDefault();setBusy(true);setNotice('');try{
  if(!file||!['image/png','image/jpeg'].includes(file.type)||file.size>614400)throw new Error('Choose a PNG or JPEG screenshot up to 600 KB.');
  const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Could not read screenshot.'));reader.readAsDataURL(file);});
  await submitProof(id,{methodId:Number(methodId),reference,paidDate,amountMinor:Math.round(Number(amount)*100),image,mime:file.type});onSubmitted();
 }catch(err){setNotice(err.message);}finally{setBusy(false);}}
 if(data.submissions.some(s=>s.status==='pending'))return null;
 if(!method)return <p>Payment accounts are temporarily unavailable. Do not transfer money yet.</p>;
 return <Card as="form" className="sf-author-form" onSubmit={submit}><h2>1. Transfer the exact amount</h2><Select label="Payment method" value={methodId} onChange={e=>setMethodId(e.target.value)}>{data.methods.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Select><p>Account title: <strong>{method.account_title}</strong></p><p>Account number: <strong>{method.account_number}</strong></p><p>{method.instructions}</p><p>Transfer exactly <strong>{money(Number(data.order.total_minor),'PKR')}</strong>. Confirm the account title in your bank app before sending. This site does not generate an IBAN.</p><h2>2. Submit payment proof</h2><Field required label="Transaction ID / bank reference" maxLength={120} value={reference} onChange={e=>setReference(e.target.value)}/><Field required label="Payment date" type="date" max={new Date().toISOString().slice(0,10)} value={paidDate} onChange={e=>setPaidDate(e.target.value)}/><Field required label="Amount transferred (PKR)" type="number" step="0.01" min="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/><Field required label="Payment screenshot" hint="PNG or JPEG, maximum 600 KB. Hide unrelated balances and transactions. Only the owner can view the screenshot." type="file" accept="image/png,image/jpeg" onChange={e=>setFile(e.target.files[0]||null)}/>{notice&&<p role="alert">{notice}</p>}<Button type="submit" disabled={busy}>{busy?'Submitting…':'Submit for owner approval'}</Button><p>Access remains locked until approval. Check this page or My access &amp; orders for updates.</p></Card>;
}
