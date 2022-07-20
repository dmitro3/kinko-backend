import BigNumber from 'bignumber.js';

export interface ILaunchpadInfo {
  launchpadOwner: string;
  sToken: string;
  bToken: string;
  amount: BigNumber;
  tokensPerBaseToken: BigNumber;
  maxSpendPerBuyer: BigNumber;
  softcap: BigNumber;
  hardcap: BigNumber;
  liquidityPercent: number;
  listingRatePercent: number;
  lockPeriod: bigint;
  startBlockDate: Date;
  endBlockDate: Date;
  is_BNB: boolean;
}

export interface ILaunchpadFeeInfo {
  energyfiTokenFeePercent: number;
  referralFeePercent: number;
  baseFeeAddress: string;
  tokenFeeAddress: string;
  referralFeeAddress: string;
}

export interface ILaunchpadStatus {
  forceFailed: boolean;
  lpGenerationComplete: boolean;
  whitelistOnly: boolean;
  lpGenerationTimestamp: bigint;
  totalBaseCollected: BigNumber;
  totalBaseWithdrawn: BigNumber;
  totalTokensSold: BigNumber;
  totalTokensWithdrawn: BigNumber;
  numBuyers: bigint;
  round1Length: bigint;
}

export type IIloStatus = 'upcoming' | 'round1' | 'round2' | 'saleDone' | 'success' | 'failed';

export interface IIlo {
  iloName: string;
  creatorAddress: string;
  launchpadAddress: string;
  saleTokenAddress: string;
  saleTokenName: string;
  saleTokenSymbol: string;
  baseTokenAddress: string;
  baseTokenName: string;
  baseTokenSymbol: string;
  hardcap: string;
  softcap: string;
  startBlockDate: string;
  endBlockDate: string;
  logoFileName: string;
  headerImageFileName: string;
  telegramURL: string;
  twitterURL: string;
  websiteURL: string;
  whitepaperURL: string;
  description: string;
  status: IIloStatus;
  earlyAccessTokenAddress: string;
  earlyAccessTokenAmount: string;
  forceFailed: boolean;
  lpGenerationComplete: boolean;
  whitelistOnly: boolean;
  lpGenerationTimestamp: string;
  totalBaseCollected: string;
  totalBaseWithdrawn: string;
  totalTokensSold: string;
  totalTokensWithdrawn: string;
  numBuyers: number;
  round1Length: number;
  liquidityRatePercent: number;
  round1EndDate: string;
  lockPeriod: string;
  maxSpendPerBuyer: string;
  presaleAmount: string;
  energyfiTokenFeePercent: number;
  saleTokenTotalSupply: string;
  listingRatePercent: number;
  is_Bnb: boolean;
  addLiquidityTransactionHash: string;
  referral?: any;
  category?: string | null;
}
