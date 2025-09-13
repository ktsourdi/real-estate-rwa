// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {PropertyToken} from "./PropertyToken.sol";

/// @title PropertySale
/// @notice Primary sale for a PropertyToken with fixed 1000 supply, priced in USD token (6 decimals expected).
contract PropertySale is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable USD;
    PropertyToken public immutable token;
    uint256 public immutable pricePerToken; // USD 6dp
    uint256 public constant MAX_SUPPLY = 1000;

    uint256 public totalPurchased;
    mapping(address => uint256) public purchased;

    event Purchased(address indexed buyer, uint256 amount, uint256 cost);
    event Settled(uint256 sold, uint256 proceeds);
    event Refunded(address indexed buyer, uint256 amount, uint256 refund);

    constructor(address issuer, address usd, address token_, uint256 pricePerToken_)
        Ownable(issuer)
    {
        USD = IERC20(usd);
        token = PropertyToken(token_);
        pricePerToken = pricePerToken_;
    }

    function buy(uint256 amount) external {
        require(totalPurchased + amount <= MAX_SUPPLY, "exceeds");
        uint256 cost = amount * pricePerToken;
        purchased[msg.sender] += amount;
        totalPurchased += amount;
        USD.safeTransferFrom(msg.sender, address(this), cost);
        emit Purchased(msg.sender, amount, cost);
    }

    function settle() external onlyOwner {
        uint256 proceeds = totalPurchased * pricePerToken;
        USD.safeTransfer(owner(), proceeds);
        emit Settled(totalPurchased, proceeds);
    }

    function claim() external {
        uint256 amount = purchased[msg.sender];
        require(amount > 0, "none");
        purchased[msg.sender] = 0;
        token.mint(msg.sender, amount);
    }

    function refund() external onlyOwner {
        // Optional admin-triggered refunds for MVP
        uint256 amount = purchased[msg.sender];
        require(amount > 0, "none");
        purchased[msg.sender] = 0;
        uint256 refundAmount = amount * pricePerToken;
        USD.safeTransfer(msg.sender, refundAmount);
        emit Refunded(msg.sender, amount, refundAmount);
    }
}


