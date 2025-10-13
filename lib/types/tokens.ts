export interface TokenBalance {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: number;
  price?: number;
  marketValue?: number;
  usdBalance: number;
  tokenScore?: number;
  image?: string;
  chain?: string;
}
