// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {PropertyToken} from "./PropertyToken.sol";
import {PropertySale} from "./PropertySale.sol";

/// @title PropertyFactory
/// @notice Deploys a PropertyToken (fixed 1000 supply via mint on claim) and its PropertySale.
contract PropertyFactory is Ownable {
    address public immutable USD;

    event SaleCreated(address indexed issuer, address token, address sale, string name, string symbol, uint256 pricePerToken);

    constructor(address owner_, address usd) Ownable(owner_) {
        USD = usd;
    }

    function createSale(
        string memory name_,
        string memory symbol_,
        uint256 totalPriceUSD_6dp
    ) external returns (address token, address sale) {
        require(totalPriceUSD_6dp > 0, "price=0");
        uint256 pricePer = totalPriceUSD_6dp / 1000;
        require(pricePer > 0, "per=0");

        // Make factory the initial owner so it can safely hand over to the sale
        PropertyToken t = new PropertyToken(name_, symbol_, address(this));
        PropertySale s = new PropertySale(msg.sender, USD, address(t), pricePer);
        t.transferOwnership(address(s));

        emit SaleCreated(msg.sender, address(t), address(s), name_, symbol_, pricePer);
        return (address(t), address(s));
    }
}


