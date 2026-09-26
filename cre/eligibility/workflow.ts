import {
  HTTPCapability, HTTPClient, EVMClient, handler, consensusIdenticalAggregation,
  getNetwork, hexToBase64, bytesToHex, type Runtime, type NodeRuntime, type HTTPPayload,
} from "@chainlink/cre-sdk";
import { isAddress, type Address } from "viem";
import { deriveEligibility, encodeEligibilityReport, requireCondition, type PolicyConfig } from "../../eligibility/policy.js";

export type Config = PolicyConfig & {
  verifierUrl: string;
  receiver: Address;
  authorizedEVMAddress: string;
  writeReport: boolean;
};

function fetchFacts(runtime: NodeRuntime<Config>, receiptId: string, token: string): string {
  const response = new HTTPClient().sendRequest(runtime, {
    url: `${runtime.config.verifierUrl}/facts/${receiptId}`,
    method: "GET", headers: { Authorization: `Bearer ${token}` },
  }).result();
  requireCondition(response.statusCode === 200, "Verifier rejected receipt");
  requireCondition(response.body.length < 16_384, "Verifier response too large");
  return new TextDecoder().decode(response.body);
}

export function onEligibilityRequest(runtime: Runtime<Config>, payload: HTTPPayload): string {
  requireCondition(payload.input.length < 1024, "Trigger must contain only a receipt ID");
  const input = JSON.parse(new TextDecoder().decode(payload.input));
  requireCondition(typeof input.receiptId === "string" && /^[A-Za-z0-9-]{1,80}$/.test(input.receiptId), "Invalid receipt ID");
  // The trigger supplies an opaque ID, never a caller-selected URL or unverified facts.
  const token = runtime.getSecret({ id: "VERIFIER_API_TOKEN" }).result().value;
  const raw = runtime.runInNodeMode(fetchFacts, consensusIdenticalAggregation<string>())(input.receiptId, token).result();
  const report = deriveEligibility(JSON.parse(raw), runtime.config, Math.floor(runtime.now().getTime() / 1000));
  const encoded = encodeEligibilityReport(report, runtime.config);
  runtime.log("Eligibility policy passed; no raw payout amounts logged.");
  if (!runtime.config.writeReport) return encoded;
  requireCondition(runtime.config.chainId === 10143, "CRE write target must be Monad testnet");
  requireCondition(isAddress(runtime.config.receiver) && !/^0x0+$/.test(runtime.config.receiver), "Configure receiver");
  const network = getNetwork({ chainFamily: "evm", chainSelectorName: "monad-testnet", isTestnet: true });
  requireCondition(network, "Monad testnet unavailable");
  const signed = runtime.report({ encodedPayload: hexToBase64(encoded), encoderName: "evm",
    signingAlgo: "ecdsa", hashingAlgo: "keccak256" }).result();
  const result = new EVMClient(network.chainSelector.selector).writeReport(runtime, {
    receiver: runtime.config.receiver, report: signed, gasConfig: { gasLimit: "1000000" },
  }).result();
  requireCondition(result.txStatus === 2 && result.receiverContractExecutionStatus !== 1, "Onchain report delivery failed");
  return bytesToHex(result.txHash ?? new Uint8Array(32));
}

export function initWorkflow(config: Config) {
  requireCondition(typeof config.writeReport === "boolean" && typeof config.allowFixtures === "boolean"
    && typeof config.allowTestMode === "boolean", "Invalid workflow flags");
  requireCondition(config.verifierUrl.startsWith("https://") || /^http:\/\/(127\.0\.0\.1|localhost):[0-9]+$/.test(config.verifierUrl), "HTTPS verifier required except loopback");
  requireCondition(config.providerId && config.providerVersion && isAddress(config.registry), "Incomplete configuration");
  const authorizedKeys = config.authorizedEVMAddress
    ? [{ type: "KEY_TYPE_ECDSA_EVM" as const, publicKey: config.authorizedEVMAddress }]
    : [];
  requireCondition(!config.authorizedEVMAddress || isAddress(config.authorizedEVMAddress), "Invalid trigger signer");
  requireCondition(config.allowFixtures || authorizedKeys.length === 1, "Configure HTTP trigger signer");
  return [handler(new HTTPCapability().trigger({ authorizedKeys }), onEligibilityRequest)];
}
