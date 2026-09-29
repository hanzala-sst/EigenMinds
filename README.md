# EigenMinds — Agent-to-Agent Recruitment Screening

**Hackathon Project** | MST Testnet | React + Vite + Node.js + Hardhat

EigenMinds is an agent-to-agent recruitment platform where a recruiter AI agent commissions a screening AI agent to evaluate candidates, with payment secured in a blockchain escrow smart contract and only released after off-chain verification passes.

---

## Architecture

```
Recruiter Agent (UI)
    ↓  BridgeKey Wallet
MST Testnet AgentEscrow Contract  ←→  On-chain escrow / settlement
    ↓
Screening Agent (Node.js backend)
    ↓  deterministic scoring
Off-chain Verification Engine (10 rules)
    ↓  verified = true
BridgeKey Wallet → releasePayment(agreementId)
    ↓
Seller (Screening Agent Wallet) receives 1.0 MSTC
```

**Stack:**
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + MongoDB (optional) + TypeScript
- Smart Contract: Solidity 0.8.28, Hardhat, MST Testnet
- Wallet: BridgeKey browser extension — EIP-1193 direct `eth_sendTransaction` (no `getSigner()`)

---

## MST Testnet

| Parameter | Value |
|---|---|
| Network Name | MST Testnet |
| Chain ID | `91562037` |
| RPC URL | `https://testnetrpc.mstblockchain.com` |
| Currency | MSTC |
| Explorer | `https://testnet.mstscan.com` |
| Faucet | `https://faucet.masterstroke.academy` |

---

## AgentEscrow Smart Contract

| Parameter | Value |
|---|---|
| Contract Address | `0x50D079035D538C69e65aa6e4F928Cd57cc13AbFA` |
| Network | MST Testnet (Chain ID 91562037) |
| Compiler | Solidity 0.8.28 |
| Functions | `createAndFundAgreement`, `releasePayment`, `refundAgreement`, `getAgreement`, `isFunded` |

---

## Verified Live Transactions

### Escrow Funding — Agreement 613731
| Field | Value |
|---|---|
| Agreement ID (on-chain) | `613731` |
| Funding Tx | `0x1791d4585dcb14b9962eba25083654801851131ced12027ab171877890d800ae` |
| Amount | `1.0 MSTC` |
| Recruiter | `0xdA431CfFA06B4873b824cefAeb5f6F2248334D31` |
| Seller (Screening Agent) | `0x8fc62396f95b2212CF10E78EC695B8F55872dA16` |

### Payment Release — Agreement 613731 (SETTLED ✅)
| Field | Value |
|---|---|
| Release Tx | `0x5361140859e9b826b9e48c842d1708f5c566704c1513a06b956c6a8d9a5b203e` |
| Block | `5794563` |
| Sender | `0xdA431CfFA06B4873b824cefAeb5f6F2248334D31` (recruiter) |
| Recipient | `0x8fc62396f95b2212CF10E78EC695B8F55872dA16` (seller) |
| Amount Released | `1.0 MSTC` |
| Final Status | `Released` |
| Receipt Status | `SUCCESS` |
| Gas Used | `46,945` |
| Event | `PaymentReleased(613731, seller, 1.0 MSTC)` |

### Escrow Funding — Agreement 411463
| Field | Value |
|---|---|
| Agreement ID (on-chain) | `411463` |
| Funding Tx | `0x22cbba9e4579132f0652d6cb59733a46e83b5dfff158f3bfcf45651943b4e0c2` |
| Amount | `1.0 MSTC` |
| Current Status | `Funded` (available for future release) |

---

## Key Technical Design Decisions

### Direct EIP-1193 (`eth_sendTransaction`) — Not `getSigner()`
The BridgeKey wallet extension does not respond to `ethers.BrowserProvider.getSigner()` — the call hangs indefinitely. All on-chain write transactions use the direct EIP-1193 path:
```typescript
window.ethereum.request({ method: 'eth_sendTransaction', params: [{ from, to, value, data, gas }] })
```
ABI encoding still uses `ethers.Interface.encodeFunctionData(...)`.

### Preflight Duplicate-Funding Protection
Before every `createAndFundAgreement` call, the UI performs a read-only on-chain status check. If the check times out or fails, **funding is blocked** (not silently skipped). The user sees a clear retry message. This prevents accidental double-funding from a slow RPC response.

### Agreement Recovery
An existing funded agreement can be resumed without a new transaction via:
`POST /api/agreements/recover` — verifies on-chain `getAgreement(numericId)` and upserts a canonical off-chain record (`AGR-{numericId}-DEMO`).

---

## Running Locally

```bash
# Backend
cd server && npm install && npm run dev

# Frontend
cd client && npm install && npm run dev
```

Backend: `http://localhost:5000`  
Frontend: `http://localhost:3000`

Required: BridgeKey browser extension connected to MST Testnet.

---

## Tests

```bash
# Smart contract (18/18)
cd contracts && npx hardhat test

# Backend logic (13/13)
cd server && npx ts-node src/tests/runTests.ts

# Frontend build (0 errors)
cd client && npm run build
```

---

## Security Notes
- No private keys in frontend code
- No relay signer used for user-facing transactions
- All on-chain writes require explicit BridgeKey user confirmation
- Duplicate-funding protection blocks on timeout (does not skip)
- Recovery flow verifies on-chain state before creating any record
