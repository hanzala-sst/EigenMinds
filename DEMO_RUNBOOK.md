# EigenMinds Demo Runbook

## What This Is

EigenMinds demonstrates a complete agent-to-agent screening and escrow settlement flow on MST Testnet.

A recruiter AI agent locks payment in a smart contract. A screening AI agent evaluates candidates. An off-chain verification engine validates the results. Only after verification passes can the recruiter release the payment to the seller via BridgeKey.

---

## Verified Demo Evidence

The following transactions are confirmed on MST Testnet (`91562037`):

| Event | Agreement | Transaction Hash | Status |
|---|---|---|---|
| Escrow Funded | `613731` | `0x1791d4585dcb14b9962eba25083654801851131ced12027ab171877890d800ae` | Confirmed |
| Escrow Funded | `411463` | `0x22cbba9e4579132f0652d6cb59733a46e83b5dfff158f3bfcf45651943b4e0c2` | Confirmed |
| Payment Released | `613731` | `0x5361140859e9b826b9e48c842d1708f5c566704c1513a06b956c6a8d9a5b203e` | Confirmed ✅ |

Contract: `0x50D079035D538C69e65aa6e4F928Cd57cc13AbFA`  
Recruiter: `0xdA431CfFA06B4873b824cefAeb5f6F2248334D31`  
Seller (Screening Agent): `0x8fc62396f95b2212CF10E78EC695B8F55872dA16`

---

## Full Demo Flow (Steps 1–7)

### Prerequisites
- BridgeKey browser extension installed
- BridgeKey connected to MST Testnet (Chain ID `91562037`)
- Recruiter wallet has sufficient MSTC (faucet: `https://faucet.masterstroke.academy`)
- Local servers running:
  - Backend: `cd server && npm run dev` → `localhost:5000`
  - Frontend: `cd client && npm run dev` → `localhost:3000`

### Step 1 — Role Specification
Fill in the job requirement form:
- Title: `Senior Backend Engineer`
- Skills: `Node.js, Express, MongoDB, REST APIs`
- Experience: `2+ years`
- Click **Create Job Spec**

### Step 2 — Agent Discovery
- **Screening Agent Alpha** is automatically discovered
- Price: `1.0 MSTC` | Seller wallet: `0x8fc6...dA16`
- Click **Select Agent**

### Step 3 — Off-Chain Agreement
- Review recruiter wallet, seller wallet, amount
- Click **Confirm Terms & Register Agreement**
- This creates an off-chain record — NO blockchain transaction

### Step 4 — MST Escrow Funding

> ⚠️ **BEFORE CLICKING FUND:**
> The UI performs a read-only on-chain status check.
> If this check cannot complete, **funding is blocked**.
> Never fund if the on-chain state is uncertain.

> ⚠️ **If funding an existing agreement:**
> Use **"Resume Existing On-Chain Funded Agreement"** and enter the numeric ID.
> Do NOT click the Fund button for an agreement already funded on-chain.

**Normal flow:**
- Ensure BridgeKey is connected and on MST Testnet
- Click **Fund 1.0 MSTC Escrow**
- Button shows `Checking escrow status...` (pre-flight, ~2–5s)
- Then `Requesting BridgeKey Signature...` — **BridgeKey popup appears NOW**
- Review the transaction in BridgeKey — confirm **within 90 seconds**
- UI advances to Step 5 once BridgeKey returns the transaction hash

**Recovery flow (existing funded agreement):**
- Click **"Resume Existing On-Chain Funded Agreement"**
- Enter numeric ID (e.g. `613731`)
- Click **Verify & Resume** — on-chain status confirmed, UI advances to Step 5
- No transaction sent

### Step 5 — Synthetic Resume Dataset
- 5 synthetic candidates are loaded
- Review candidate profiles
- Click **Continue to Screening**

### Step 6 — Screening Agent Evaluation
Screening runs automatically via `AGENT-SCREENER-ALPHA`:

| Rank | Candidate | Score | Decision |
|---|---|---|---|
| 1 | Alex Mercer (Strong Match) | 100 | HIRE |
| 2 | Blake Taylor (Partial Match) | 80 | HIRE |
| 3 | Dylan Reed (Insufficient Experience) | 78 | CONSIDER |
| 4 | Charlie Vance (Missing Required Skill) | 25 | REJECT |
| 5 | Elliot Sky (Unrelated Candidate) | 0 | REJECT |

Click **Validate with Verification Engine** when results appear.

### Step 7 — Verification + Settlement

The 10-rule off-chain verification engine runs automatically:

| Rule | Result |
|---|---|
| Evaluation Output Completeness | ✅ PASS |
| JSON Schema Validation | ✅ PASS |
| Score Range Integrity (0–100) | ✅ PASS |
| All Candidates Evaluated | ✅ PASS |
| Unique Candidate IDs | ✅ PASS |

When verification passes, the **"Release Payment to Seller via BridgeKey"** button appears.

**To release payment:**
- Confirm you want to release `1.0 MSTC` to `0x8fc6...dA16`
- Click **Release Payment to Seller via BridgeKey**
- BridgeKey popup appears — review `releasePayment(numericId)` call
- Confirm in BridgeKey
- Release transaction hash is displayed with explorer link

---

## Critical Safety Rules

> ⚠️ **Never fund an agreement whose on-chain state cannot be verified.**
> If the pre-flight check fails or times out, funding is blocked. Retry when the network is available.

> ⚠️ **A timeout or unknown wallet response does not mean the blockchain transaction failed.**
> BridgeKey may have submitted a transaction that the UI did not receive a hash for (due to timeout).
> Before retrying any transaction, always check the on-chain state via the explorer or RPC.

> ⚠️ **Never send a second funding transaction for the same agreement.**
> The smart contract will reject a duplicate `createAndFundAgreement` call for the same ID.
> Use "Resume Existing Funded Agreement" if the UI state was lost.

> ⚠️ **Never release a payment unless verification has passed.**
> The verification engine must return `verified: true` before the release button appears.

---

## On-Chain Verification

Read agreement status at any time (no wallet needed):

```bash
# Backend RPC proxy
GET http://localhost:5000/api/blockchain/agreement/613731

# Returns: { numericId, recruiter, seller, amountMSTC, onChainStatus, isFunded, isReleased }
```

Or via MST Explorer: `https://testnet.mstscan.com/address/0x50D079035D538C69e65aa6e4F928Cd57cc13AbFA`
