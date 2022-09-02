# AppWorks Blockchain Course

記錄上課練習的合約，主要搭配

- yarn workspace
- Solidity 合約：hardhat
- 前端：Vite + React + TypeScript
- Code formatter：Prettier

## 建置

```
yarn
```

PS. 想從零開始建置 hardhat ，可以參考 [Week3](./packages/week3/README.md)

## 環境參數

設置共同測試 Key，建立 `.env` 檔案，填入以下的值（範例在 `.env.example`）

- `GOERLI_PRIVATE_KEY`: 要部署合約用的帳戶私鑰，裡面也要放些 goerli ether
- `ALCHEMY_API_KEY`: [alchemy](https://dashboard.alchemy.com/) 服務的 API key，作為 RPC 連接測試網節點用
- `ETHERSCAN_API_KEY`: [etherscan](https://etherscan.io/) 服務，上傳驗證合約原始碼用

PS. web explorer 需有額外獨立的 package .env 設置，詳情請見 [explorer](./packages/explorer/.env.example)

## 執行

根目錄執行

```
yarn workspace @app-block/week3 compile
```

也可以到各目錄內執行 script
