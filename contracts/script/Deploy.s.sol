// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {USDStableToken, RealEstateDeed, FractionFactory} from "../src/RealEstateRWA.sol";

contract Deploy is Script {
    function run() external {
        // Use broadcaster provided via CLI --private-key
        vm.startBroadcast();
        address deployer = msg.sender;

        USDStableToken usd = new USDStableToken("Demo USD", "dUSD", 6, deployer);
        RealEstateDeed deed = new RealEstateDeed(deployer);
        FractionFactory factory = new FractionFactory(deployer, address(usd));

        console2.log("USD:", address(usd));
        console2.log("Deed:", address(deed));
        console2.log("Factory:", address(factory));

        vm.stopBroadcast();
    }
}
