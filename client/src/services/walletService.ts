import { ethers } from 'ethers';
import { MST_TESTNET_CONFIG } from '../config/mstNetwork';
import { CONTRACT_CONFIG } from '../config/contractConfig';
import { AmountUtils } from '../utils/amountUtils';

export interface IWalletState {
  address: string | null;
  chainId: number | null;
  balanceMSTC: string;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class WalletService {
  /**
   * Checks if an EVM browser wallet provider (BridgeKey / window.ethereum) is available.
   */
  public static isProviderAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.ethereum);
  }

  /**
   * Connects to BridgeKey browser wallet.
   */
  public static async connectWallet(): Promise<IWalletState> {
    if (!this.isProviderAvailable()) {
      throw new Error(
        'BridgeKey browser wallet extension not detected! Please install BridgeKey extension to proceed.'
      );
    }

    try {
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in BridgeKey wallet.');
      }

      const address = accounts[0];
      const chainIdHex: string = await window.ethereum.request({
        method: 'eth_chainId'
      });
      const chainId = parseInt(chainIdHex, 16);

      const isCorrectNetwork = chainId === MST_TESTNET_CONFIG.chainIdDecimal;
      let balanceMSTC = '0.0';
      try {
        balanceMSTC = await this.getBalance(address);
      } catch (balErr) {
        console.warn('[WalletService] Could not fetch balance:', balErr);
      }

      return {
        address,
        chainId,
        balanceMSTC,
        isConnected: true,
        isCorrectNetwork,
        error: isCorrectNetwork ? null : `Connected to wrong network (Chain ID ${chainId}). MST Testnet requires Chain ID ${MST_TESTNET_CONFIG.chainIdDecimal}.`
      };
    } catch (error: any) {
      console.error('[WalletService] Connection error:', error);
      throw new Error(error.message || 'Failed to connect BridgeKey wallet.');
    }
  }

  /**
   * Queries balance for public wallet address in MSTC.
   */
  public static async getBalance(address: string): Promise<string> {
    if (!this.isProviderAvailable() || !address) return '0.0';
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceWei = await provider.getBalance(address);
      return AmountUtils.formatMSTC(balanceWei);
    } catch {
      return '0.0';
    }
  }

  /**
   * Attempts automatic network switch to MST Testnet (Chain ID 91562037).
   */
  public static async switchToMSTTestnet(): Promise<boolean> {
    if (!this.isProviderAvailable()) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MST_TESTNET_CONFIG.chainIdHex }]
      });
      return true;
    } catch (switchError: any) {
      // Error code 4902 indicates chain has not been added to BridgeKey
      if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain')) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: MST_TESTNET_CONFIG.chainIdHex,
                chainName: MST_TESTNET_CONFIG.networkName,
                rpcUrls: [MST_TESTNET_CONFIG.rpcUrl],
                nativeCurrency: {
                  name: 'MST Token',
                  symbol: MST_TESTNET_CONFIG.currencySymbol,
                  decimals: 18
                },
                blockExplorerUrls: [MST_TESTNET_CONFIG.explorerBaseUrl]
              }
            ]
          });
          return true;
        } catch (addError) {
          console.error('[WalletService] Failed to add MST Testnet:', addError);
          return false;
        }
      }
      console.error('[WalletService] Network switch error:', switchError);
      return false;
    }
  }

  /**
   * Submits createAndFundAgreement transaction directly via EIP-1193 eth_sendTransaction.
   * BYPASSES ethers BrowserProvider.getSigner() which hangs in BridgeKey environment.
   * Manually encodes ABI calldata for: createAndFundAgreement(uint256, address)
   */
  public static async fundEscrowAgreement(
    agreementNumericId: number,
    sellerAddress: string,
    amountMSTC: number
  ): Promise<{ txHash: string; contractAddress: string }> {
    if (!this.isProviderAvailable()) {
      throw new Error('BridgeKey wallet extension not detected.');
    }

    if (!CONTRACT_CONFIG.isDeployed || !CONTRACT_CONFIG.address) {
      throw new Error('MST AgentEscrow smart contract is not yet deployed to MST Testnet.');
    }

    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });

    let accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    }
    const fromAccount = accounts[0];
    console.log('[WalletService] Connected account:', AmountUtils.shortenAddress(fromAccount));

    // --- DIRECT EIP-1193 PATH (bypasses ethers BrowserProvider.getSigner()) ---
    const iface = new ethers.Interface([
      'function createAndFundAgreement(uint256 agreementId, address sellerAddress) payable'
    ]);
    const calldata = iface.encodeFunctionData('createAndFundAgreement', [
      BigInt(agreementNumericId),
      sellerAddress
    ]);

    // Convert amountMSTC to wei as hex string
    const valueWei = AmountUtils.parseMSTC(amountMSTC); // returns bigint
    const valueHex = '0x' + valueWei.toString(16);

    console.log(`[WalletService] Dispatching eth_sendTransaction to BridgeKey: ${amountMSTC} MSTC to contract ${CONTRACT_CONFIG.address}`);

    const sendPromise = (async () => {
      const txHash: string = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: fromAccount,
            to: CONTRACT_CONFIG.address,
            value: valueHex,
            data: calldata,
            gas: '0x493E0', // 300000 — explicit safe gas limit
          }
        ]
      });

      if (!txHash || typeof txHash !== 'string') {
        throw new Error('BridgeKey returned an empty or invalid transaction hash.');
      }

      console.log(`[WalletService] Transaction submitted! Hash: ${txHash}`);
      return {
        txHash,
        contractAddress: CONTRACT_CONFIG.address
      };
    })();

    const timeoutPromise = new Promise<{ txHash: string; contractAddress: string }>((_, reject) => {
      setTimeout(() => {
        reject(new Error('BridgeKey did not respond within 90 seconds. Check BridgeKey for a pending confirmation popup.'));
      }, 90000);
    });

    return Promise.race([sendPromise, timeoutPromise]);
  }

  /**
   * Submits payment release request (if recruiter chooses to trigger release directly via BridgeKey).
   */
  public static async releasePayment(
    agreementNumericId: number
  ): Promise<{ txHash: string }> {
    if (!CONTRACT_CONFIG.isDeployed || !CONTRACT_CONFIG.address) {
      throw new Error('Contract not deployed.');
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);

    const tx = await contract.releasePayment(agreementNumericId);
    return { txHash: tx.hash };
  }

  /**
   * Attaches event listeners for account and chain changes.
   */
  public static listenForAccountChanges(callback: (accounts: string[]) => void): void {
    if (this.isProviderAvailable() && window.ethereum.on) {
      window.ethereum.on('accountsChanged', callback);
    }
  }

  public static listenForChainChanges(callback: (chainIdHex: string) => void): void {
    if (this.isProviderAvailable() && window.ethereum.on) {
      window.ethereum.on('chainChanged', callback);
    }
  }
}
