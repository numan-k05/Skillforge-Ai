import { useCallback } from "react";
import { useParams } from "react-router-dom";
import CatalogLayout from "../../layouts/CatalogLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import useRemoteData from "../../hooks/useRemoteData.js";
import { getReceipt } from "../../services/commerceService.js";
import "./StorePage.css";

export default function PaymentResultPage(){
  const {id}=useParams();const fetcher=useCallback(()=>getReceipt(id),[id]);const {data,error,loading,reload}=useRemoteData(fetcher);
  if(loading)return <CatalogLayout><Skeleton rows={3}/></CatalogLayout>;
  if(error)return <CatalogLayout><ErrorState message={error.message} onRetry={reload}/></CatalogLayout>;
  const paid=data.status==="paid";
  return <CatalogLayout><Card className="sf-purchase-review"><h1>{paid?"Your selected content is unlocked":"Payment is not confirmed"}</h1><p>{paid?"Your payment is confirmed. Open your selection below to begin.":`Order status: ${data.status}. This order does not currently provide access.`}</p><div className="sf-checkout__actions">{paid&&data.items.map(item=><Button key={item.productId} to={`/my-access/${item.productId}`}>Start {item.name}</Button>)}<Button to={`/receipts/${id}`} variant="secondary">View order details</Button>{!paid&&<Button to="/store">Choose a skill or career</Button>}</div></Card></CatalogLayout>;
}
