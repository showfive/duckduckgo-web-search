# DuckDuckGo Web Search MCPサーバー API仕様書

## 概要
このMCPサーバーは、DuckDuckGoのAPIを使用してウェブ検索および閲覧機能を提供します。以下のセクションでは、サーバーが提供するツールとリソースについて説明します。

## ツール

### duckduckgo_web_search
- **説明**: DuckDuckGo APIを使用してウェブ検索を行います。
- **入力スキーマ**:
  ```json
  {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "検索クエリ（最大400文字）"
      },
      "count": {
        "type": "number",
        "description": "結果の数（1-10、デフォルトは10）",
        "default": 10
      }
    },
    "required": [
      "query"
    ]
  }
  ```

### web_browse
- **説明**: 指定されたウェブページのHTMLコンテンツを取得します。
- **入力スキーマ**:
  ```json
  {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "ブラウジングするWebページのURL"
      }
    },
    "required": [
      "url"
    ]
  }
  ```

## リソース
(リソースについては、後で追加します)