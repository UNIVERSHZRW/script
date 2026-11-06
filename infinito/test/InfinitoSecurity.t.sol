// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {InfinitoToken} from "../contracts/InfinitoToken.sol";
import {InfinitoPhysicalVault} from "../contracts/InfinitoPhysicalVault.sol";

contract InfinitoSecurityTest is Test {
    InfinitoToken internal token;
    InfinitoPhysicalVault internal vault;
    uint256 internal constant SIGNER_PK = 0xA11CE;
    address internal treasury = address(this);
    address internal collector = address(0xBEEF);
    bytes32 internal constant COIN = keccak256("INFT-SECURITY-ONE");

    function setUp() public {
        token = new InfinitoToken(treasury);
        vault = new InfinitoPhysicalVault(address(token), vm.addr(SIGNER_PK), treasury);
    }

    function voucher(bytes32 coinId, address to, uint256 deadline) internal returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_PK, vault.redeemDigest(coinId, to, deadline));
        return abi.encodePacked(r, s, v);
    }

    function testTokenCannotMintAdditionalSupply() public view {
        assertEq(token.totalSupply(), token.MAX_SUPPLY());
        assertEq(token.balanceOf(treasury), token.MAX_SUPPLY());
        assertEq(token.decimals(), 18);
    }

    function testZeroTreasuryRejected() public {
        vm.expectRevert(bytes("INFT: treasury zero"));
        new InfinitoToken(address(0));
    }

    function testFundingZeroRejected() public {
        vm.expectRevert(InfinitoPhysicalVault.InvalidAmount.selector);
        vault.fundCoin(COIN, 0);
    }

    function testUnknownCoinCannotRedeem() public {
        uint256 deadline = block.timestamp + 1 days;
        vm.expectRevert(InfinitoPhysicalVault.CoinUnavailable.selector);
        vault.redeem(COIN, collector, deadline, voucher(COIN, collector, deadline));
    }

    function testFuzzFundedAndRedeemedExactlyOnce(uint96 originalAmount) public {
        uint256 amount = bound(uint256(originalAmount), 1, token.MAX_SUPPLY());
        token.approve(address(vault), amount);
        vault.fundCoin(COIN, amount);
        assertEq(vault.totalLocked(), amount);
        uint256 deadline = block.timestamp + 1 days;
        bytes memory sig = voucher(COIN, collector, deadline);
        vault.redeem(COIN, collector, deadline, sig);
        assertEq(token.balanceOf(collector), amount);
        assertEq(vault.totalLocked(), 0);
        vm.expectRevert(InfinitoPhysicalVault.CoinUnavailable.selector);
        vault.redeem(COIN, collector, deadline, sig);
    }

    function testCannotRedeemWithWrongSigner() public {
        token.approve(address(vault), 1 ether);
        vault.fundCoin(COIN, 1 ether);
        uint256 deadline = block.timestamp + 1 days;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xB0B, vault.redeemDigest(COIN, collector, deadline));
        vm.expectRevert(InfinitoPhysicalVault.InvalidVoucher.selector);
        vault.redeem(COIN, collector, deadline, abi.encodePacked(r, s, v));
    }

    function testCannotConfigureZeroSigner() public {
        vm.expectRevert(InfinitoPhysicalVault.InvalidAddress.selector);
        vault.setVoucherSigner(address(0));
    }
}
