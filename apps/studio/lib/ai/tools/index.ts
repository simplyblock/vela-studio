import { filterToolsByOptInLevel } from '../tool-filter'
import { ToolSet } from 'ai'
import { getMcpTools } from './mcp-tools'
import { getSchemaTools } from './schema-tools'
import { getRenderingTools } from './rendering-tools'

export const getTools = async ({
  projectRef,
  connectionString,
  authorization,
  aiOptInLevel,
  accessToken,
}: {
  projectRef: string
  connectionString: string
  authorization?: string
  aiOptInLevel: any
  accessToken?: string
}) => {
  // Always include rendering tools
  let tools: ToolSet = getRenderingTools()

  // If self-hosted, only add fallback tools
  if (accessToken) {
    // If platform, fetch MCP and other platform specific tools
    const mcpTools = await getMcpTools({
      accessToken,
      projectRef,
      aiOptInLevel,
    })

    tools = {
      ...tools,
      ...mcpTools,
      ...getSchemaTools({
        projectRef,
        connectionString,
        authorization,
      }),
    }
  }

  // Filter all tools based on the (potentially modified) AI opt-in level
  const filteredTools: ToolSet = filterToolsByOptInLevel(tools, aiOptInLevel)

  return filteredTools
}
