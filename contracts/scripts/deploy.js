const { ethers } = require("hardhat");

async function main() {
  console.log("==================================================");
  console.log("EigenMinds AgentEscrow Deployment Script");
  console.log("Network:", network.name);
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer signer found! Ensure MST_DEPLOYER_PRIVATE_KEY is set in .env"
    );
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("Deployer Address:", deployerAddress);
  console.log("Deployer Balance:", ethers.formatEther(balance), "MSTC");

  // Verifier address defaults to deployer unless explicitly provided in env
  const verifierAddress = process.env.MST_VERIFIER_ADDRESS || deployerAddress;
  console.log("Authorized Verifier Address:", verifierAddress);

  if (balance === 0n && network.name !== "hardhat" && network.name !== "localhost") {
    console.warn("WARNING: Deployer wallet balance is 0 MSTC. Please fund wallet using https://faucet.masterstroke.academy");
  }

  console.log("\nDeploying AgentEscrow contract...");
  const AgentEscrowFactory = await ethers.getContractFactory("AgentEscrow");
  const agentEscrow = await AgentEscrowFactory.deploy(verifierAddress);

  await agentEscrow.waitForDeployment();
  const contractAddress = await agentEscrow.getAddress();
  const deploymentTxHash = agentEscrow.deploymentTransaction().hash;

  console.log("--------------------------------------------------");
  console.log("SUCCESS: AgentEscrow contract deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Transaction Hash:", deploymentTxHash);
  console.log("MST Explorer Link: https://testnet.mstscan.com/tx/" + deploymentTxHash);
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
