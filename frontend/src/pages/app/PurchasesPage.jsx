import Button from '../../components/ui/Button.jsx';
import {useCallback} from 'react';
import {ReceiptText,ShieldCheck} from 'lucide-react';
import AppNav from '../../components/layout/AppNav.jsx';
import {Badge,Card} from '../../components/ui/Card.jsx';
import {EmptyState,ErrorState,Skeleton} from '../../components/ui/Feedback.jsx';
import useRemoteData from '../../hooks/useRemoteData.js';
import {getCommerceAccount} from '../../services/commerceService.js';
import './StorePage.css';
const money=(amount,currency)=>new Intl.NumberFormat(undefined,{style:'currency',currency}).format(amount/100);
export default function PurchasesPage(){
  const fetcher=useCallback(()=>getCommerceAccount(),[]),{data,error,loading,reload}=useRemoteData(fetcher);
  return <div><AppNav/><main id="main-content" tabIndex="-1" className="container sf-purchases"><header><p className="mono"><ReceiptText size={15}/> Orders and access</p><h1>Your purchase history</h1><p>Only active access grants unlock premium content. Pending orders do not grant access.</p></header>{loading?<Skeleton rows={5}/>:error?<ErrorState message={error.message} onRetry={reload}/>:<><section><h2>Active access</h2>{data.access.length?<div className="sf-store__grid">{data.access.map(item=><Card key={item.productId}><ShieldCheck/><h3>{item.name}</h3><Badge tone="teal">Active</Badge><Button to={`/my-access/${item.productId}`}>Open my content</Button>{item.kind==='subscription'&&<Button variant="secondary" to={`/purchase/${item.productId}/confirm`}>Renew monthly access</Button>}<p>Granted through {item.source} on {new Date(item.grantedAt).toLocaleDateString()}.{item.expiresAt?` Access ends ${new Date(item.expiresAt).toLocaleString()}.`:' Permanent access.'}</p></Card>)}</div>:<EmptyState title="No active access" description="You are using Free. Explore previews or choose a Skill Pass, Career Bundle, or monthly plan." action={<Button to="/store">Choose access</Button>}/>}</section><section><h2>Orders</h2>{data.orders.length?<div className="sf-order-list">{data.orders.map(order=><Card key={order.id}><div><strong>Order #{order.id}</strong><Badge>{order.status}</Badge></div><p>{order.items.map(item=>item.name).join(', ')}</p><strong>{money(order.totalMinor,order.currency)}</strong><small>{new Date(order.createdAt).toLocaleString()}</small><Button variant="secondary" to={order.status==='paid'?`/receipts/${order.id}`:`/checkout/${order.id}`}>{order.status==='paid'?'View receipt':'Payment details and status'}</Button></Card>)}</div>:<EmptyState title="No orders yet" description="Server-priced orders you create will appear here."/>}<p className="sf-purchases__policy">{data.refundPolicy}</p></section></>}</main></div>;
}
