// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

enum DataSourceType {
    PAYMENT_PROCESSOR_REVENUE,
    GIG_PLATFORM_EARNINGS,
    REMITTANCE_HISTORY
}

enum Tier {
    NONE,
    TIER_1,
    TIER_2,
    TIER_3
}

struct Attestation {
    DataSourceType sourceType;
    Tier tier;
    uint64 issuedAt;
    uint64 expiresAt;
    bytes32 proofHash;
}

/// @notice Stores an oracle's assessment, not raw financial data or a verified ZK proof.
/// @dev One active credential per wallet. This registry does not establish unique personhood.
contract AttestationRegistry {
    uint64 public constant MAX_VALIDITY = 30 days;
    address public immutable rootController;
    address public oracle;
    mapping(address subject => Attestation) public attestations;
    mapping(bytes32 proofHash => bool) public usedProofHashes;

    error ZeroAddress();
    error NotOracle();
    error NotRoot();
    error InvalidTier();
    error InvalidExpiry();
    error InvalidProofHash();
    error ProofAlreadyUsed();

    event OracleRotated(address indexed previousOracle, address indexed newOracle);
    event AttestationSubmitted(
        address indexed subject, DataSourceType sourceType, Tier tier, uint64 expiresAt, bytes32 proofHash
    );
    event AttestationRevoked(address indexed subject);

    constructor(address rootController_, address initialOracle) {
        if (rootController_ == address(0)) revert ZeroAddress();
        rootController = rootController_;
        _rotateOracle(initialOracle);
    }

    modifier onlyRoot() {
        if (msg.sender != rootController) revert NotRoot();
        _;
    }

    modifier onlyOracle() {
        if (oracle == address(0) || msg.sender != oracle) revert NotOracle();
        _;
    }

    /// @dev Milestone 1 uses a manual writer. Milestone 3 can rotate to a CRE receiver adapter.
    function rotateOracle(address newOracle) external onlyRoot {
        _rotateOracle(newOracle);
    }

    function revokeOracle() external onlyRoot {
        _rotateOracle(address(0));
    }

    function submitAttestation(
        address subject,
        DataSourceType sourceType,
        Tier tier,
        uint64 expiresAt,
        bytes32 proofHash
    ) external onlyOracle {
        if (subject == address(0)) revert ZeroAddress();
        if (tier == Tier.NONE) revert InvalidTier();
        if (expiresAt <= block.timestamp || expiresAt > block.timestamp + MAX_VALIDITY) {
            revert InvalidExpiry();
        }
        if (proofHash == bytes32(0)) revert InvalidProofHash();
        if (usedProofHashes[proofHash]) revert ProofAlreadyUsed();

        // The writer must supply a canonical proof identifier and verify wallet/session binding.
        // Hashing an arbitrary JSON serialization is not sufficient replay protection.
        usedProofHashes[proofHash] = true;
        attestations[subject] = Attestation(sourceType, tier, uint64(block.timestamp), expiresAt, proofHash);
        emit AttestationSubmitted(subject, sourceType, tier, expiresAt, proofHash);
    }

    function revoke(address subject) external onlyOracle {
        if (subject == address(0)) revert ZeroAddress();
        delete attestations[subject];
        // Consumed proof hashes stay consumed after revocation.
        emit AttestationRevoked(subject);
    }

    function isValid(address subject, DataSourceType sourceType, Tier minTier) external view returns (bool) {
        Attestation memory a = attestations[subject];
        return minTier != Tier.NONE && a.tier != Tier.NONE && a.sourceType == sourceType && a.tier >= minTier
            && a.expiresAt > block.timestamp;
    }

    function _rotateOracle(address newOracle) private {
        emit OracleRotated(oracle, newOracle);
        oracle = newOracle;
    }
}
