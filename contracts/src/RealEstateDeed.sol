// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721, ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RealEstateDeed
/// @notice ERC-721 deed representing a property. Can be escrow-locked by an Offering contract during fractionalization.
contract RealEstateDeed is ERC721URIStorage, Ownable {
    error NotAuthorized();
    error TokenLocked();

    mapping(uint256 tokenId => address locker) public lockerOf;

    constructor(address owner_) ERC721("RealEstateDeed", "DEED") Ownable(owner_) {}

    function mint(address to, uint256 tokenId, string memory tokenURI_) external onlyOwner {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
    }

    function setLocker(uint256 tokenId, address locker) external {
        address currentOwner = ownerOf(tokenId);
        if (msg.sender != currentOwner && msg.sender != owner()) revert NotAuthorized();
        lockerOf[tokenId] = locker;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (lockerOf[tokenId] != address(0)) revert TokenLocked();
        return super._update(to, tokenId, auth);
    }
}


