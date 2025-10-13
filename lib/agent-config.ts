export interface AgentConfig {
  // AI-generated agent data (primary configuration)
  selectedTokens?: string[];
  strategy?: string;
  strategySummary?: string;
  riskProfile?: number; // 1-100 scale
  tradingFrequency?: number; // 1-100 scale

  // Configuration status
  isComplete: boolean;
  completionStatus?: "complete" | "partial" | "needs_refinement";
  confidence?: number; // 0-1 scale

  // Agent name
  name: string;
}

export const DEFAULT_CONFIG: AgentConfig = {
  selectedTokens: undefined,
  strategy: undefined,
  strategySummary: undefined,
  riskProfile: undefined,
  tradingFrequency: undefined,
  isComplete: false,
  completionStatus: undefined,
  confidence: undefined,
  name: "My Trading Agent",
};

export const RISK_PROFILES = {
  safe: {
    label: "Safe",
    description: "Conservative approach, capital preservation",
    defaultTargetReturn: 5,
    range: [1, 30],
  },
  standard: {
    label: "Standard",
    description: "Moderate risk/reward ratio",
    defaultTargetReturn: 15,
    range: [31, 70],
  },
  degen: {
    label: "Degen",
    description: "Higher risk for higher returns",
    defaultTargetReturn: 40,
    range: [71, 100],
  },
};

export const TRADING_FREQUENCY_PROFILES = {
  slow: {
    label: "Slow",
    description: "Conservative, low-frequency trading",
    range: [1, 30],
  },
  standard: {
    label: "Standard",
    description: "Regular trading frequency",
    range: [31, 70],
  },
  turbo: {
    label: "Turbo",
    description: "High-frequency, active trading",
    range: [71, 100],
  },
};

// Utility functions for converting between numerical values and labels
export function getRiskLabel(riskValue: number): string {
  if (riskValue >= 1 && riskValue <= 30) return "safe";
  if (riskValue >= 31 && riskValue <= 70) return "standard";
  if (riskValue >= 71 && riskValue <= 100) return "degen";
  return "standard"; // fallback
}

export function getFrequencyLabel(frequencyValue: number): string {
  if (frequencyValue >= 1 && frequencyValue <= 30) return "slow";
  if (frequencyValue >= 31 && frequencyValue <= 70) return "standard";
  if (frequencyValue >= 71 && frequencyValue <= 100) return "turbo";
  return "standard"; // fallback
}

export function getRiskValue(riskLabel: string): number {
  switch (riskLabel) {
    case "safe":
      return 20; // middle of safe range
    case "standard":
      return 50; // middle of standard range
    case "degen":
      return 80; // middle of degen range
    default:
      return 50; // fallback to standard
  }
}

export function getFrequencyValue(frequencyLabel: string): number {
  switch (frequencyLabel) {
    case "slow":
      return 20; // middle of slow range
    case "standard":
      return 50; // middle of standard range
    case "turbo":
      return 80; // middle of turbo range
    default:
      return 50; // fallback to standard
  }
}

export function getRiskProfile(riskValue: number) {
  const label = getRiskLabel(riskValue);
  return RISK_PROFILES[label as keyof typeof RISK_PROFILES];
}

export function getFrequencyProfile(frequencyValue: number) {
  const label = getFrequencyLabel(frequencyValue);
  return TRADING_FREQUENCY_PROFILES[
    label as keyof typeof TRADING_FREQUENCY_PROFILES
  ];
}

export function validateConfig(config: AgentConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.name || config.name.trim() === "") {
    errors.push("Agent name is required");
  }

  if (!config.selectedTokens || config.selectedTokens.length === 0) {
    errors.push("Selected tokens are required");
  }

  if (!config.strategy || config.strategy.trim() === "") {
    errors.push("Trading strategy is required");
  }

  if (!config.strategySummary || config.strategySummary.trim() === "") {
    errors.push("Strategy summary is required");
  }

  if (!config.riskProfile) {
    errors.push("Risk profile is required");
  }

  if (config.completionStatus !== "complete") {
    errors.push("Configuration must be complete");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function updateConfigFromLLM(
  config: AgentConfig,
  updates: Partial<AgentConfig>
): AgentConfig {
  const updatedConfig = { ...config, ...updates };

  // Ensure name is properly set
  if (updates.name && updates.name.trim() !== "") {
    updatedConfig.name = updates.name.trim();
  }

  // Check if config is complete
  const { isValid } = validateConfig(updatedConfig);
  updatedConfig.isComplete = isValid;

  return updatedConfig;
}

// Function to handle agentData from LLM responses
export function updateConfigFromAgentData(
  config: AgentConfig,
  agentData: any
): AgentConfig {
  const updatedConfig = { ...config };

  // Update agent data fields if provided
  if (agentData.selectedTokens) {
    updatedConfig.selectedTokens = agentData.selectedTokens;
  }

  if (agentData.strategy) {
    updatedConfig.strategy = agentData.strategy;
  }

  if (agentData.strategySummary) {
    updatedConfig.strategySummary = agentData.strategySummary;
  }

  if (agentData.riskProfile && agentData.riskProfile in RISK_PROFILES) {
    updatedConfig.riskProfile = agentData.riskProfile;
  }

  if (
    agentData.tradingFrequency &&
    agentData.tradingFrequency in TRADING_FREQUENCY_PROFILES
  ) {
    updatedConfig.tradingFrequency = agentData.tradingFrequency;
  }

  // Update completion status
  if (agentData.completionStatus) {
    updatedConfig.completionStatus = agentData.completionStatus;
  }

  if (agentData.confidence !== undefined) {
    updatedConfig.confidence = agentData.confidence;
  }

  // Update isComplete based on LLM's assessment
  if (agentData.isComplete !== undefined) {
    updatedConfig.isComplete = agentData.isComplete;
  }

  // Always re-validate the configuration to ensure isComplete is accurate
  const { isValid } = validateConfig(updatedConfig);
  updatedConfig.isComplete = isValid;

  return updatedConfig;
}
