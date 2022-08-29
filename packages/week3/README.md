# Sample Hardhat Project

## 環境設定

1. 安裝 hardhat

```
yarn add hardhat
```

2. 初始化 hardhat 專案

```
npx hardhat
```

> 以下 dependency 安裝，只需第一次駕環境使用，現在 package.json 已經有 dependency 所以直接 `yarn` 就可以了
> ref: https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-toolbox

3. 本地端 compile/test/deploy 所需 dependency（使用 yarn 的話，要主動安裝這些套件）

```
yarn add --dev @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-network-helpers @nomicfoundation/hardhat-chai-matchers @nomiclabs/hardhat-ethers @nomiclabs/hardhat-etherscan chai ethers hardhat-gas-reporter solidity-coverage @typechain/hardhat typechain @typechain/ethers-v5 @ethersproject/abi @ethersproject/providers
```

4. 為了 TypeScript

```
yarn add typescript ts-node --dev
yarn add @types/node @types/mocha @types/chai --dev
```

5. 為了本地端連結 remix

```
yarn add @remix-project/remixd --dev
```

6. 為了 prettier

```
yarn add prettier-plugin-solidity --dev
```

## 環境參數

建立 `.env` 檔案，填入以下的值（範例在 `.env.example`）

- `GOERLI_PRIVATE_KEY`: 要部署合約用的帳戶私鑰，裡面也要放些 goerli ether
- `ALCHEMY_API_KEY`: [alchemy](https://dashboard.alchemy.com/) 服務的 API key，作為 RPC 連接測試網節點用
- `ETHERSCAN_API_KEY`: [etherscan](https://etherscan.io/) 服務，上傳驗證合約原始碼用

## 開發

1. Compile

```
yarn compile
```

2. Test

```
yarn test
```

3. Deploy

```
yarn deploy <your deploy script> --network goerli
```

ex.

```
yarn deploy scripts/deploy.ts --network goerli
```

會回傳 deploy 成功的 contract address

4. Verify

```
yarn verify <your contract address> <args>
```

ex.

```
yarn verify 0x00a7f379FD4c6802a972398a352053862410DE51 1661616400
```

5. Connect remix

```
yarn watch
```
