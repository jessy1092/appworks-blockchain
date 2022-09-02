# Explorer

## 環境建置

1. 須先對 Solidity compile

ex.

```
yarn workspace @app-block/erc4626 compile
```

2. 安裝 dependency

```
yarn
```

## 環境參數

建立 `.env` 檔案，填入以下的值（範例在 `.env.example`）

- `REACT_APP_WEBSOCKET_KEY`: [alchemy](https://dashboard.alchemy.com/) 服務的 API key，作為 websocket 連接測試網節點用

## 開發

```
yarn start
```
