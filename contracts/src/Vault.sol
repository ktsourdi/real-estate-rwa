// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Simple vault to hold DUSD balances for gasless in-app trading.
// - Users deposit DUSD via transferFrom (requires approve in their browser wallet)
// - Users withdraw and pay a fee (feeBps), retained in the contract
// - Owner can sweep only the accumulated fees (not user balances)
interface IMarketplace {
  function buy(uint256 id, uint256 amount) external;
  function listings(uint256 id) external view returns (address seller, address token, uint256 remaining, uint256 pricePerTokenUSD6);
}

interface IPropertySale {
  function pricePerToken() external view returns (uint256);
  function buyFor(address buyer, uint256 amount) external;
}

contract Vault {
  using SafeERC20 for IERC20;
  address public immutable token; // DUSD token
  uint16 public immutable feeBps; // e.g. 200 = 2%

  address public owner;
  address public marketplace; // optional marketplace for in-app buys

  mapping(address => uint256) public balanceOf;
  uint256 internal totalUserBalances; // sum of user balances to protect against fee sweeps on user funds

  event Deposited(address indexed user, uint256 amount);
  event Withdrawn(address indexed user, uint256 gross, uint256 fee);
  event OwnerChanged(address indexed owner);
  event FeesWithdrawn(address indexed to, uint256 amount);

  modifier onlyOwner() {
    require(msg.sender == owner, "not owner");
    _;
  }

  constructor(address token_, uint16 feeBps_) {
    require(token_ != address(0), "token");
    require(feeBps_ <= 10_000, "fee too high");
    token = token_;
    feeBps = feeBps_;
    owner = msg.sender;
    emit OwnerChanged(owner);
  }

  function setOwner(address newOwner) external onlyOwner {
    require(newOwner != address(0), "owner");
    owner = newOwner;
    emit OwnerChanged(newOwner);
  }

  function setMarketplace(address marketplace_) external onlyOwner {
    require(marketplace_ != address(0), "market");
    marketplace = marketplace_;
    // Pre-approve marketplace to pull USD for buys
    IERC20(token).forceApprove(marketplace_, type(uint256).max);
  }

  function deposit(uint256 amount) external {
    require(amount > 0, "amt");
    // Pull funds from user first
    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    // Update state after successful transfer
    balanceOf[msg.sender] += amount;
    totalUserBalances += amount;
    emit Deposited(msg.sender, amount);
  }

  function withdraw(uint256 amount) external {
    require(amount > 0, "amt");
    uint256 bal = balanceOf[msg.sender];
    require(bal >= amount, "bal");
    // Update state first to minimize reentrancy risk
    balanceOf[msg.sender] = bal - amount;
    totalUserBalances -= amount;

    uint256 fee = (amount * feeBps) / 10_000;
    uint256 payout = amount - fee;

    IERC20(token).safeTransfer(msg.sender, payout);
    emit Withdrawn(msg.sender, amount, fee);
  }

  // Withdraw only accumulated fees (contract balance - total user balances)
  function withdrawFees(address to, uint256 amount) external onlyOwner {
    require(to != address(0), "to");
    uint256 contractBal = IERC20(token).balanceOf(address(this));
    uint256 fees = contractBal - totalUserBalances;
    require(amount <= fees, "exceeds fees");
    IERC20(token).safeTransfer(to, amount);
    emit FeesWithdrawn(to, amount);
  }

  // Buy marketplace listing using user's in-app balance; sends property tokens to receiver
  function buyFromMarketplace(uint256 id, uint256 amount, address receiver) external {
    require(receiver != address(0), "recv");
    require(marketplace != address(0), "market");
    (, address tokenAddr, uint256 remaining, uint256 price6) = IMarketplace(marketplace).listings(id);
    require(amount > 0 && amount <= remaining, "amount");
    uint256 cost = amount * price6;
    uint256 bal = balanceOf[msg.sender];
    require(bal >= cost, "bal");
    // Debit first
    balanceOf[msg.sender] = bal - cost;
    totalUserBalances -= cost;
    // Execute buy; Marketplace will transfer USD from this contract due to allowance
    IMarketplace(marketplace).buy(id, amount);
    // Forward purchased property tokens to receiver
    IERC20(tokenAddr).safeTransfer(receiver, amount);
  }

  // Buy primary sale using user's in-app balance; credits purchased[buyer]
  function buyFromPrimary(address sale, uint256 amount, address buyer) external {
    require(sale != address(0) && buyer != address(0), "args");
    uint256 price6 = IPropertySale(sale).pricePerToken();
    uint256 cost = amount * price6;
    uint256 bal = balanceOf[msg.sender];
    require(bal >= cost, "bal");
    // debit first
    balanceOf[msg.sender] = bal - cost;
    totalUserBalances -= cost;
    // approve sale for transferFrom
    IERC20(token).forceApprove(sale, cost);
    IPropertySale(sale).buyFor(buyer, amount);
  }
}


