// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title INFYNITY (INFT)
 * @notice Fixed-supply ERC-20. No external mint, burn, upgrade, blacklist or transfer-tax function.
 * @dev Deploy with a separately governed multisignature as initialOwner; deliver all tokens to
 *      a treasury (which may be the same multisignature). The multisignature can pause transfers
 *      during an incident but cannot increase the supply.
 *      Review legal, supply, custody and disclosure requirements before mainnet deployment.
 */
contract INFYNITY is ERC20, ERC20Pausable, Ownable2Step {
    error InvalidTreasury();
    error InvalidSupply();
    error OwnershipRenunciationDisabled();

    uint256 public immutable initialSupply;

    /// @param treasury Address receiving the initial supply.
    /// @param governor Multisignature address controlling pause and two-step ownership transfers.
    /// @param wholeTokens Initial supply in whole INFT (18 decimals applied on-chain).
    constructor(address treasury, address governor, uint256 wholeTokens)
        ERC20("INFYNITY", "INFT")
        Ownable(governor)
    {
        if (treasury == address(0)) revert InvalidTreasury();
        if (wholeTokens == 0) revert InvalidSupply();
        uint256 supply = wholeTokens * 10 ** decimals();
        initialSupply = supply;
        _mint(treasury, supply);
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
