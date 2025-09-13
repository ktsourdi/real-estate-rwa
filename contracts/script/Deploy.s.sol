// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {USDStableToken} from "../src/RealEstateRWA.sol";
import {PropertyFactory} from "../src/PropertyFactory.sol";

contract Deploy is Script {
    function run() external {
        // Use broadcaster provided via CLI --private-key
        vm.startBroadcast();
        address deployer = msg.sender;

        USDStableToken usd = new USDStableToken("Demo USD", "dUSD", 6, deployer);
        PropertyFactory factory = new PropertyFactory(deployer, address(usd));

        console2.log("USD:", address(usd));
        console2.log("Factory:", address(factory));

        vm.stopBroadcast();
    }
}
