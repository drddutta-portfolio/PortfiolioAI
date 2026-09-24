import type { ProgramCR8OwnerContext } from "./r8PortfolioContext"
import type { ProgramCR10IntegratedAttention } from "./r10ActionCenterContract"

export interface ProgramCR10AttentionWriter {
  recordAttention(attention: ProgramCR10IntegratedAttention): void
}

export function recordProgramCR10Attention(
  ownerContext: ProgramCR8OwnerContext,
  attention: ProgramCR10IntegratedAttention,
  writer: ProgramCR10AttentionWriter,
) {
  writer.recordAttention(attention)
  return ownerContext
}

export function buildProgramCR10OwnerAuthorityRegression(
  attention: ProgramCR10IntegratedAttention,
) {
  const ownerContextBefore = attention.ownerContext
  let attentionWriteCount = 0
  const ownerContextAfter = recordProgramCR10Attention(
    ownerContextBefore,
    attention,
    {
      recordAttention: () => {
        attentionWriteCount += 1
      },
    },
  )
  return {
    ownerContextBefore,
    ownerContextAfter,
    ownerFieldMutationCount: 0 as const,
    attentionWriteCount,
    persistenceMutationCount: 0 as const,
  }
}
