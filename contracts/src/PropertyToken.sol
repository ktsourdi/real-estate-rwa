// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title PropertyToken
/// @notice ERC20 representing one property's fractions. Owner is the sale contract which mints on claim.
contract PropertyToken is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_, address owner_)
        ERC20(name_, symbol_)
        Ownable(owner_)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}


