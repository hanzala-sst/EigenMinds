/**
 * Single source of truth for MST Testnet configuration.
 * Verified parameters:
 * Network Name: MST Testnet
 * Chain ID: 4545 (Decimal) / 0x11C1 (Hexadecimal)
 * RPC URL: https://testnetrpc.mstblockchain.com
 * Currency Symbol: MSTC
 * Faucet URL: https://faucet.masterstroke.academy
 * Explorer URL: https://mstscan.com
 */
export const MST_TESTNET_CONFIG = {
  networkName: import.meta.env.VITE_MST_NETWORK_NAME || 'MST Testnet',
  chainIdDecimal: Number(import.meta.env.VITE_MST_CHAIN_ID || 91562037),
  chainIdHex: `0x${Number(import.meta.env.VITE_MST_CHAIN_ID || 91562037).toString(16)}`,
  rpcUrl: import.meta.env.VITE_MST_RPC_URL || 'https://testnetrpc.mstblockchain.com',
  currencySymbol: 'MSTC',
  currencyDecimals: 18,
  faucetUrl: import.meta.env.VITE_MST_FAUCET_URL || 'https://faucet.masterstroke.academy',
  explorerBaseUrl: import.meta.env.VITE_MST_EXPLORER_URL || 'https://testnet.mstscan.com'
};
