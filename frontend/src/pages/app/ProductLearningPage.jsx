import { useCallback } from "react";
import { useParams } from "react-router-dom";
import CatalogLayout from "../../layouts/CatalogLayout.jsx";
import useRemoteData from "../../hooks/useRemoteData.js";
import { getProducts } from "../../services/commerceService.js";
import { ErrorState, Skeleton } from "../../components/ui/Feedback.jsx";
import { Card } from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { ProductContents } from "./PurchaseConfirmPage.jsx";

export default function ProductLearningPage(){
  const {id}=useParams();const fetcher=useCallback(async()=>{const products=await getProducts();const p=products.find(item=>String(item.id)===id);if(!p)throw new Error("This product is unavailable.");return p;},[id]);const {data:p,error,loading,reload}=useRemoteData(fetcher);
  if(loading)return <CatalogLayout><Skeleton rows={5}/></CatalogLayout>;
  if(error)return <CatalogLayout><ErrorState message={error.message} onRetry={reload}/></CatalogLayout>;
  return <CatalogLayout><header className="sf-page-heading"><div><span className="sf-eyebrow">YOUR SELECTED LEARNING PATH</span><h1>{p.name}</h1><p>{p.hasAccess?"Start an included course, then work through its assessment and projects. Use the course’s dashboard focus button to keep your next steps together.":"This selection is locked. Confirm a purchase to unlock its content."}</p></div><Button to="/purchases" variant="secondary">All my access</Button></header><Card>{p.hasAccess?<ProductContents product={p} links/>:<Button to={`/purchase/${p.id}/confirm`}>Review this selection</Button>}</Card></CatalogLayout>;
}
