export interface Fund {
  id: string;
  name: string;
  description: string;
  bannerImage: string;
  risk: "low" | "medium" | "high" | "very high";
  lockDuration: string;
  unlockDate: string;
  depositDate: string;
  minimumInvestment: number;
  maximumInvestment: number;
  status: "waitlist" | "open" | "trading" | "closed";
  depositsOpen: boolean; // Track if fund is open for new deposits
  isVisible: boolean; // Control visibility on frontend (allows backend-only funds)
  isFeatured: boolean; // Feature fund on homepage (max 2 featured funds)
  strategy: string;
  // Real-time data fields
  contractAddress?: string;
  apiId?: string; // API identifier for this fund
  isRealTime?: boolean;
  performancePercent?: number;
  totalAssetsUnderManagement?: number;
  aiTradingPerformancePercent?: number;
  // New property names for stats
  fundPerformancePercentage?: number;
  tradingPerformancePercentage?: number;
  totalAssetsValue?: number;
  // Firestore metadata (stored as Firestore Timestamps, converted to ISO strings in frontend)
  createdAt?: string;
  updatedAt?: string;
}

// Firestore document structure for funds collection
export interface FundDocument extends Omit<Fund, "id"> {
  // Firestore will handle the document ID automatically
}

// User position from Firestore userPositions collection
export interface UserPosition {
  id: string; // Document ID
  amount: number; // Amount in USDC (e.g., 900)
  amount_raw: string; // Raw amount with decimals (e.g., "900000000")
  contractAddress: string; // Fund contract address for linking
  createdAt: string; // ISO string (converted from Firestore Timestamp)
  transactionHash: string; // Blockchain transaction hash
  type: "deposit" | "withdrawal"; // Transaction type
  uid: string; // User ID
  walletAddress: string; // User's wallet address
}

// Firestore document structure for userPositions collection
export interface UserPositionDocument
  extends Omit<UserPosition, "id" | "createdAt"> {
  createdAt: any; // Firestore Timestamp object
}

// User position with linked fund information
export interface UserPositionWithFund extends UserPosition {
  fund?: Fund; // Linked fund data (if found by contractAddress)
}

// Summary of user's position in a specific fund
export interface UserFundPosition {
  fund: Fund;
  totalDeposited: number; // Total amount deposited
  totalWithdrawn: number; // Total amount withdrawn
  currentValue: number; // Current position value
  profitLoss: number; // Profit/loss amount
  profitLossPercentage: number; // Profit/loss percentage
  positions: UserPosition[]; // All positions for this fund
  hasActivePosition: boolean; // Whether user has active position
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "yield" | "fee";
  amount: number;
  date: string;
  hash: string;
}

export interface UserFundInvestment {
  fundId: string;
  investmentAmount: number;
  investmentDate: string;
  currentValue: number;
  unlockDate: string;
  transactions: Transaction[];
}

export interface FundCardProps {
  fund: Fund;
  userInvestment?: UserFundInvestment;
  userPosition?: UserFundPosition; // User's position in this fund (if any)
  onClick: () => void;
  onViewPosition?: (userPosition: UserFundPosition) => void; // Callback for viewing position details
  showCardClickForPosition?: boolean; // Whether clicking the card should open position modal (for /funds page)
}
