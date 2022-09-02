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
	typechain: process.env.HARDHAT_TEST
		? {
				outDir: 'test-types', // For hardhat testing usage
				target: 'ethers-v5',
		  }
		: {
				outDir: 'web3-types', // For external web3 usage
				target: 'web3-v1',
		  },
};

export default config;
