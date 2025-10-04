// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
  function transfer(address to, uint256 value) external returns (bool);
  function transferFrom(address from, address to, uint256 value) external returns (bool);
  function balanceOf(address account) external view returns (uint256);
  function allowance(address owner, address spender) external view returns (uint256);
}

// Simple vault to hold DUSD balances for gasless in-app trading.
// - Users deposit DUSD via transferFrom (requires approve in their browser wallet)
// - Users withdraw and pay a fee (feeBps), retained in the contract
// - Owner can sweep only the accumulated fees (not user balances)
contract Vault {
  address public immutable token; // DUSD token
  uint16 public immutable feeBps; // e.g. 200 = 2%

  address public owner;

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

  function deposit(uint256 amount) external {
    require(amount > 0, "amt");
    // Pull funds from user first
    require(IERC20(token).transferFrom(msg.sender, address(this), amount), "transferFrom");
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

    require(IERC20(token).transfer(msg.sender, payout), "transfer");
    emit Withdrawn(msg.sender, amount, fee);
  }

  // Withdraw only accumulated fees (contract balance - total user balances)
  function withdrawFees(address to, uint256 amount) external onlyOwner {
    require(to != address(0), "to");
    uint256 contractBal = IERC20(token).balanceOf(address(this));
    uint256 fees = contractBal - totalUserBalances;
    require(amount <= fees, "exceeds fees");
    require(IERC20(token).transfer(to, amount), "transfer");
    emit FeesWithdrawn(to, amount);
  }
}


