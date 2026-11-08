// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {InfinitoToken} from "../contracts/InfinitoToken.sol";
import {InfinitoPhysicalVault} from "../contracts/InfinitoPhysicalVault.sol";

contract InfinitoTest is Test {
    InfinitoToken token;
    InfinitoPhysicalVault vault;

    uint256 internal signerPK = 0xA11CE;
    address internal recipient = address(0xBEEF);
    bytes32 internal constant COIN = keccak256("UHZ-PHYSICAL-000001");
    uint256 internal constant AMOUNT = 10 ether;

    function setUp() public {
        token = new InfinitoToken(address(this));
        vault = new InfinitoPhysicalVault(
            address(token), vm.addr(signerPK), address(this)
        );
        token.approve(address(vault), AMOUNT * 3);
    }

    function _voucher(bytes32 coin, address to, uint256 deadline)
        internal returns (bytes memory)
    {
        bytes32 digest = vault.redeemDigest(coin, to, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPK, digest);
        return abi.encodePacked(r, s, v);
    }

    function testFixedSupply() public view {
        assertEq(token.totalSupply(), 21_000_000 ether);
        assertEq(token.balanceOf(address(this)), token.totalSupply());
    }

    function testFundAndRedeem() public {
        vault.fundCoin(COIN, AMOUNT);
        assertEq(token.balanceOf(address(vault)), AMOUNT);
        assertEq(vault.totalLocked(), AMOUNT);

        uint256 deadline = block.timestamp + 1 days;
        vault.redeem(COIN, recipient, deadline, _voucher(COIN, recipient, deadline));
        assertEq(token.balanceOf(recipient), AMOUNT);
        assertEq(vault.totalLocked(), 0);
    }

    function testDoubleRedemptionFails() public {
        vault.fundCoin(COIN, AMOUNT);
        uint256 deadline = block.timestamp + 1 days;
        bytes memory signature = _voucher(COIN, recipient, deadline);
        vault.redeem(COIN, recipient, deadline, signature);
        vm.expectRevert(InfinitoPhysicalVault.CoinUnavailable.selector);
        vault.redeem(COIN, recipient, deadline, signature);
    }

    function testSignatureCannotChangeRecipient() public {
        vault.fundCoin(COIN, AMOUNT);
        uint256 deadline = block.timestamp + 1 days;
        bytes memory signature = _voucher(COIN, recipient, deadline);
        vm.expectRevert(InfinitoPhysicalVault.InvalidVoucher.selector);
        vault.redeem(COIN, address(0xCAFE), deadline, signature);
    }

    function testExpiredVoucherFails() public {
        vault.fundCoin(COIN, AMOUNT);
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory signature = _voucher(COIN, recipient, deadline);
        vm.warp(deadline + 1);
        vm.expectRevert(InfinitoPhysicalVault.VoucherExpired.selector);
        vault.redeem(COIN, recipient, deadline, signature);
    }

    function testOnlyOwnerFunds() public {
        vm.expectRevert();
        vm.prank(address(0xBAD));
        vault.fundCoin(COIN, AMOUNT);
    }

    function testCannotRegisterDuplicate() public {
        vault.fundCoin(COIN, AMOUNT);
        vm.expectRevert(InfinitoPhysicalVault.CoinExists.selector);
        vault.fundCoin(COIN, AMOUNT);
    }
}
