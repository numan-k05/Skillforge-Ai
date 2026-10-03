import {apiRequest,apiUrl,getToken} from './apiClient.js';
export const getManualOrder=id=>apiRequest(`/manual-payments/orders/${id}`,{auth:true});
export const submitProof=(id,body)=>apiRequest(`/manual-payments/orders/${id}/proof`,{auth:true,method:'POST',body});
export const getPaymentSettings=()=>apiRequest('/manual-payments/admin/settings',{auth:true});
export const savePaymentSettings=body=>apiRequest('/manual-payments/admin/settings',{auth:true,method:'PUT',body});
export const getSubmissions=()=>apiRequest('/manual-payments/admin/submissions',{auth:true});
export const reviewPayment=(id,body)=>apiRequest(`/manual-payments/admin/submissions/${id}/review`,{auth:true,method:'POST',body});
export async function getProofImage(id){
  const response=await fetch(apiUrl(`/manual-payments/admin/submissions/${id}/proof`),{headers:{Authorization:`Bearer ${getToken()}`}});
  if(!response.ok) throw new Error('Could not open this screenshot. Refresh your session and try again.');
  return URL.createObjectURL(await response.blob());
}
