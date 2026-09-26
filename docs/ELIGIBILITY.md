# Evidence-backed eligibility — implementation and demo runbook

## Status and scope

Implemented: versioned payout policy; wallet-signed server challenges; Reclaim SDK verification adapter; persistent sessions/receipts; CRE HTTP → policy → report → EVM workflow; forwarder/workflow-pinned receiver; account deduplication; replay protection; expiry; full-position wallet migration; and automated tests.

**Not yet demonstrated:** an authentic Stripe/Reclaim payout proof, a successful CLI simulation on this account, or CRE-originated Monad testnet delivery. The old Monad deployment remains the synthetic manual demo; these changed contracts require a **fresh deployment**. Nothing here deploys or enables a paid DON.

On 2026-09-24 the workflow compiled to WASM, but `cre workflow simulate` failed before execution because the existing login's token-refresh endpoint returned HTTP 500 (twice). Reauthenticate with `cre login` if needed after that service recovers. SDK capability tests are **mocks**, not a successful CLI simulation or DON consensus.

No compatible provider/proof has been supplied. The real service fails closed without reviewed provider configuration; it does not fall back to fixtures. See [PROVIDER.md](PROVIDER.md).

## Reproducible checks

From the repository root, with Node 22.13+ (SQLite support), Bun 1.2.21+, Foundry, CRE CLI and pinned dependencies:

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
npm run cre:test
forge test --root contracts -vv
npm run cre:compile
npm run eligibility:demo
```

The last command starts and stops a disposable localhost Anvil chain. It uses random throwaway accounts, **synthetic** normalized facts and a trusted local sender in place of the forwarder. It checks actual local token transfers, report ABI compatibility, replay rejection, fresh-proof same-account rejection, two-wallet migration, expiry, repayment and withdrawal. It is NOT Reclaim verification, CRE CLI execution or public-chain delivery.

### Actual CRE CLI fixture run

Terminal 1:

```sh
npm run eligibility:fixtures
```

Terminal 2:

```sh
npm run cre:simulate:fixture
```

This calls the separate synthetic HTTP server, runs policy in CRE, and returns an ABI-encoded report. `writeReport: false` means **no EVM write**. The committed fixture token is public test data, not a credential. Logs must label this `SYNTHETIC / NOT RECLAIM`.

To test EVM delivery, use the **simulation receiver** described below. Run with `writeReport: false` first, approve the exact returned report digest, then run the same receipt with `writeReport: true` and the receiver/registry addresses and RPC configured. A successful CLI dry run is not a mined transaction; `--broadcast` explicitly enables transactions. Never use a fixture-enabled configuration with real assets. There is intentionally no mainnet target.

## Authentic verifier setup

Keep these values in an ignored environment file, never the frontend:

```dotenv
RECLAIM_APP_ID=REPLACE
RECLAIM_APP_SECRET=REPLACE
RECLAIM_PROVIDER_ID=REPLACE
RECLAIM_PROVIDER_VERSION=REPLACE
RECLAIM_PROVIDER_HASHES=["0xREPLACE_WITH_REVIEWED_CONTENT_HASH"]
SOURCE_ID_KEY=REPLACE_WITH_32_RANDOM_BYTES_AS_64_HEX_CHARACTERS
VERIFIER_API_TOKEN=REPLACE_WITH_A_RANDOM_TOKEN_AT_LEAST_32_CHARACTERS
ELIGIBILITY_CHAIN_ID=10143
ELIGIBILITY_REGISTRY=REPLACE_WITH_NEW_REGISTRY_ADDRESS
ALLOW_RECLAIM_TEST_MODE=false
```

The provider must expose exactly the following **authenticated extracted fields**, all strings: `accountId` (Stripe `acct_...`), `currency` (`USD`), `status` (`paid`), `complete` (`true`), `testMode` (`true` or `false`), `windowStart`, `windowEnd` (Unix seconds), and `totalPayoutCents` (unsigned integer decimal). The window is exactly 90×86400 seconds, with end no later than the signed observation and no more than one day before it. A reviewed provider must establish completeness from authenticated pagination/server aggregation. Merely setting `complete=true` in user input proves nothing; the adapter only accepts the SDK's verified extraction.

Review and pin the provider's exact content hashes as well as its ID/version. The SDK's version-resolution mechanism can include patches; the verifier instead uses the explicit reviewed hash allowlist for content verification. TEE attestation is required. If the selected provider cannot satisfy these requirements, add a reviewed provider-specific adapter—do not disable validation to make a demo pass.

Run `node --env-file=.env.eligibility --import tsx eligibility/server.ts` from the repository root. The service binds **127.0.0.1 only**. Before exposing it remotely, add TLS, per-client rate limits, authentication/abuse controls, deployment secrets management and a privacy retention policy. SQLite lives under ignored `.local/`; protect backups. Reclaim SDK work runs in bounded child processes whose stdout/stderr are discarded to prevent SDK error logs exposing proof data.

API for the collaborator's frontend:

1. `POST /sessions` with `{ "subject": "0x..." }` → `{ sessionId, challenge, expiresAt }`.
2. Wallet signs the returned **exact** `challenge` using EIP-191 `signMessage`.
3. `POST /sessions/:id/authorize` with `{ "signature": "0x..." }` → `{ request }`. Import `JSON.stringify(request)` with Reclaim's `fromJsonString()` and launch verification.
4. `POST /sessions/:id/proof` with `{ "proof": <one authentic Reclaim proof> }` → `{ receiptId, status: "verified" }`. Failed proofs return a generic rejection; no raw errors are exposed.
5. Trigger CRE with `{ "receiptId": "..." }`. CRE retrieves immutable verified facts at `GET /facts/:receiptId` using the secret bearer token, derives eligibility, signs a report, and calls the receiver via the EVM capability.

Reclaim secrets and source pseudonymization keys do not enter CRE. The baseline **does disclose normalized payout totals to the verifier and CRE execution environment**; neither raw proofs nor totals go onchain. Private registry deployment is not confidentiality. Source pseudonyms, tiers, wallet links and expiry remain public and linkable.

## Policy and contract guarantees

`keccak256("proofline:payout-policy:v1:test-tokens")` is fixed in the code and registry. Demo thresholds:

| Verified 90-day USD payouts | Tier | Absolute ceiling (six-decimal pUSD) | Collateral LTV |
| --- | --- | --- | --- |
| $100–$999.99 | 1 | 50 | 50% |
| $1,000–$9,999.99 | 2 | 80 | 80% |
| $10,000+ | 3 | 120 | 80% |

These are **test policy constants, not underwriting**. Actual debt ceiling is the lower of the absolute ceiling and collateral-based limit. Both assets are valueless six-decimal demo tokens assumed 1:1; this remains overcollateralized. Below-minimum evidence is rejected, not automatically a revocation of a previously valid credential. There is no liquidation, pricing, interest or production lending risk model.

- Evidence mode is a one-way opt-in on a fresh registry. Legacy manual attestations cannot bypass it. Only the configured credit line may use its allowances or migrate positions.
- First accepted source pseudonym is bound permanently to one wallet. A wallet cannot stack sources. A fresh proof of the same source from another wallet fails even after expiry/revocation.
- Canonical claim digests and server session digests are consumed atomically. The server also persists consumption, so restart does not reset it. CRE can retry reading an immutable receipt; duplicate onchain acceptance fails.
- Source IDs are HMACs of application, Stripe account and test/live namespace, **not wallet, provider version or time window**. Preserve `SOURCE_ID_KEY`; changing it creates a new identity namespace. This prevents source reuse, not multiple legitimate accounts per person or cross-provider double counting. The MVP accepts one Stripe source, not arbitrary sources.
- New observations must be strictly later. Renewal **replaces** eligibility, never adds overlapping payout totals or clears debt.
- Observations must be at most one day old on acceptance. Eligibility expires seven days from the observation, not delivery. At expiry, all new evidence-mode borrowing stops; existing debt remains and repayment always works. No scheduled expiry transaction is necessary.
- `requestMigration(newWallet)` from the old wallet and `acceptMigration(oldWallet)` from the new one atomically move **all collateral and debt** with the source identity. Destination must have no position/identity. Old wallet is permanently retired for eligibility; old-address reports fail. Migration works after expiry but does not renew eligibility. Total debt/collateral are conserved.
- Existing repayment-vault budgets/grants and ERC20 approvals are NOT migrated. Revoke/withdraw old grants and establish new ones for the new borrower address. Assets already borrowed are not automatically transferred. Loss of the old wallet is not supported by this two-wallet recovery path.

## Receiver and fresh testnet deployment

`EligibilityReceiver` pins the forwarder, workflow ID and workflow owner; validates the 62-byte identity prefix (optionally followed by a two-byte report ID); checks report chain ID/registry; and invokes `submitEligibility`. The constructor can take a zero workflow ID to avoid a workflow-config/receiver-address dependency cycle: reports remain disabled until the registry root calls `pinWorkflowId` once with the final nonzero ID. A nonzero ID cannot be changed.

**CLI simulation uses a mock forwarder without workflow identity metadata.** It cannot use that strict receiver. `SimulationEligibilityReceiver` is the separate, explicitly centralized alternative, constructor-restricted to Anvil/Monad testnet. The operator must call `approveReport(keccak256(encodedReport), true)` for every exact report before the pinned mock forwarder can deliver it; acceptance consumes the approval. It ignores unauthenticated metadata but checks chain/registry. An outsider cannot fabricate a new approved report through the public mock forwarder. This proves transport/contract integration, NOT DON security. Operator approval is an extra test-only transaction, not part of the future authenticated DON flow. Use only valueless tokens.

The registry writer is the receiver contract, **not** the generic Chainlink forwarder. A root controller can rotate back to a self-hosted writer, which must submit the same versioned reports; that changes the trust model. Root remains a powerful trusted role.

`contracts/script/DeployEligibility.s.sol` creates six fresh test contracts and enables evidence mode. For CLI simulation supply `DEPLOYER_ADDRESS`, `CRE_FORWARDER_ADDRESS` (the documented mock), and explicit `CRE_SIMULATION_RECEIVER=true`. For a strict receiver leave that flag false and also supply `CRE_WORKFLOW_ID` and `CRE_WORKFLOW_OWNER`. Do not copy production forwarder assumptions into simulation. Verify addresses/metadata against Chainlink's current [forwarder directory](https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory) and [receiver documentation](https://docs.chain.link/cre/guides/workflow/using-evm-client/onchain-write/building-consumer-contracts).

Copy `cre/eligibility/config.monad.example.json` to ignored `config.monad.local.json` and fill real values. `project.yaml` reads `MONAD_TESTNET_RPC_URL`; `cre/secrets.yaml` maps `VERIFIER_API_TOKEN`. `CRE_ETH_PRIVATE_KEY` pays testnet transaction gas during broadcast. Use a dedicated funded testnet wallet and never share keys in chat.

Do not claim a successful authentic integration until you have: a reviewed provider; genuine proof accepted and tampered proof rejected; successful CRE CLI execution; a Monad transaction receipt; and registry/credit-line readbacks. The 65-second architecture video is a concept explainer, not evidence of those steps.

## Dependency notes

SDKs pinned: CRE 1.22.0 and Reclaim 5.8.2. `npm audit` currently reports upstream advisories in the existing agent0/Helia/libp2p dependency tree and Reclaim's uuid dependency. This prototype is not approved for production; no forced downgrade or broad dependency rewrite was made as part of this change.
