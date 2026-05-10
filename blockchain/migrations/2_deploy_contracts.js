const BioToken = artifacts.require("BioToken");
const ClinicalTrial = artifacts.require("ClinicalTrial");

module.exports = async function (deployer) {
  // 1. Deploy the BioToken contract
  await deployer.deploy(BioToken);
  const token = await BioToken.deployed();

  // 2. Deploy the ClinicalTrial contract and pass the token's address
  await deployer.deploy(ClinicalTrial, token.address);
  const trial = await ClinicalTrial.deployed();

  // 3. Define the MINTER_ROLE hash (same as in your Solidity code)
  const MINTER_ROLE = web3.utils.keccak256("MINTER_ROLE");

  // 4. Grant the ClinicalTrial contract permission to mint tokens
  // This solves the "TypeError: Member mint not found" issue by allowing 
  // the Trial contract to successfully call the token's mint function.
  await token.grantRole(MINTER_ROLE, trial.address);

  // 5. Output addresses to the console for easy verification
  console.log("-----------------------------------------");
  console.log("BioToken Deployed at:", token.address);
  console.log("ClinicalTrial Deployed at:", trial.address);
  console.log("MINTER_ROLE granted to ClinicalTrial.");
  console.log("-----------------------------------------");
};