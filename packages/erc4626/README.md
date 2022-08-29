# Test ERC4626

會有兩種合約

- 一個是 ERC20 - TWDF 自己發的 Token，當作測試用
- 一個是 ERC4626 - TWDFVault 測試金庫，預設使用 TWDF，也可以在 depoly 改成自己的 ERC20 合約，儲存其他 asset

## 環境設定

- 安裝 dependency

```
yarn
```

PS. 想從零開始建置 hardhat ，可以參考 [Week3](../week3/README.md)

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

6. 起本地端的測試節點（使用 hardhat）

```
yarn blocknode
```
