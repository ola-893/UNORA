// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AttestationRegistry, DataSourceType, Tier} from "../src/AttestationRegistry.sol";
import {CreditLine} from "../src/CreditLine.sol";
import {DemoToken} from "../src/mocks/DemoToken.sol";

/// @notice Explicitly synthetic milestone-1 attestation. Does not generate or verify income proofs.
contract ManualDemo is Script {
    function run() external {
        require(block.chainid == 31337 || block.chainid == 10143, "local or Monad testnet only");
        address borrower = vm.envAddress("DEPLOYER_ADDRESS");
        AttestationRegistry registry = AttestationRegistry(vm.envAddress("ATTESTATION_REGISTRY_ADDRESS"));
        CreditLine line = CreditLine(vm.envAddress("CREDIT_LINE_ADDRESS"));
        require(registry.oracle() == borrower, "manual demo requires borrower to be temporary writer");
        require(address(line.registry()) == address(registry), "registry mismatch");
        require(
            line.collateralOf(borrower) == 0 && line.borrowedOf(borrower) == 0, "use a fresh demo position"
        );
        require(
            !registry.isValid(borrower, DataSourceType.PAYMENT_PROCESSOR_REVENUE, Tier.TIER_2),
            "already boosted"
        );
        DemoToken collateral = DemoToken(address(line.collateralToken()));
        DemoToken loan = DemoToken(address(line.loanToken()));

        vm.startBroadcast(borrower);
        collateral.mint(borrower, 100e6);
        loan.mint(borrower, 1000e6);
        loan.approve(address(line), 1000e6);
        line.fundLiquidity(1000e6);
        collateral.approve(address(line), 100e6);
        line.deposit(100e6);
        require(line.maxBorrow(borrower) == 50e6, "base limit must be 50");
        line.borrow(50e6);

        bytes32 syntheticHash = keccak256(
            abi.encode(
                "PROOFLINE_MANUAL_DEMO_NOT_A_PROOF", block.chainid, address(registry), borrower, block.number
            )
        );
        registry.submitAttestation(
            borrower,
            DataSourceType.PAYMENT_PROCESSOR_REVENUE,
            Tier.TIER_2,
            uint64(block.timestamp + 7 days),
            syntheticHash
        );
        require(line.maxBorrow(borrower) == 80e6, "boosted limit must be 80");
        line.borrow(30e6);
        require(line.borrowedOf(borrower) == 80e6, "total debt must be 80");
        vm.stopBroadcast();
        console2.log("Deposited pCOL", uint256(100));
        console2.log("Base pUSD limit", uint256(50));
        console2.log("Attested pUSD limit", uint256(80));
        console2.log("Borrowed pUSD", uint256(80));
        console2.log("Manual attestation only; no verified income yet.");
    }
}
