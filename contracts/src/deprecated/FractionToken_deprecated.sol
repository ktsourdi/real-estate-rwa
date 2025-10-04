// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title FractionToken
/// @notice ERC20 representing fractional ownership of a property (backed by a deed escrow)
contract FractionToken is ERC20, Ownable {
    address public immutable deedContract;
    uint256 public immutable deedId;

    constructor(
        string memory name_,
        string memory symbol_,
        address owner_,
        address deedContract_,
        uint256 deedId_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        deedContract = deedContract_;
        deedId = deedId_;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}


