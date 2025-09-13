// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PropertyFactory} from "../src/PropertyFactory.sol";

contract DeployFactoryOnly is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usd = vm.envAddress("USD_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);
        PropertyFactory factory = new PropertyFactory(vm.addr(deployerPrivateKey), usd);
        vm.stopBroadcast();

        console2.log("Factory:", address(factory));
    }
}


