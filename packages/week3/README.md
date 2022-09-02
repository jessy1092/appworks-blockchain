# Sample Hardhat Project

## 環境設定

1. 安裝 hardhat

```
yarn add hardhat
```

2. 初始化 hardhat 專案

```
npx hardhat // 看個人喜好選擇，這邊是選擇 typescript
```

> 以下 dependency 安裝，只需第一次架環境使用，現在 package.json 已經有 dependency 所以直接 `yarn` 就可以了
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

如想環境獨立使用環境變數，可以更改 `dotenv.config({ path: '../../.env' });` 指定想要的環境變數檔案位置

## 開發

1. Build (會產生 web3 跟 hardhat test 用的 type definition)

```
yarn Build
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

6. 起本地端的測試節點（使用 hardhat）

```
yarn blocknode
```
