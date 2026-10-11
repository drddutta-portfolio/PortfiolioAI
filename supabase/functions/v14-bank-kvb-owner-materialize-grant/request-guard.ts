export const BANK_V14_PROJECT="lrgpjimipfkyoqbpsqzz";
export const BANK_V14_PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2";
export const BANK_V14_KVB="be55b3cc-0400-45af-84aa-2a95e2c361c5";
export const BANK_V14_ACTION="P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS";
export function ownerMatches(authenticatedId:unknown, portfolioOwnerId:unknown, anonymous=false):boolean{
 return !anonymous&&typeof authenticatedId==="string"&&authenticatedId.length>0&&authenticatedId===portfolioOwnerId;
}
export function validKvbGrantRequest(b:Record<string,unknown>):boolean{
 return b.action===BANK_V14_ACTION && b.portfolioId===BANK_V14_PORTFOLIO&&b.securityId===BANK_V14_KVB
  && b.confirmation==="ISSUE_KVB_V14_SINGLE_USE_MATERIALIZATION_GRANT"
  &&typeof b.requestId==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.requestId);
}
