import { MST_TESTNET_CONFIG } from './mstNetwork';

// AgentEscrow ABI compiled from Phase 1 AgentEscrow.sol
export const AGENT_ESCROW_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_verifier", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "agreementId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "recruiter", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "seller", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "AgreementCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "agreementId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "seller", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "PaymentReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "agreementId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "recruiter", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "AgreementRefunded",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "agreementId", "type": "uint256" },
      { "internalType": "address", "name": "sellerAddress", "type": "address" }
    ],
    "name": "createAndFundAgreement",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "agreementId", "type": "uint256" }
    ],
    "name": "releasePayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "agreementId", "type": "uint256" }
    ],
    "name": "refundAgreement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "agreementId", "type": "uint256" }
    ],
    "name": "getAgreement",
    "outputs": [
      { "internalType": "address", "name": "recruiter", "type": "address" },
      { "internalType": "address", "name": "seller", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint8", "name": "status", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "agreementId", "type": "uint256" }
    ],
    "name": "isFunded",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const defaultContractAddress = '0x50D079035D538C69e65aa6e4F928Cd57cc13AbFA';
const configuredAddress = import.meta.env.VITE_MST_ESCROW_CONTRACT_ADDRESS || defaultContractAddress;

export const CONTRACT_CONFIG = {
  address: configuredAddress,
  abi: AGENT_ESCROW_ABI,
  isDeployed: Boolean(configuredAddress && configuredAddress.startsWith('0x')),
  network: MST_TESTNET_CONFIG
};
