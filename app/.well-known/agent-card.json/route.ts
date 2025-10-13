/**
 * ERC-8004 Agent Card Route
 *
 * This endpoint provides the agent identity card for Black Swan AI
 * following the ERC-8004 Trustless Agents specification.
 *
 * Spec: https://eips.ethereum.org/EIPS/eip-8004
 */

function withValidProperties(
  properties: Record<
    string,
    undefined | string | string[] | Record<string, any> | any[]
  >
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null;
    })
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || "https://blackswan.wtf";
  const API_URL = process.env.API_URL || "https://api.blackswan.wtf";
  const AGENT_DOMAIN = process.env.AGENT_DOMAIN || "blackswan.wtf";
  const AGENT_ADDRESS = process.env.AGENT_ADDRESS; // EVM address for the agent
  const AGENT_ID = process.env.AGENT_ID; // AgentID from the registry once registered
  const AGENT_SIGNATURE = process.env.AGENT_SIGNATURE; // Signature proving ownership of the address

  // ERC-8004 compliant Agent Card
  const agentCard = {
    // Standard A2A Protocol Fields
    name: "Black Swan AI",
    version: "1.0.0",
    description:
      "Advanced AI agent specialized in market risk analysis, black swan event detection, and market peak identification for cryptocurrency markets.",

    // Agent Metadata
    metadata: {
      domain: AGENT_DOMAIN,
      website: URL,
      iconUrl: `${URL}/logo.png`,
      heroImageUrl: `${URL}/og.png`,
      tagline: "Know when to sell.",
      category: "financial_analysis",
      tags: [
        "AI",
        "Market Analysis",
        "Risk Assessment",
        "BlackSwan Detection",
        "Peak Analysis",
      ],
    },

    // ERC-8004 Blockchain Registrations
    // This section will be populated once the agent is registered on-chain
    registrations:
      AGENT_ID && AGENT_ADDRESS && AGENT_SIGNATURE
        ? [
            {
              agentId: parseInt(AGENT_ID),
              agentAddress: AGENT_ADDRESS, // Format: "eip155:1:0x..." (CAIP-10)
              signature: AGENT_SIGNATURE,
            },
          ]
        : [],

    // ERC-8004 Trust Models Supported
    trustModels: [
      "feedback", // Client feedback and reputation system
      "inference-validation", // Crypto-economic validation through re-execution
      "tee-attestation", // Cryptographic verification (future support)
    ],

    // Agent Skills/Capabilities (A2A Protocol)
    skills: [
      {
        id: "blackswan_analysis",
        name: "BlackSwan Risk Analysis",
        description:
          "Analyzes market conditions to identify potential black swan events and systemic risks",
        version: "1.0.0",
        endpoint: `${API_URL}/api/agent/blackswan`,
        capabilities: [
          "real-time risk scoring (0-100 scale)",
          "confidence assessment",
          "market indicator analysis",
          "primary risk factor identification",
        ],
        inputSchema: {
          type: "object",
          properties: {
            includeHistorical: {
              type: "boolean",
              description: "Include historical analysis data",
            },
            timeRange: {
              type: "string",
              enum: ["24h", "7d", "30d"],
              description: "Time range for analysis",
            },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            confidence: { type: "string" },
            timestamp: { type: "number" },
            analysis: { type: "string" },
            reasoning: { type: "array", items: { type: "string" } },
            currentMarketIndicators: {
              type: "array",
              items: { type: "string" },
            },
            primaryRiskFactors: { type: "array", items: { type: "string" } },
          },
        },
      },
      {
        id: "market_peak_analysis",
        name: "Market Peak Detection",
        description:
          "Identifies potential market peaks and optimal exit points for cryptocurrency positions",
        version: "1.0.0",
        endpoint: `${API_URL}/api/agent/peak`,
        capabilities: [
          "market peak scoring (0-100 scale)",
          "key factor identification",
          "exit timing recommendations",
          "sentiment analysis integration",
        ],
        inputSchema: {
          type: "object",
          properties: {
            includeHistorical: {
              type: "boolean",
              description: "Include historical peak data",
            },
            timeRange: {
              type: "string",
              enum: ["24h", "7d", "30d"],
              description: "Time range for analysis",
            },
          },
        },
        outputSchema: {
          type: "object",
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            timestamp: { type: "number" },
            summary: { type: "string" },
            reasoning: { type: "array", items: { type: "string" } },
            keyFactors: { type: "array", items: { type: "string" } },
          },
        },
      },
      {
        id: "combined_market_signal",
        name: "Combined Market Signal",
        description:
          "Provides unified BUY/HOLD/SELL signals based on combined BlackSwan and Peak analysis",
        version: "1.0.0",
        endpoint: `${API_URL}/api/agent/market-signal`,
        capabilities: [
          "unified market signals (BUY/HOLD/SELL)",
          "combined score calculation",
          "real-time signal updates",
          "actionable recommendations",
        ],
        outputSchema: {
          type: "object",
          properties: {
            signal: { type: "string", enum: ["BUY", "HOLD", "SELL"] },
            description: { type: "string" },
            combinedScore: { type: "number" },
            timestamp: { type: "number" },
            blackswanScore: { type: "number" },
            peakScore: { type: "number" },
          },
        },
      },
    ],

    // ERC-8004 Feedback Data URI (for reputation system)
    feedbackDataURI: AGENT_ADDRESS ? `${URL}/api/agent/feedback` : undefined,

    // ERC-8004 Validation Requests URI (for validation system)
    validationRequestsURI: AGENT_ADDRESS
      ? `${URL}/api/agent/validation-requests`
      : undefined,

    // ERC-8004 Validation Responses URI (for validation system)
    validationResponsesURI: AGENT_ADDRESS
      ? `${URL}/api/agent/validation-responses`
      : undefined,

    // Agent Communication Endpoints
    endpoints: {
      home: `${API_URL}/api/home`,
      blackswanAnalysis: `${API_URL}/api/agent/blackswan`,
      peakAnalysis: `${API_URL}/api/agent/peak`,
      marketSignal: `${API_URL}/api/agent/market-signal`,
      health: `${API_URL}/api/health`,
      agentIdentity: `${URL}/.well-known/agent-card.json`,
    },

    // Data Sources & Methods
    dataSources: [
      "Real-time cryptocurrency market data",
      "Macroeconomic indicators",
      "On-chain analytics",
      "Social sentiment analysis",
      "News and event monitoring",
      "Technical indicators",
    ],

    // Update Frequency
    updateFrequency: {
      blackswanAnalysis: "Every 60 minutes",
      peakAnalysis: "Every 60 minutes",
      marketSignal: "Real-time (SSE)",
      historicalData: "30 days retention",
    },

    // Supported Networks (for future blockchain integration)
    supportedNetworks: [
      {
        chainId: "eip155:8453", // Base
        capabilities: ["identity", "reputation", "validation"],
      },
    ],

    // Compliance & Legal
    compliance: {
      dataRetention: "30 days for analysis data",
      privacyPolicy: `https://blackswanwtf.gitbook.io/docs/legal/privacy-policy`,
      termsOfService: `https://blackswanwtf.gitbook.io/docs/legal/terms-of-service`,
      disclaimer:
        "This agent provides analysis for informational purposes only. Not financial advice.",
    },

    // Contact & Support
    contact: {
      support: "bilal@oaiaolabs.com",
      documentation: `https://blackswanwtf.gitbook.io`,
      github: "https://github.com/blackswanwtf",
    },

    // Protocol Compliance
    protocols: [
      {
        name: "ERC-8004",
        version: "1.0.0",
        url: "https://eips.ethereum.org/EIPS/eip-8004",
      },
      {
        name: "A2A Protocol",
        version: "1.0.0",
        url: "https://a2a.ai",
      },
    ],

    // Timestamp
    lastUpdated: new Date().toISOString(),
  };

  return Response.json(withValidProperties(agentCard), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
