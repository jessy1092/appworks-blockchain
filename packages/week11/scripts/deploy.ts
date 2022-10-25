import { ethers } from 'hardhat';

async function main() {
	const lockedAmount = ethers.utils.parseEther('0.01');

	const Contract = await ethers.getContractFactory('CallFunc');
	const contract = await Contract.deploy({ value: lockedAmount });

	await contract.deployed();

	console.log(`contract deployed to ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
