import { ethers } from 'hardhat';

async function main() {
	const ContractTWDF = await ethers.getContractFactory('TWDF');
	const contractTWDF = await ContractTWDF.deploy();

	await contractTWDF.deployed();

	console.log(`contract TWDF deployed to ${contractTWDF.address}`);

	const ContractTWDFVault = await ethers.getContractFactory('TWDFVault');
	const contractTWDFVault = await ContractTWDFVault.deploy(contractTWDF.address);

	await contractTWDFVault.deployed();

	console.log(`contract TWDFVault deployed to ${contractTWDFVault.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
