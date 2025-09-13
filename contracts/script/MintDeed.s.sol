// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RealEstateDeed} from "../src/RealEstateRWA.sol";

contract MintDeed is Script {
    function run() external {
        address deedAddr = vm.envAddress("DEED_ADDRESS");
        address to = vm.envAddress("ISSUER_ADDRESS");
        uint256 deedId = vm.envUint("DEED_ID");
        string memory uri = vm.envString("DEED_TOKEN_URI");

        vm.startBroadcast();
        RealEstateDeed deed = RealEstateDeed(deedAddr);
        deed.mint(to, deedId, uri);
        vm.stopBroadcast();

        console2.log("Minted deed", deedId, "to", to);
    }
}


