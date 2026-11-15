// SPDX-License-Identifier: MIT
pragma solidity 0.8.38;

import {ERC20} from "@openzeppelin/contracts@5.6.1/token/ERC20/ERC20.sol";

contract INFYNITY is ERC20 {
    constructor(address treasury) ERC20("INFYNITY", "INFT") {
        _mint(treasury, 10_000_000 * 10 ** uint256(decimals()));
    }
}
