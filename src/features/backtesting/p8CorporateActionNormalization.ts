export const P8_B3_NORMALIZATION_VERSION = "P8_B3_NORMALIZATION_V1" as const

export type P8B3IdentityState = "RESOLVED" | "AMBIGUOUS" | "UNRESOLVED"
export type P8B3ActionType =
  | "CASH_DIVIDEND" | "SPLIT" | "BONUS" | "RIGHTS"
  | "MERGER" | "DEMERGER" | "SYMBOL_CHANGE" | "DELISTING" | "OTHER"

export type P8B3ActionObservation = {
  observationId: string
  historicalIdentityId: string | null
  identityResolutionState: P8B3IdentityState
  rawPurpose: string
  faceValue?: string | number | null
  exDate?: string | null
}

export type P8B3Normalization =
  | {
      state: "READY"
      normalizationVersion: typeof P8_B3_NORMALIZATION_VERSION
      actionType: P8B3ActionType
      effectiveDate: string
      historicalIdentityId: string
      normalizedTerms: Record<string, string>
    }
  | {
      state: "BLOCKED"
      normalizationVersion: typeof P8_B3_NORMALIZATION_VERSION
      actionType: P8B3ActionType
      effectiveDate: string | null
      historicalIdentityId: string | null
      normalizedTerms: Record<string, string>
      blockerReason: string
    }

function cleanPurpose(value: string): string {
  return value.replace(/\s+/gu, " ").trim()
}

function numberToken(value: string): string {
  return value.replace(/,/gu, "").trim()
}

function classifyType(purpose: string): P8B3ActionType {
  const p = purpose.toLowerCase()
  if (/dividend/u.test(p)) return "CASH_DIVIDEND"
  if (/(face value split|sub-division|subdivision|stock split|consolidation)/u.test(p)) return "SPLIT"
  if (/\bbonus\b/u.test(p)) return "BONUS"
  if (/\bright/u.test(p)) return "RIGHTS"
  if (/demerger|spin[- ]?off/u.test(p)) return "DEMERGER"
  if (/(amalgam|merger)/u.test(p)) return "MERGER"
  if (/(symbol change|name change)/u.test(p)) return "SYMBOL_CHANGE"
  if (/delist/u.test(p)) return "DELISTING"
  return "OTHER"
}

function block(
  observation: P8B3ActionObservation,
  actionType: P8B3ActionType,
  normalizedTerms: Record<string, string>,
  reason: string,
): P8B3Normalization {
  return {
    observationId: observation.observationId,
    historicalIdentityId: observation.historicalIdentityId,
    normalizationVersion: P8_B3_NORMALIZATION_VERSION,
    actionType,
    state: "BLOCKED",
    effectiveDate: observation.exDate ?? null,
    normalizedTerms,
    blockerReason: reason,
  }
}

function ready(
  observation: P8B3ActionObservation,
  actionType: P8B3ActionType,
  normalizedTerms: Record<string, string>,
): P8B3Normalization {
  if (!observation.historicalIdentityId || !observation.exDate) {
    return block(observation, actionType, normalizedTerms, "resolved identity and ex-date are required")
  }
  return {
    observationId: observation.observationId,
    historicalIdentityId: observation.historicalIdentityId,
    normalizationVersion: P8_B3_NORMALIZATION_VERSION,
    actionType,
    state: "READY",
    effectiveDate: observation.exDate,
    normalizedTerms,
  }
}

export function normalizeP8B3CorporateAction(observation: P8B3ActionObservation): P8B3Normalization {
  const purpose = cleanPurpose(observation.rawPurpose)
  const actionType = classifyType(purpose)

  if (observation.identityResolutionState !== "RESOLVED" || !observation.historicalIdentityId) {
    return block(
      observation,
      actionType,
      { rawPurpose: purpose },
      `identity resolution is ${observation.identityResolutionState}`,
    )
  }
  if (!observation.exDate) {
    return block(observation, actionType, { rawPurpose: purpose }, "ex/effective date is unavailable")
  }

  if (actionType === "CASH_DIVIDEND") {
    const match = purpose.match(/(?:Rs|Re)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/-)?\s*Per Share/iu)
    const amountPerShare = match?.[1]
    if (!amountPerShare) return block(observation, actionType, { rawPurpose: purpose }, "cash amount per share is not explicit")
    return ready(observation, actionType, {
      rawPurpose: purpose,
      cashDistributionPerShare: numberToken(amountPerShare),
    })
  }

  if (actionType === "SPLIT") {
    const match = purpose.match(/From\s+(?:Rs|Re)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/-)?\s*Per Share\s+To\s+(?:Rs|Re)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/-)?\s*Per Share/iu)
    const oldFaceValueToken = match?.[1]
    const newFaceValueToken = match?.[2]
    if (!oldFaceValueToken || !newFaceValueToken) return block(observation, actionType, { rawPurpose: purpose }, "old and new face values are not explicit")
    const oldFaceValue = numberToken(oldFaceValueToken)
    const newFaceValue = numberToken(newFaceValueToken)
    return ready(observation, actionType, {
      rawPurpose: purpose,
      operation: Number(oldFaceValue) > Number(newFaceValue) ? "SPLIT" : "CONSOLIDATION",
      oldFaceValue,
      newFaceValue,
    })
  }

  if (actionType === "BONUS") {
    const match = purpose.match(/Bonus\s+([0-9]+(?:\.[0-9]+)?)\s*:\s*([0-9]+(?:\.[0-9]+)?)/iu)
    const bonusShares = match?.[1]
    const heldShares = match?.[2]
    if (!bonusShares || !heldShares) return block(observation, actionType, { rawPurpose: purpose }, "bonus ratio is not explicit")
    return ready(observation, actionType, {
      rawPurpose: purpose,
      bonusShares: numberToken(bonusShares),
      heldShares: numberToken(heldShares),
    })
  }

  if (actionType === "RIGHTS") {
    const match = purpose.match(/Rights\s+([0-9]+(?:\.[0-9]+)?)\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*@\s*Premium\s+(?:Rs|Re)\s*([0-9]+(?:\.[0-9]+)?)/iu)
    const rightsShares = match?.[1]
    const heldShares = match?.[2]
    const premiumPerShare = match?.[3]
    if (!rightsShares || !heldShares || !premiumPerShare || observation.faceValue === null || observation.faceValue === undefined) {
      return block(observation, actionType, { rawPurpose: purpose }, "rights entitlement/premium/face-value terms are incomplete")
    }
    return ready(observation, actionType, {
      rawPurpose: purpose,
      rightsShares: numberToken(rightsShares),
      heldShares: numberToken(heldShares),
      premiumPerShare: numberToken(premiumPerShare),
      faceValue: String(observation.faceValue),
    })
  }

  if (actionType === "DEMERGER" || actionType === "MERGER") {
    return block(observation, actionType, { rawPurpose: purpose }, "successor entitlement and valuation lineage are not explicit in the source observation")
  }

  return block(observation, actionType, { rawPurpose: purpose }, "no approved deterministic normalization contract for this action")
}
