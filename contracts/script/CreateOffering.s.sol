// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {FractionFactory} from "../src/RealEstateRWA.sol";

contract CreateOffering is Script {
    function run() external {
        address factoryAddr = vm.envAddress("FACTORY_ADDRESS");
        address deedAddr = vm.envAddress("DEED_ADDRESS");
        uint256 deedId = vm.envUint("DEED_ID");
        string memory name = vm.envString("FRACTION_NAME");
        string memory symbol = vm.envString("FRACTION_SYMBOL");
        uint256 price = vm.envUint("PRICE_PER_FRACTION");
        uint256 max = vm.envUint("MAX_FRACTIONS");
        uint256 softCap = vm.envUint("SOFTCAP_FRACTIONS");
        uint256 deadline = vm.envUint("DEADLINE");

        vm.startBroadcast();
        FractionFactory f = FractionFactory(factoryAddr);
        (address fractions, address offering) = f.createOffering(
            deedAddr,
            deedId,
            name,
            symbol,
            price,
            max,
            softCap
        );
        vm.stopBroadcast();

        console2.log("Fractions:", fractions);
        console2.log("Offering:", offering);
    }
}


