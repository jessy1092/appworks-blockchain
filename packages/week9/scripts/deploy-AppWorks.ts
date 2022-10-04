import { ethers, upgrades } from 'hardhat';

async function main() {
	const AppWorks = await ethers.getContractFactory('AppWorks');
	const appWorks = await upgrades.deployProxy(AppWorks, {
		initializer: 'initialize',
		kind: 'uups',
	});

	await appWorks.deployed();

	console.log(`contract deployed to ${appWorks.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
