// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script} from "forge-std/Script.sol";
import {InfinitoToken} from "../contracts/InfinitoToken.sol";
import {InfinitoPhysicalVault} from "../contracts/InfinitoPhysicalVault.sol";

/// @notice Deployment must be initiated and paid for by an authorized treasury operator.
/// @dev This file cannot deploy on its own and must never be run in a CI job.
/// @dev Multisig addresses must belong to the organization's responsible signatories.
contract DeployInfinito is Script {
    event DeploymentRecorded(uint256 indexed chainId, address indexed token, address indexed vault, address treasury, address vaultOwner);

    function run() external returns (InfinitoToken token, InfinitoPhysicalVault vault) {
        require(block.chainid == 137 || block.chainid == 80002, "INFT: unsupported chain");

        address treasury = vm.envAddress("INFT_TREASURY_MULTISIG");
        address voucherSigner = vm.envAddress("INFT_VOUCHER_SIGNER");
        address vaultOwner = vm.envAddress("INFT_VAULT_OWNER_MULTISIG");
        uint256 deployerKey = vm.envUint("INFT_DEPLOYER_PRIVATE_KEY");

        require(treasury != address(0), "INFT: treasury required");
        require(voucherSigner != address(0), "INFT: signer required");
        require(vaultOwner != address(0), "INFT: vault owner required");
        require(deployerKey != 0, "INFT: deployer key required");

        vm.startBroadcast(deployerKey);
        token = new InfinitoToken(treasury);
        vault = new InfinitoPhysicalVault(address(token), voucherSigner, vaultOwner);
        vm.stopBroadcast();

        emit DeploymentRecorded(block.chainid, address(token), address(vault), treasury, vaultOwner);
    }
}
