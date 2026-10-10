import {describe,it,expect} from "vitest";
import {evaluateBankPublicationAvailability} from "./v14-bank-publication-precision.ts";
const base={retrievedAt:"2026-10-09T19:06:22Z",reportingEnd:"2026-06-30",evaluationAsOf:"2026-10-10T00:00:00Z"};
const sha="a".repeat(64);
describe("distinct bank publication precision",()=>{
 it("A allows exact source-certified publication time only with verified hash and cutoff",()=>{
  const r=evaluateBankPublicationAvailability({...base,proof:{kind:"EXACT",publishedAt:"2026-07-18T17:00:00+05:30",sourceProofHash:sha}});
  expect(r.eligibleForFactualReview).toBe(true);
  expect(r.earliestProvenAvailabilityMs).toBe(Date.parse("2026-07-18T11:30:00Z"));
 });
 it("A refuses look-ahead use before issuer's exact publication instant",()=>{
  const r=evaluateBankPublicationAvailability({...base,proof:{kind:"EXACT",publishedAt:"2026-07-18T11:30:00Z",sourceProofHash:sha},historicalObservationAsOf:"2026-07-17T10:00:00Z"});
  expect(r.historicalApplicable).toBe(false);
 });
 it("B allows current factual review at conservative 23:59 IST bound without historical inference",()=>{
  const r=evaluateBankPublicationAvailability({...base,proof:{kind:"DATE_ONLY",publishedDate:"2026-07-18",sourceProofHash:sha}});
  expect(r.eligibleForFactualReview).toBe(true);
  expect(r.earliestProvenAvailabilityMs).toBe(Date.parse("2026-07-18T18:29:59.999Z"));
  expect(r.historicalApplicable).toBe(false);
 });
 it("C allows current factual review from first verified retrieval without inventing publication",()=>{
  const r=evaluateBankPublicationAvailability({...base,proof:{kind:"UNKNOWN_DATE",firstVerifiedRetrievalAt:base.retrievedAt,sourceProofHash:sha}});
  expect(r.eligibleForFactualReview).toBe(true);
  expect(r.historicalApplicable).toBe(false);
  expect(r.earliestProvenAvailabilityMs).toBe(Date.parse(base.retrievedAt));
 });
 it("DATE_ONLY does not admit before conservative availability bound",()=>{
  const r=evaluateBankPublicationAvailability({...base,evaluationAsOf:"2026-07-18T12:00:00Z",proof:{kind:"DATE_ONLY",publishedDate:"2026-07-18",sourceProofHash:sha}});
  expect(r.eligibleForFactualReview).toBe(false);
  expect(r.reason).toBe("BANK_PUBLICATION_AFTER_EVALUATION");
  expect(r.historicalApplicable).toBe(false);
 });
 it("C refuses unbound claimed earlier timestamps",()=>{
  expect(evaluateBankPublicationAvailability({...base,proof:{kind:"UNKNOWN_DATE",firstVerifiedRetrievalAt:"2026-07-18T00:00:00Z",sourceProofHash:sha}}).reason).toBe("BANK_UNKNOWN_PUBLICATION_NO_PROVEN_AVAILABILITY");
 });
 it("B rejects invalid dates and A rejects exact publication after cutoff",()=>{
  expect(evaluateBankPublicationAvailability({...base,proof:{kind:"DATE_ONLY",publishedDate:"2026-06-00",sourceProofHash:sha}}).eligibleForFactualReview).toBe(false);
  expect(evaluateBankPublicationAvailability({...base,proof:{kind:"EXACT",publishedAt:"2026-10-11T12:00:00Z",sourceProofHash:sha}}).reason).toBe("BANK_PUBLICATION_AFTER_EVALUATION");
 });
 it("rejects unsigned source artifacts",()=>{
  expect(evaluateBankPublicationAvailability({...base,proof:{kind:"EXACT",publishedAt:"2026-07-18T11:30:00Z",sourceProofHash:"fake"}}).eligibleForFactualReview).toBe(false);
 });
});
