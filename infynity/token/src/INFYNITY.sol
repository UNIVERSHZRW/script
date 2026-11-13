// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title INFYNITY (INFT)
 * @notice Exactly 10,000,000 INFT (18 decimals), no further issuance or transfer tax.
 * @dev Deploy with a separately governed multisignature as initialOwner; deliver all tokens to
 *      a treasury (which may be the same multisignature). The multisignature can pause transfers
 *      during an incident but cannot increase the supply.
 *      Review legal, supply, custody and disclosure requirements before mainnet deployment.
 */
contract INFYNITY is ERC20, ERC20Pausable, Ownable2Step {
    error InvalidTreasury();
    error OwnershipRenunciationDisabled();

    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 1e18;

    /// @param treasury Address receiving the initial supply.
    /// @param governor Multisignature address controlling pause and two-step ownership transfers.
    constructor(address treasury, address governor)
        ERC20("INFYNITY", "INFT")
        Ownable(governor)
    {
        if (treasury == address(0)) revert InvalidTreasury();
        _mint(treasury, INITIAL_SUPPLY);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev Prevent accidental permanent loss of the emergency control.
    function renounceOwnership() public override onlyOwner {
        revert OwnershipRenunciationDisabled();
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
