# Explorer

## 環境建置

1. 須先對 Solidity compile

ex.

```
yarn workspace @app-block/erc4626 compile
```

2. 設置環境變數 `.env` ，目前使用一個 Node as Service 給 websocket 用

```
REACT_APP_WEBSOCKET_KEY=
```

3. 安裝 dependency

```
yarn
```

## 開發

```
yarn start
```
