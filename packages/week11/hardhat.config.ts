import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.16',
		settings: {
			optimizer: {
				enabled: true,
				runs: 1000,
			},
		},
	},
	networks: {
		goerli: {
			url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
			accounts: [process.env.GOERLI_PRIVATE_KEY as string],
		},
		hardhat: {
			forking: {
				url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_FORK_API_KEY}`,
				blockNumber: 14390000,
				enabled: process.env.HARDHAT_FORK_TEST ? true : false,
			},
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