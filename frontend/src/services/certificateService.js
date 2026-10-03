import { apiRequest,apiUrl } from "./apiClient.js";
export const getCertificateCatalog=()=>apiRequest("/certificates/catalog",{auth:true});
export const getMyCertificates=()=>apiRequest("/certificates/mine",{auth:true});
export const issueCertificate=id=>apiRequest(`/certificates/${id}/issue`,{method:"POST",auth:true});
export const verifyCertificate=code=>apiRequest(`/certificates/verify/${encodeURIComponent(code)}`);
export const certificatePdfUrl=code=>apiUrl(`/certificates/verify/${encodeURIComponent(code)}/pdf`);
export default{getCertificateCatalog,getMyCertificates,issueCertificate,verifyCertificate,certificatePdfUrl};
