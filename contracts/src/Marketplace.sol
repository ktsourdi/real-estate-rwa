// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Marketplace {
    using SafeERC20 for IERC20;

    IERC20 public immutable USD;

    struct Listing {
        address seller;
        address token;
        uint256 remaining;
        uint256 pricePerTokenUSD6; // USD 6dp
    }

    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed id, address indexed seller, address indexed token, uint256 amount, uint256 pricePerTokenUSD6);
    event Purchased(uint256 indexed id, address indexed buyer, uint256 amount, uint256 costUSD6);
    event Cancelled(uint256 indexed id, address indexed seller, uint256 remaining);

    constructor(address usd) {
        USD = IERC20(usd);
    }

    function createListing(address token, uint256 amount, uint256 pricePerTokenUSD6) external returns (uint256 id) {
        require(amount > 0, "amount");
        require(pricePerTokenUSD6 > 0, "price");
        // Pull tokens from seller
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        id = ++nextListingId;
        listings[id] = Listing({ seller: msg.sender, token: token, remaining: amount, pricePerTokenUSD6: pricePerTokenUSD6 });
        emit Listed(id, msg.sender, token, amount, pricePerTokenUSD6);
    }

    function buy(uint256 id, uint256 amount) external {
        Listing storage L = listings[id];
        require(L.seller != address(0), "listing");
        require(amount > 0 && amount <= L.remaining, "amount");
        uint256 cost = amount * L.pricePerTokenUSD6;
        // Pull USD from buyer and forward to seller
        USD.safeTransferFrom(msg.sender, L.seller, cost);
        // Send property tokens to buyer
        IERC20(L.token).safeTransfer(msg.sender, amount);
        L.remaining -= amount;
        emit Purchased(id, msg.sender, amount, cost);
        if (L.remaining == 0) {
            delete listings[id];
        }
    }

    function cancel(uint256 id) external {
        Listing storage L = listings[id];
        require(L.seller == msg.sender, "seller");
        uint256 rem = L.remaining;
        require(rem > 0, "empty");
        L.remaining = 0;
        // Return tokens to seller
        IERC20(L.token).safeTransfer(msg.sender, rem);
        emit Cancelled(id, msg.sender, rem);
        delete listings[id];
    }
}


