/** Publication and availability precision for BANK factual admission.
 * This is a strict, side-effect-free candidate evaluator.
 * DATE_ONLY and UNKNOWN_DATE are approved for CURRENT factual review only.
 * They never establish historical point-in-time availability or reset reporting-age clocks.
 */
export type BankPublicationProof=
 |{kind:"EXACT";publishedAt:string;sourceProofHash:string}
 |{kind:"DATE_ONLY";publishedDate:string;sourceProofHash:string}
 |{kind:"UNKNOWN_DATE";firstVerifiedRetrievalAt:string;sourceProofHash:string};
export type BankAvailability={eligibleForFactualReview:boolean;earliestProvenAvailabilityMs:number|null;reason:string;historicalApplicable:boolean};
const exactDay=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
const fullStamp=(s:string)=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(s)&&Number.isFinite(Date.parse(s));
const hash=(s:string)=>/^[0-9a-f]{64}$/i.test(s);
export function evaluateBankPublicationAvailability(input:{proof:BankPublicationProof;retrievedAt:string;reportingEnd:string;evaluationAsOf:string;historicalObservationAsOf?:string}):BankAvailability{
 const fail=(reason:string,known:number|null=null):BankAvailability=>({eligibleForFactualReview:false,earliestProvenAvailabilityMs:known,reason,historicalApplicable:false});
 if(!hash(input.proof.sourceProofHash)||!exactDay(input.reportingEnd)||!fullStamp(input.retrievedAt)||!fullStamp(input.evaluationAsOf))return fail("BANK_PUBLICATION_PROVENANCE_INVALID");
 const retrieved=Date.parse(input.retrievedAt),evaluation=Date.parse(input.evaluationAsOf);
 if(retrieved>evaluation)return fail("BANK_PUBLICATION_RETRIEVAL_AFTER_EVALUATION");
 if(input.proof.kind==="EXACT"){
  if(!fullStamp(input.proof.publishedAt)||Date.parse(input.proof.publishedAt)<Date.parse(input.reportingEnd+"T00:00:00Z"))return fail("BANK_PUBLICATION_EXACT_INVALID");
  const t=Date.parse(input.proof.publishedAt);
  if(t>evaluation)return fail("BANK_PUBLICATION_AFTER_EVALUATION",t);
  return {eligibleForFactualReview:true,earliestProvenAvailabilityMs:t,reason:"BANK_EXACT_PUBLICATION_BOUND",historicalApplicable:input.historicalObservationAsOf?fullStamp(input.historicalObservationAsOf)&&Date.parse(input.historicalObservationAsOf)>=t:true};
 }
 if(input.proof.kind==="DATE_ONLY"){
  if(!exactDay(input.proof.publishedDate)||input.proof.publishedDate<input.reportingEnd)return fail("BANK_PUBLICATION_DATE_INVALID");
  // Indian issuer dates are 5h30 ahead of UTC. Local 23:59:59.999 IST is conservative.
  const bound=Date.parse(input.proof.publishedDate+"T18:29:59.999Z");
  if(bound>evaluation)return fail("BANK_PUBLICATION_AFTER_EVALUATION",bound);
  return {eligibleForFactualReview:true,earliestProvenAvailabilityMs:bound,reason:"BANK_DATE_ONLY_CURRENT_REVIEW_BOUND",historicalApplicable:false};
 }
 if(!fullStamp(input.proof.firstVerifiedRetrievalAt)||Date.parse(input.proof.firstVerifiedRetrievalAt)!==retrieved)return fail("BANK_UNKNOWN_PUBLICATION_NO_PROVEN_AVAILABILITY");
 // A byte-verified observation exists by retrieval; this is NOT issuer publication.
 // Retrieval is not publication. It proves only that these exact bytes were available by retrieval.
 // Approved use is CURRENT factual review only; historical PIT eligibility remains false.
 return {eligibleForFactualReview:true,earliestProvenAvailabilityMs:retrieved,reason:"BANK_UNKNOWN_CURRENT_REVIEW_AVAILABILITY_BOUND",historicalApplicable:false};
}
