import {useCallback,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import CatalogLayout from '../../layouts/CatalogLayout.jsx';
import useRemoteData from '../../hooks/useRemoteData.js';
import Button from '../../components/ui/Button.jsx';
import {Card} from '../../components/ui/Card.jsx';
import {ErrorState,Skeleton} from '../../components/ui/Feedback.jsx';
import {getProducts,quoteOrder,createOrder} from '../../services/commerceService.js';
import {money} from './StorePage.jsx';
import './StorePage.css';

export default function PurchaseConfirmPage(){
  const {id}=useParams(),navigate=useNavigate();
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const fetcher=useCallback(async()=>{
    const products=await getProducts(),product=products.find(p=>String(p.id)===id);
    if(!product)throw new Error('This product is unavailable. Choose another option.');
    const alreadyPermanent=product.hasAccess&&product.kind!=='subscription';
    const quote=alreadyPermanent||!product.manualPrice?null:await quoteOrder({productIds:[product.id],currency:product.manualPrice.currency});
    return {product,quote};
  },[id]);
  const {data,error,loading,reload}=useRemoteData(fetcher);
  async function confirm(){setBusy(true);setNotice('');try{const result=await createOrder({productIds:[data.product.id],currency:data.quote.currency});if(result.order.totalMinor!==data.quote.totalMinor){setNotice('The price has changed. Refresh this review before continuing.');return;}navigate(`/checkout/${result.order.id}`);}catch(e){setNotice(e.message);}finally{setBusy(false);}}
  if(loading)return <CatalogLayout><Skeleton rows={5}/></CatalogLayout>;
  if(error)return <CatalogLayout><ErrorState message={error.message} onRetry={reload}/></CatalogLayout>;
  const {product:p,quote}=data,isMonthly=p.kind==='subscription';
  return <CatalogLayout><header className="sf-page-heading"><div><span className="sf-eyebrow">STEP 2 · REVIEW YOUR SELECTION</span><h1>{p.name}</h1><p>{p.description}</p></div><Button to="/store" variant="secondary">Change selection</Button></header><Card className="sf-purchase-review"><h2>Included in this purchase</h2><ProductContents product={p}/><p>{isMonthly?'This plan unlocks all content shown for 30 days after approval. Renewing before expiry adds another 30 days. Progress remains saved after expiry, but premium content locks until renewal.':'Access covers this selection only. Other premium products stay locked.'} Certificates require completed lessons, passed assessments, approved project evidence, and the stated readiness score.</p>{notice&&<p role="alert" className="sf-form-error">{notice}</p>}{p.hasAccess&&!isMonthly?<Button to={`/my-access/${p.id}`}>You already have access — start learning</Button>:<><strong className="sf-store__price">Total: {quote?money(quote.totalMinor,quote.currency):'PKR price not yet available'}</strong><p>{isMonthly?'This is a manual 30-day renewal with no automatic charge. ':'This is a one-time purchase. '}Pay by bank transfer or Easypaisa after confirming. Upload proof; access starts or extends only after owner verification.</p>{p.checkoutAvailable===false&&<p role="status">Payments are not open yet. You can keep using Free and return when checkout becomes available.</p>}<Button onClick={confirm} disabled={busy||!quote||p.checkoutAvailable===false}>{busy?'Preparing order…':p.hasAccess?'Renew for another 30 days':'Confirm selection and continue'}</Button></>}</Card></CatalogLayout>;
}

export function ProductContents({product,links=false}){
  const sections=[['courses','Courses','/courses/'],['assessments','Assessments','/assessments/'],['projects','Projects','/projects/'],['certificates','Certificate programs','/certificates']];
  return <div className="sf-product-contents">{sections.map(([key,label,path])=><section key={key}><h3>{label}</h3><ul>{product.includes[key].map(item=><li key={item.id}>{links?<Button variant="ghost" to={key==='certificates'?`${path}?productId=${product.id}`:`${path}${item.id}`}>{item.title}</Button>:item.title}</li>)}</ul></section>)}</div>;
}
