import type { RecommendationTrackingRecord } from "../../data/recommendationPolicyRepository"
import type { RecommendationPreview } from "./sectorRecommendation"
import type { SuggestedWeightPreview } from "./weightRecommendation"

export type ActionBias = "ACCUMULATE" | "HOLD" | "REDUCE" | "EXIT_CANDIDATE" | "WAIT"
export type ActionTone = "POSITIVE" | "NEUTRAL" | "CAUTION" | "RISK"

export interface ActionBiasPreview {
  readonly actionBias: ActionBias
  readonly label: string
  readonly tone: ActionTone
  readonly headline: string
  readonly reasons: readonly string[]
}

function hasWeakMomentum(recommendation: RecommendationPreview) {
  return recommendation.cautions.some((item) => item.toLocaleLowerCase().includes("momentum"))
}

export function buildActionBiasPreview(input: {
  readonly recommendation: RecommendationPreview
  readonly weight: SuggestedWeightPreview | null
  readonly tracking: RecommendationTrackingRecord | null
}): ActionBiasPreview {
  const { recommendation, weight, tracking } = input
  const reasons: string[] = []
  const currentWeight = weight?.currentWeight ?? null

  if (recommendation.suggestedRole === "INSUFFICIENT" || !weight || weight.position === "UNAVAILABLE") {
    return {
      actionBias: "WAIT",
      label: "Wait",
      tone: "NEUTRAL",
      headline: "Wait for a complete, validated recommendation state.",
      reasons: ["The sector-specific role or weight range is not sufficiently validated yet."],
    }
  }

  if (recommendation.suggestedRole === "AVOID") {
    return currentWeight !== null && currentWeight > 0
      ? {
          actionBias: "EXIT_CANDIDATE",
          label: "Exit candidate",
          tone: "RISK",
          headline: "Review the position for a potential exit rather than adding exposure.",
          reasons: ["The current sector-specific recommendation is Avoid / do not add."],
        }
      : {
          actionBias: "WAIT",
          label: "Do not add",
          tone: "RISK",
          headline: "No allocation is currently suggested.",
          reasons: ["The current sector-specific recommendation is Avoid / do not add."],
        }
  }

  if (tracking?.transitionStatus === "CONFIRMED_DOWNGRADE") {
    if (weight.position === "ABOVE_RANGE") {
      return {
        actionBias: "REDUCE",
        label: "Reduce",
        tone: "RISK",
        headline: "A confirmed downgrade and excess portfolio weight support reducing exposure.",
        reasons: ["The role downgrade is confirmed across the configured persistence gate.", "Current weight is above the suggested range."],
      }
    }
    return {
      actionBias: "HOLD",
      label: "Hold · review",
      tone: "CAUTION",
      headline: "Do not increase the position while the confirmed downgrade is reviewed.",
      reasons: ["The recommendation downgrade is confirmed, but the current weight is not above the suggested range."],
    }
  }

  if (tracking?.transitionStatus === "PENDING_DOWNGRADE") {
    return {
      actionBias: "HOLD",
      label: "Hold · downgrade watch",
      tone: "CAUTION",
      headline: "Hold additions until the downgrade watch either clears or confirms.",
      reasons: ["A downgrade is forming but has not yet passed the persistence gate."],
    }
  }

  if (recommendation.suggestedRole === "WATCH") {
    if (weight.position === "ABOVE_RANGE") {
      return {
        actionBias: "REDUCE",
        label: "Reduce",
        tone: "CAUTION",
        headline: "Current exposure is above the Watch allocation range.",
        reasons: ["The stock is currently classified as Watch.", "Current weight exceeds the suggested Watch range."],
      }
    }
    return {
      actionBias: "WAIT",
      label: "Wait / watch",
      tone: "CAUTION",
      headline: "Keep the stock under observation rather than adding aggressively.",
      reasons: ["The current sector-specific recommendation is Watch."],
    }
  }

  if (weight.position === "ABOVE_RANGE") {
    return {
      actionBias: "REDUCE",
      label: "Reduce toward range",
      tone: "CAUTION",
      headline: "Current portfolio weight is above the suggested range.",
      reasons: ["Portfolio sizing is above the current sector- and risk-aware range."],
    }
  }

  if (weight.position === "WITHIN_RANGE") {
    return {
      actionBias: "HOLD",
      label: "Hold",
      tone: "POSITIVE",
      headline: "Current portfolio weight sits inside the suggested range.",
      reasons: ["No sizing adjustment is indicated by the current deterministic range."],
    }
  }

  if (weight.position === "BELOW_RANGE") {
    reasons.push("Current portfolio weight is below the suggested range.")
    if (hasWeakMomentum(recommendation)) {
      reasons.push("Weak momentum argues for staged additions rather than immediate full sizing.")
      return {
        actionBias: "ACCUMULATE",
        label: "Accumulate gradually",
        tone: "CAUTION",
        headline: "The position is underweight, but additions should be staged while momentum remains weak.",
        reasons,
      }
    }
    if (tracking?.transitionStatus === "PENDING_UPGRADE") {
      reasons.push("An upgrade is forming but is not yet confirmed.")
      return {
        actionBias: "ACCUMULATE",
        label: "Accumulate cautiously",
        tone: "POSITIVE",
        headline: "The position is underweight and the recommendation is improving, but confirmation is still pending.",
        reasons,
      }
    }
    return {
      actionBias: "ACCUMULATE",
      label: "Accumulate toward range",
      tone: "POSITIVE",
      headline: "Current portfolio weight is below the suggested range.",
      reasons,
    }
  }

  return {
    actionBias: "WAIT",
    label: "Wait",
    tone: "NEUTRAL",
    headline: "No deterministic sizing action is available yet.",
    reasons: ["The current recommendation state does not support a sizing action."],
  }
}
