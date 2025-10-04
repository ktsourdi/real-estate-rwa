// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FractionToken} from "./FractionToken.sol";

/// @title FractionOffering
/// @notice Primary offering: investors buy fractions with USD token. If soft cap not met by deadline, refunds are enabled.
contract FractionOffering is Ownable {
    using SafeERC20 for IERC20;

    enum Status { Pending, Active, Settled, Refunding }

    IERC20 public immutable usd;
    IERC721 public immutable deed;
    uint256 public immutable deedId;
    FractionToken public immutable fractions;

    uint256 public immutable pricePerFraction; // in USD decimals
    uint256 public immutable maxFractions;
    uint256 public immutable softCapFractions; // minimum to settle

    uint256 public totalPurchased;
    mapping(address => uint256) public purchased;

    event Purchased(address indexed buyer, uint256 fractions, uint256 amountUSD);
    event Settled(uint256 fractionsSold, uint256 proceedsUSD);
    event RefundingEnabled();
    event Refunded(address indexed buyer, uint256 fractions, uint256 amountUSD);

    constructor(
        address owner_,
        address usdToken,
        address deed_,
        uint256 deedId_,
        address fractions_,
        uint256 pricePerFraction_,
        uint256 maxFractions_,
        uint256 softCapFractions_
    ) Ownable(owner_) {
        usd = IERC20(usdToken);
        deed = IERC721(deed_);
        deedId = deedId_;
        fractions = FractionToken(fractions_);
        pricePerFraction = pricePerFraction_;
        maxFractions = maxFractions_;
        softCapFractions = softCapFractions_;
    }

    function status() public view returns (Status) {
        // Simplified: Active by default; success determined at settle-time
        return Status.Active;
    }

    function buy(uint256 fractionsToBuy) external {
        require(totalPurchased + fractionsToBuy <= maxFractions, "exceeds");
        uint256 cost = fractionsToBuy * pricePerFraction;
        purchased[msg.sender] += fractionsToBuy;
        totalPurchased += fractionsToBuy;
        usd.safeTransferFrom(msg.sender, address(this), cost);
        emit Purchased(msg.sender, fractionsToBuy, cost);
    }

    /// @notice Settle the offering: mint fractions to buyers pro-rata and escrow proceeds to owner.
    /// Simple mint: buyers claim directly. Owner receives USD.
    function settle() external {
        require(totalPurchased >= softCapFractions, "below soft cap");
        // Mint purchased fractions to buyers when they call claim.
        // Transfer USD to owner.
        uint256 proceeds = totalPurchased * pricePerFraction;
        usd.safeTransfer(owner(), proceeds);
        emit Settled(totalPurchased, proceeds);
    }

    function claim() external {
        require(totalPurchased >= softCapFractions, "below soft cap");
        uint256 amount = purchased[msg.sender];
        require(amount > 0, "none");
        purchased[msg.sender] = 0;
        fractions.mint(msg.sender, amount);
    }

    function refund() external {
        require(totalPurchased < softCapFractions, "above soft cap");
        uint256 amount = purchased[msg.sender];
        require(amount > 0, "none");
        purchased[msg.sender] = 0;
        uint256 refundAmount = amount * pricePerFraction;
        usd.safeTransfer(msg.sender, refundAmount);
        emit Refunded(msg.sender, amount, refundAmount);
    }
}


