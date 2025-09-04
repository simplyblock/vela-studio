import { openai } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'

const OPENAI_MODEL = 'gpt-4.1-2025-04-14'

export type ModelSuccess = {
  model: LanguageModel
  error?: never
}

export type ModelError = {
  model?: never
  error: Error
}

export type ModelResponse = ModelSuccess | ModelError

export const ModelErrorMessage =
  'No valid AI model available. Please set up a local AWS profile to use Bedrock, or pass an OPENAI_API_KEY to use OpenAI.'

/**
 * Retrieves the appropriate AI model based on available credentials.
 *
 * An optional routing key can be provided to distribute requests across
 * different Bedrock regions.
 */
export async function getModel(routingKey?: string, isLimited?: boolean): Promise<ModelResponse> {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY

  // [Joshen] Only for local/self-hosted, hosted should always only use bedrock
  if (hasOpenAIKey) {
    return {
      model: openai(OPENAI_MODEL),
    }
  }

  return {
    error: new Error(ModelErrorMessage),
  }
}
