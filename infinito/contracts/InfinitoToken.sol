// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title INFINITO (INFT)
/// @notice Prototipo ERC-20, no desplegado. Sin minteo posterior ni privilegios admin.
/// @dev Suministro inicial fijo asignado a la tesorería explícita en el constructor.
contract InfinitoToken is ERC20 {
    uint256 public constant MAX_SUPPLY = 21_000_000 * 10 ** 18;

    constructor(address treasury) ERC20("INFINITO", "INFT") {
        require(treasury != address(0), "INFT: treasury zero");
        _mint(treasury, MAX_SUPPLY);
    }
}
