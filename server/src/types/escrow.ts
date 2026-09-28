export type EscrowStatus = 
  | 'CREATED' 
  | 'FUNDED' 
  | 'IN_PROGRESS' 
  | 'VERIFIED' 
  | 'RELEASED' 
  | 'REFUNDED';

export interface IEscrowAgreement {
  agreementId: string;
  jobId: string;
  recruiterAgentId: string;
  screeningAgentId: string;
  recruiterWallet: string;
  sellerWallet: string;
  amountMSTC: number;
  status: EscrowStatus;
  onChainEscrowId?: number | string | null;
  contractAddress?: string | null;
  fundingTxHash?: string | null;
  releaseTxHash?: string | null;
  refundTxHash?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
