import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function main() {
	const Contract = await ethers.getContractFactory('VRFv2Consumer');
	const contract = await Contract.deploy(BigNumber.from(process.env.CHAINLINK_SUBSCRIPTION_ID));

	await contract.deployed();

	console.log(`contract deployed to ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
