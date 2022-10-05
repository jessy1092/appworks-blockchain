import { ethers, upgrades } from 'hardhat';

import depolyData from '../.openzeppelin/goerli.json';

async function main() {
	const AppWorks = await ethers.getContractFactory('AppWorksV2');
	const appWorks = await upgrades.upgradeProxy(depolyData.proxies[0].address, AppWorks, {
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
