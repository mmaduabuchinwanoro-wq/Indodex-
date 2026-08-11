export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  network: string;
  networkType: 'ERC-20' | 'TRC-20' | 'Native' | 'BEP-20' | 'TON' | 'Other';
  priceUsd: number;
  change24h: number;
  iconBg: string;
  iconColor: string;
  depositAddress: string;
  gasAssetSymbol: 'ETH' | 'TRX' | 'BNB' | 'TON' | 'SOL';
  decimals: number;
  minWithdraw: number;
  description: string;
}

export interface UserBalance {
  [symbol: string]: number;
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  balances: UserBalance;
  createdAt: string;
  updatedAt: string;
  isBlocked?: boolean;
}

export interface GlobalWalletAddresses {
  [symbol: string]: string;
}

export interface PlatformSettings {
  depositAddresses: GlobalWalletAddresses;
  lastAddressUpdateNotice?: {
    updatedAt: string;
    message: string;
    updatedBy: string;
  };
}

export type TransactionType = 'deposit' | 'withdrawal' | 'swap' | 'admin_adjustment';
export type TransactionStatus = 'completed' | 'pending' | 'intercepted_insufficient_gas' | 'failed';

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  type: TransactionType;
  fromSymbol?: string;
  fromAmount?: number;
  toSymbol?: string;
  toAmount?: number;
  amountUsd: number;
  feeUsd: number;
  status: TransactionStatus;
  timestamp: string;
  txHash?: string;
  note?: string;
  interceptorMessage?: string;
}
