// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {USDStableToken} from "../src/RealEstateRWA.sol";

contract MintUSD is Script {
    function run() external {
        address usdAddr = vm.envAddress("USD_ADDRESS");
        address to = vm.envAddress("RECIPIENT");
        uint256 amount = vm.envUint("AMOUNT");

        vm.startBroadcast();
        USDStableToken usd = USDStableToken(usdAddr);
        usd.mint(to, amount);
        vm.stopBroadcast();

        console2.log("Minted", amount, "USD to", to);
    }
}


