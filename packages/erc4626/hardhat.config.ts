import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
	solidity: '0.8.16',
	networks: {
		goerli: {
			url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
			accounts: [process.env.GOERLI_PRIVATE_KEY as string],
		},
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY,
	},
	typechain: {
		outDir: 'typechain-types',
		target: 'web3-v1',
		alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
		externalArtifacts: [], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
		dontOverrideCompile: false, // defaults to false
	},
};

export default config;
