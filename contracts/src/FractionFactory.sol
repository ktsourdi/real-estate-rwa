// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {RealEstateDeed} from "./RealEstateDeed.sol";
import {FractionToken} from "./FractionToken.sol";
import {FractionOffering} from "./FractionOffering.sol";

/// @title FractionFactory
/// @notice Creates fraction token + offering for a given deed. Locks deed by setting locker on the Deed contract.
contract FractionFactory is Ownable {
    event OfferingCreated(
        address indexed issuer,
        address deed,
        uint256 deedId,
        address fractions,
        address offering
    );

    address public immutable usd; // USD token address

    constructor(address owner_, address usdToken) Ownable(owner_) {
        usd = usdToken;
    }

    function createOffering(
        address deedContract,
        uint256 deedId,
        string memory fractionName,
        string memory fractionSymbol,
        uint256 pricePerFraction,
        uint256 maxFractions,
        uint256 softCapFractions
    ) external returns (address fractions, address offering) {
        // Ensure caller owns the deed
        require(IERC721(deedContract).ownerOf(deedId) == msg.sender, "not owner");

        // Deploy FractionToken owned by Offering (ownership transferred after deploy)
        FractionToken f = new FractionToken(
            fractionName,
            fractionSymbol,
            msg.sender,
            deedContract,
            deedId
        );

        // Deploy Offering owned by issuer (msg.sender)
        FractionOffering o = new FractionOffering(
            msg.sender,
            usd,
            deedContract,
            deedId,
            address(f),
            pricePerFraction,
            maxFractions,
            softCapFractions
        );

        // Transfer FractionToken ownership to Offering so it can mint on claim
        f.transferOwnership(address(o));

        // Note: no deed locking in MVP

        emit OfferingCreated(msg.sender, deedContract, deedId, address(f), address(o));
        return (address(f), address(o));
    }
}


