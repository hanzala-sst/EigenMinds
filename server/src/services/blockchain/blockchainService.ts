export interface IBlockchainStatus {
  configured: boolean;
  status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'ERROR';
  networkName: string;
  chainId: number;
  contractAddress: string | null;
  message: string;
}

/**
 * Blockchain Service Boundary
 * Provides clean interface for future MST smart contract interactions.
 * Safely returns NOT_CONFIGURED when contract address or relay signer is absent.
 * NEVER fabricates fake transaction hashes.
 */
export class BlockchainService {
  private static contractAddress = process.env.VITE_MST_ESCROW_CONTRACT_ADDRESS || null;
  private static relayPrivateKey = process.env.MST_RELAY_PRIVATE_KEY || null;

  public static getStatus(): IBlockchainStatus {
    const isConfigured = Boolean(this.contractAddress && this.contractAddress.startsWith('0x'));

    return {
      configured: isConfigured,
      status: isConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      networkName: process.env.VITE_MST_NETWORK_NAME || 'MST Testnet',
      chainId: Number(process.env.VITE_MST_CHAIN_ID || 4545),
      contractAddress: this.contractAddress,
      message: isConfigured
        ? 'MST Testnet Escrow Contract configured.'
        : 'MST Escrow Contract not deployed/configured. Local off-chain mode active.'
    };
  }

  public static async createAndFundAgreement(
    agreementId: string,
    sellerWallet: string,
    amountMSTC: number
  ): Promise<{ success: boolean; status: string; txHash: string | null; message: string }> {
    const status = this.getStatus();
    if (!status.configured) {
      return {
        success: false,
        status: 'NOT_CONFIGURED',
        txHash: null,
        message: 'Blockchain contract address is absent. Agreement recorded off-chain as CREATED.'
      };
    }

    // Future Phase 3 implementation via @mstblockchain/mst-sdk or ethers
    return {
      success: false,
      status: 'PENDING_SIGNER',
      txHash: null,
      message: 'On-chain transaction requires user BridgeKey wallet signature.'
    };
  }

  public static async releasePayment(
    agreementId: string,
    onChainEscrowId?: string | number
  ): Promise<{ success: boolean; status: string; txHash: string | null; message: string }> {
    const status = this.getStatus();
    if (!status.configured || !this.relayPrivateKey) {
      return {
        success: false,
        status: 'NOT_CONFIGURED',
        txHash: null,
        message: 'MST Escrow Contract or Relayer Private Key absent. Agreement status updated off-chain.'
      };
    }

    return {
      success: false,
      status: 'NOT_CONFIGURED',
      txHash: null,
      message: 'Live MST transaction flow pending testnet deployment.'
    };
  }
}
