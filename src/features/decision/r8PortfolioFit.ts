import Decimal from "decimal.js"
import {
  PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
  type ProgramCR8PortfolioFitResult,
} from "./r8PortfolioFitContract"
import type { ProgramCR8R7Reference } from "./r8PortfolioDecisionContract"

export interface ProgramCR8PortfolioFitEvaluationInput {
  readonly assetClass: string
  readonly portfolioContextSnapshotId: string | null
  readonly ownerRole: string | null
  readonly currentWeight: string | null
  readonly minimumAllocation: string | null
  readonly maximumAllocation: string | null
  readonly r7: ProgramCR8R7Reference | null
}

function decimal(value: string | null, field: string): Decimal | null {
  if (value === null) return null
  try {
    return new Decimal(value)
  } catch {
    throw new Error(`Program C R8 Portfolio Fit received invalid decimal for ${field}.`)
  }
}

function suggestedOwnerRole(input: ProgramCR8R7Reference | null) {
  if (!input?.suggestedRole) return null
  if (input.suggestedRole === "CORE_CANDIDATE") return "CORE"
  if (input.suggestedRole === "SATELLITE_CANDIDATE") return "SATELLITE"
  return null
}

export function evaluateProgramCR8PortfolioFit(
  input: ProgramCR8PortfolioFitEvaluationInput,
): ProgramCR8PortfolioFitResult {
  if (input.assetClass.trim().toUpperCase() !== "EQUITY") {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
      state: "NOT_APPLICABLE",
      applicable: false,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      ownerRole: input.ownerRole,
      currentWeight: input.currentWeight,
      blockers: [],
      reasonCodes: ["ASSET_NOT_APPLICABLE"],
    }
  }

  if (!input.portfolioContextSnapshotId?.trim()) {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
      state: "BLOCKED_PREREQUISITE",
      applicable: true,
      sourcePortfolioContextSnapshotId: null,
      ownerRole: input.ownerRole,
      currentWeight: input.currentWeight,
      blockers: ["PORTFOLIO_CONTEXT_SNAPSHOT_MISSING"],
      reasonCodes: ["PORTFOLIO_CONTEXT_SNAPSHOT_MISSING"],
    }
  }

  const ownerRole = input.ownerRole?.trim() || null
  if (!ownerRole) {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
      state: "BLOCKED_PREREQUISITE",
      applicable: true,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      ownerRole: null,
      currentWeight: input.currentWeight,
      blockers: ["OWNER_ROLE_CONTEXT_MISSING"],
      reasonCodes: ["OWNER_ROLE_CONTEXT_MISSING"],
    }
  }

  let currentWeight: Decimal | null
  let minimum: Decimal | null
  let maximum: Decimal | null
  try {
    currentWeight = decimal(input.currentWeight, "currentWeight")
    minimum = decimal(input.minimumAllocation, "minimumAllocation")
    maximum = decimal(input.maximumAllocation, "maximumAllocation")
  } catch {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
      state: "REVIEW_REQUIRED",
      applicable: true,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      ownerRole,
      currentWeight: input.currentWeight,
      blockers: ["PORTFOLIO_FIT_DECIMAL_REVIEW_REQUIRED"],
      reasonCodes: ["PORTFOLIO_FIT_DECIMAL_INVALID"],
    }
  }

  if (currentWeight === null) {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
      state: "BLOCKED_PREREQUISITE",
      applicable: true,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      ownerRole,
      currentWeight: null,
      blockers: ["CURRENT_WEIGHT_MISSING"],
      reasonCodes: ["CURRENT_WEIGHT_MISSING"],
    }
  }

  if (minimum !== null && maximum !== null && minimum.gt(maximum)) {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
      state: "REVIEW_REQUIRED",
      applicable: true,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      ownerRole,
      currentWeight: currentWeight.toString(),
      blockers: ["OWNER_ALLOCATION_RANGE_INVALID"],
      reasonCodes: ["OWNER_ALLOCATION_RANGE_INVALID"],
    }
  }

  if (maximum !== null && currentWeight.gt(maximum)) {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
      state: "CONCENTRATION_REVIEW",
      applicable: true,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      ownerRole,
      currentWeight: currentWeight.toString(),
      blockers: [],
      reasonCodes: ["CURRENT_WEIGHT_ABOVE_OWNER_MAXIMUM"],
    }
  }

  if (minimum !== null && currentWeight.lt(minimum)) {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
      state: "FIT_TENSION",
      applicable: true,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      ownerRole,
      currentWeight: currentWeight.toString(),
      blockers: [],
      reasonCodes: ["CURRENT_WEIGHT_BELOW_OWNER_MINIMUM"],
    }
  }

  const suggested = suggestedOwnerRole(input.r7)
  if (suggested && suggested !== ownerRole) {
    return {
      version: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
      state: "ROLE_COMPATIBILITY_REVIEW",
      applicable: true,
      sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
      ownerRole,
      currentWeight: currentWeight.toString(),
      blockers: [],
      reasonCodes: ["RECOMMENDATION_OWNER_ROLE_TENSION"],
    }
  }

  const hasOwnerRange = minimum !== null || maximum !== null
  return {
    version: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
    state: hasOwnerRange ? "FIT_SUPPORTED" : "FIT_NEUTRAL",
    applicable: true,
    sourcePortfolioContextSnapshotId: input.portfolioContextSnapshotId,
    ownerRole,
    currentWeight: currentWeight.toString(),
    blockers: [],
    reasonCodes: [
      hasOwnerRange
        ? "CURRENT_WEIGHT_WITHIN_OWNER_CONFIGURED_RANGE"
        : "OWNER_LIMIT_NOT_CONFIGURED_RULE_DISABLED",
    ],
  }
}
