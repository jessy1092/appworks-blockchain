# Test ERC4626

會有兩種合約

- 一個是 ERC20 - Fake TWD (TWDF) 自己發的 Token，當作測試用
- 一個是 ERC4626 - Fake TWD Vault (vTWDF) 測試金庫，預設使用 TWDF，也可以在 depoly 改成自己的 ERC20 合約，儲存其他 asset

## 測試網合約

目前已經部署上去測試網，因此可以在測試網直接跟合約互動

- [TWDF](https://goerli.etherscan.io/token/0xe37Df5eAa40850b440a40e8E11C0d722142A0fBD)
- [vTWDF](https://goerli.etherscan.io/token/0xE243ee6884F9F05bc38CA7E0206e3bd6AabBc5b0)

TWDF 也有提供自動 mint 的功能，方便測試，可以來這裡領取: https://test-erc4626.pages.dev/

## 環境設定

- 安裝 dependency

```
yarn
```

PS. 想從零開始建置 hardhat ，可以參考 [Week3](../week3/README.md)

## 環境參數

如想環境獨立使用環境變數，可以更改 `dotenv.config({ path: '../../.env' });` 指定想要的環境變數檔案位置

## 開發

1. Build (會產生 web3 跟 hardhat test 用的 type definition)

```
yarn build
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
