# ProofLine

Verified off-chain financial facts as reusable on-chain credentials. This directory implements the local contract demo and v2 additions: root-controlled oracle rotation, shared borrower repayment budgets, a reusable auto-repay component, corrected Envio event configuration, and ERC-8004 oracle registration/reconciliation. Reclaim verification, the CRE workflow, a running indexer, and the full Mera frontend are not connected yet. Nothing has been deployed to Monad by this project.

## Run it locally

Requires Foundry and Python 3. Dependencies are pinned to OpenZeppelin Contracts **v5.4.0**, forge-std **v1.10.0**, and Solidity **0.8.24** (Paris EVM target).

```sh
cd contracts
forge install --root . foundry-rs/forge-std@v1.10.0 OpenZeppelin/openzeppelin-contracts@v5.4.0 --no-git
forge test --root . -vv
python3 script/local-demo.py
```

The demo starts its own Anvil chain on a random local port, deploys five contracts, broadcasts a manual attestation, verifies receipts and token balances, checks expiry and delegated repayment, saves `deployments/local.json`, and stops its chain. It needs no secrets or real funds. Its addresses are **local addresses, not Monad deployments**.

The visible result is 100 pCOL deposited → 50 pUSD base borrowing limit → manual Tier 2 credential → 80 pUSD limit → 80 pUSD actually borrowed. A further borrow reverts. When the credential expires, the limit drops to 50 while debt remains 80.

## Contracts

- `AttestationRegistry`: one active credential per wallet, authorized writer, fixed root controller, rotatable/revocable writer, 30-day maximum validity, revocation, and consumed proof-hash tracking. Events never include the raw payout figure.
- `CreditLine`: deposit, borrow, repay, withdraw, and dedicated demo liquidity funding. Tier 2 or Tier 3 payment-processor credentials increase LTV from 50% to 80%. Every borrow/withdraw checks the current credential.
- `DemoToken`: two freely mintable six-decimal test tokens, pCOL and pUSD. The separate loan-token pool ensures lending does not spend deposited collateral.
- `RepaymentVault`: isolated borrower budgets, scoped agent keys, cumulative caps, expiry, revocation, and unused-budget withdrawal. It can only call the immutable credit line's `repayFor()`. See [repayment design and frontend flow](docs/REPAYMENT.md).

`maxBorrow(user)` is the **total debt ceiling**. `availableToBorrow(user)` is remaining headroom capped by pool liquidity. Expiry/revocation do not erase existing debt or disable repayment. Withdrawals cannot leave debt above the current limit.

Both tokens are assumed to have equal unit value; equal decimals alone do not establish that value. There is no price oracle, liquidation, interest, or LP withdrawal mechanism. Liquidity funding is a demo contribution, not an investment. Use only these valueless test tokens.

Root control uses `rotateOracle()` / `revokeOracle()` and emits `OracleRotated`. See the [rotation and recovery runbook](docs/ORACLE-OPERATIONS.md). The Solidity suite passes 35 tests, including 512 cases for each fuzz test and 8,192 invariant calls. The local demo then repays 10 pUSD through a capped grant, verifies 70 pUSD remaining debt, and withdraws the unused budget.

From this directory, with Node 22.9+:

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
npm run oracle:fork-demo
```

The last command requires internet and Anvil. It reads Monad's existing ERC-8004 contracts into a disposable local fork, tests real SDK registration/rotation/revocation, and saves `deployments/oracle-fork.json`. Its transactions stay on localhost. See [oracle identity operations](docs/ORACLE-IDENTITY.md) and [Envio configuration](indexer/README.md).

## Monad testnet deployment

Testnet chain ID **10143**, supplied RPC `https://testnet-rpc.monad.xyz` (chain ID checked). Replace the RPC with an Alchemy endpoint when available. A funded signing account is still required; Reclaim credentials cannot sign EVM transactions.

1. Copy `.env.example` to `.env`, fill `DEPLOYER_ADDRESS`, and fund its testnet MON via <https://faucet.monad.xyz>. Use a Foundry keystore. Omit optional root/writer variables to default them to the deployer for the manual demo.
2. From `contracts`, load your local configuration and deploy using your own keystore alias:

```sh
set -a
source ../.env
set +a
cast chain-id --rpc-url "$MONAD_TESTNET_RPC_URL"
forge script script/Deploy.s.sol:Deploy --root . \
  --rpc-url "$MONAD_TESTNET_RPC_URL" --sender "$DEPLOYER_ADDRESS" \
  --account YOUR_KEYSTORE_ALIAS --broadcast --slow
```

3. Save the printed addresses in `.env`, reload it, then run:

```sh
forge script script/ManualDemo.s.sol:ManualDemo --root . \
  --rpc-url "$MONAD_TESTNET_RPC_URL" --sender "$DEPLOYER_ADDRESS" \
  --account YOUR_KEYSTORE_ALIAS --broadcast --slow
```

The deploy and manual-demo scripts reject chains other than 31337 and 10143. The manual demo requires a fresh position and the deployer as temporary writer. It intentionally uses a **synthetic proof hash**, not an income proof. Do not describe this step as verified income.

Receipts are under `contracts/broadcast/<ScriptName>/10143/run-latest.json`; verify each receipt and contract bytecode before recording a testnet deployment. Derive Envio's future start block from the registry deployment receipt, not a simulated block number. No testnet deployment is claimed in this repository yet.

## Privacy and trust boundaries

The registry trusts its writer. Milestone 1 does not verify a TLS session, income, wallet ownership, or unique personhood. Consumed hashes prevent exact canonical-proof replay; they do not stop new proofs from the same Stripe account, alternate wallets, multiple accounts, or collusion. A separate account-deduplication design is needed if Sybil resistance remains a requirement.

The future baseline exposes the extracted total to the off-chain verification environment and publishes the wallet, tier, source category, expiry, and proof digest. A tier still reveals a financial range. Never hash only a low-entropy amount as `proofHash`; use the validated canonical proof identifier and a versioned domain. Raw figures, proofs, sessions, and API secrets must not appear in public logs, indexer entities, or browser bundles.

For CRE integration, deploy a receiver adapter that validates the Chainlink forwarder **and** the expected workflow identity; then rotate `registry.oracle` to that adapter. The registry is intentionally independent of CRE's transport. Merely setting `oracle` to a forwarder EOA/address is not a working CRE integration.

## Next milestone

Reclaim provider selection/build and standalone proof generation remain the next core pipeline milestone. See [provider requirements](docs/PROVIDER.md) and [verified integration notes](docs/INTEGRATION-NOTES.md). Borrower ERC-8004 identities and their transfer-risk mitigation remain deferred, as requested.
