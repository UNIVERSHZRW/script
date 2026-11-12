// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {INFYNITY} from "../src/INFYNITY.sol";

contract ExternalActor {
    function pauseAsNonOwner(INFYNITY token) external returns (bool) {
        (bool ok,) = address(token).call(abi.encodeCall(INFYNITY.pause, ()));
        return ok;
    }

    function acceptAsPendingOwner(INFYNITY token) external {
        token.acceptOwnership();
    }
}

contract INFYNITYTest {
    uint256 private constant UNITS = 1e18;

    function testNameSymbolAndFixedSupply() public {
        address treasury = address(0x1234);
        INFYNITY token = new INFYNITY(treasury, address(this), 1_000_000);
        assert(keccak256(bytes(token.name())) == keccak256(bytes("INFYNITY")));
        assert(keccak256(bytes(token.symbol())) == keccak256(bytes("INFT")));
        assert(token.decimals() == 18);
        assert(token.totalSupply() == 1_000_000 * UNITS);
        assert(token.initialSupply() == token.totalSupply());
        assert(token.balanceOf(treasury) == token.totalSupply());
        assert(token.balanceOf(address(this)) == 0);
    }

    function testPauseRequiresGovernorAndBlocksTransfers() public {
        INFYNITY token = new INFYNITY(address(this), address(this), 100);
        ExternalActor outsider = new ExternalActor();
        assert(!outsider.pauseAsNonOwner(token));
        token.transfer(address(0xBEEF), 5 * UNITS);
        token.pause();
        assert(token.paused());
        (bool allowed,) = address(token).call(
            abi.encodeCall(token.transfer, (address(0xCAFE), 1 * UNITS))
        );
        assert(!allowed);
        token.unpause();
        assert(!token.paused());
        assert(token.transfer(address(0xCAFE), 1 * UNITS));
        assert(token.totalSupply() == 100 * UNITS);
    }

    function testOwnershipRequiresAcceptance() public {
        INFYNITY token = new INFYNITY(address(this), address(this), 20);
        ExternalActor secondOwner = new ExternalActor();
        token.transferOwnership(address(secondOwner));
        assert(token.owner() == address(this));
        assert(token.pendingOwner() == address(secondOwner));
        secondOwner.acceptAsPendingOwner(token);
        assert(token.owner() == address(secondOwner));
        assert(token.pendingOwner() == address(0));
        assert(secondOwner.pauseAsNonOwner(token));
    }

    function testCannotRenounceOwnership() public {
        INFYNITY token = new INFYNITY(address(this), address(this), 10);
        (bool allowed,) = address(token).call(abi.encodeCall(token.renounceOwnership, ()));
        assert(!allowed);
        assert(token.owner() == address(this));
    }

    function testZeroTreasuryRejected() public {
        try new INFYNITY(address(0), address(this), 10) returns (INFYNITY) {
            assert(false);
        } catch {}
    }

    function testZeroSupplyRejected() public {
        try new INFYNITY(address(this), address(this), 0) returns (INFYNITY) {
            assert(false);
        } catch {}
    }

    function testFuzzSupplyNeverExpands(uint96 amount) public {
        uint256 initial = 10_000;
        INFYNITY token = new INFYNITY(address(this), address(this), initial);
        uint256 sending = uint256(amount) % (initial * UNITS + 1);
        token.transfer(address(0xBEEF), sending);
        assert(token.totalSupply() == initial * UNITS);
    }
}
