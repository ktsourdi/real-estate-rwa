// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC721, ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Single-file MVP for demo: USD token, Deed NFT, Fraction ERC20, and Offering logic.

/// @dev Centralized mintable demo USD token
contract USDStableToken is ERC20, Ownable {
    uint8 private immutable _decimals;
    constructor(string memory n, string memory s, uint8 d, address owner_) ERC20(n, s) Ownable(owner_) { _decimals = d; }
    function decimals() public view override returns (uint8) { return _decimals; }
    function mint(address to, uint256 amount) external onlyOwner { _mint(to, amount); }
    function burn(address from, uint256 amount) external onlyOwner { _burn(from, amount); }
}

/// @dev Deed NFT with per-token locker (escrow) flag
contract RealEstateDeed is ERC721URIStorage, Ownable {
    error TokenLocked();
    mapping(uint256 => address) public lockerOf;
    constructor(address owner_) ERC721("RealEstateDeed", "DEED") Ownable(owner_) {}
    function mint(address to, uint256 tokenId, string memory tokenURI_) external onlyOwner { _safeMint(to, tokenId); _setTokenURI(tokenId, tokenURI_); }
    function setLocker(uint256 tokenId, address locker) external {
        address currentOwner = ownerOf(tokenId);
        require(msg.sender == currentOwner || msg.sender == owner(), "not auth");
        lockerOf[tokenId] = locker;
    }
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (lockerOf[tokenId] != address(0)) revert TokenLocked();
        return super._update(to, tokenId, auth);
    }
}

/// @dev Fraction ERC20 for a specific deed
contract FractionToken is ERC20, Ownable {
    address public immutable deedContract;
    uint256 public immutable deedId;
    constructor(string memory n, string memory s, address owner_, address deedC, uint256 deed) ERC20(n, s) Ownable(owner_) { deedContract = deedC; deedId = deed; }
    function mint(address to, uint256 amount) external onlyOwner { _mint(to, amount); }
    function burn(address from, uint256 amount) external onlyOwner { _burn(from, amount); }
}

/// @dev Primary offering: buy with USD, claim on success, refund on failure
contract FractionOffering is Ownable {
    using SafeERC20 for IERC20;
    enum Status { Active, Settled, Refunding }
    IERC20 public immutable usd;
    RealEstateDeed public immutable deed;
    uint256 public immutable deedId;
    FractionToken public immutable fractions;
    uint256 public immutable pricePerFraction; // in USD decimals
    uint256 public immutable maxFractions;
    uint256 public immutable softCapFractions;
    uint256 public totalPurchased;
    mapping(address => uint256) public purchased;
    event Purchased(address indexed buyer, uint256 fractions, uint256 amountUSD);
    event Settled(uint256 fractionsSold, uint256 proceedsUSD);
    event Refunded(address indexed buyer, uint256 fractions, uint256 amountUSD);
    constructor(
        address owner_, address usdToken, address deed_, uint256 deedId_, address fractions_,
        uint256 pricePerFraction_, uint256 maxFractions_, uint256 softCapFractions_
    ) Ownable(owner_) {
        usd = IERC20(usdToken);
        deed = RealEstateDeed(deed_);
        deedId = deedId_;
        fractions = FractionToken(fractions_);
        pricePerFraction = pricePerFraction_;
        maxFractions = maxFractions_;
        softCapFractions = softCapFractions_;
    }
    function status() public view returns (Status) { return Status.Active; }
    function buy(uint256 fractionsToBuy) external {
        require(totalPurchased + fractionsToBuy <= maxFractions, "exceeds");
        uint256 cost = fractionsToBuy * pricePerFraction;
        purchased[msg.sender] += fractionsToBuy;
        totalPurchased += fractionsToBuy;
        usd.safeTransferFrom(msg.sender, address(this), cost);
        emit Purchased(msg.sender, fractionsToBuy, cost);
    }
    function settle() external {
        require(totalPurchased >= softCapFractions, "below soft cap");
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

/// @dev Minimal factory inside same file to wire offering + fractions and lock deed
contract FractionFactory is Ownable {
    address public immutable usd;
    event OfferingCreated(address indexed issuer, address deed, uint256 deedId, address fractions, address offering);
    constructor(address owner_, address usdToken) Ownable(owner_) { usd = usdToken; }
    function createOffering(
        address deedContract, uint256 deedId,
        string memory fractionName, string memory fractionSymbol,
        uint256 pricePerFraction, uint256 maxFractions, uint256 softCapFractions
    ) external returns (address fractions, address offering) {
        require(ERC721(deedContract).ownerOf(deedId) == msg.sender, "not owner");
        FractionToken f = new FractionToken(fractionName, fractionSymbol, msg.sender, deedContract, deedId);
        FractionOffering o = new FractionOffering(msg.sender, usd, deedContract, deedId, address(f), pricePerFraction, maxFractions, softCapFractions);
        f.transferOwnership(address(o));
        emit OfferingCreated(msg.sender, deedContract, deedId, address(f), address(o));
        return (address(f), address(o));
    }
}


