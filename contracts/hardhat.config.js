require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });

const MST_TESTNET_RPC = process.env.MST_TESTNET_RPC_URL || "https://testnetrpc.mstblockchain.com";
const DEPLOYER_PRIVATE_KEY = process.env.MST_DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mstTestnet: {
      url: MST_TESTNET_RPC,
      chainId: process.env.MST_CHAIN_ID ? Number(process.env.MST_CHAIN_ID) : 91562037,
      accounts: DEPLOYER_PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? [DEPLOYER_PRIVATE_KEY] : []
    }
  }
};
