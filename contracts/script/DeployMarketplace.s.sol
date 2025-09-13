// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Marketplace} from "../src/Marketplace.sol";

contract DeployMarketplace is Script {
    function run() external {
        address usd = vm.envAddress("USD_ADDRESS");
        vm.startBroadcast();
        Marketplace m = new Marketplace(usd);
        vm.stopBroadcast();
        console2.log("Marketplace:", address(m));
    }
}


