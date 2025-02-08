# DuckDuckGo Web Search MCPサーバー

DuckDuckGoのWeb検索とウェブページブラウジング機能を提供するModel Context Protocol (MCP) サーバー。AIアシスタントにウェブ検索機能を追加できます。

## クイックスタート

インストールせずに直接実行：

```bash
npx @showfive/duckduckgo-web-search

# 環境変数を設定して実行
npx @showfive/duckduckgo-web-search -e RATE_LIMIT_PER_SECOND=2
```

## インストールと実行

### グローバルインストール

```bash
# パッケージをインストール
npm install -g @showfive/duckduckgo-web-search

# コマンドとして実行
duckduckgo-mcp

# 環境変数を設定して実行
duckduckgo-mcp -e RATE_LIMIT_PER_SECOND=2
```

### AIアシスタントとの統合

#### Claude Desktop

設定ファイルに以下を追加：

Windows: `%APPDATA%/Claude/claude_desktop_config.json`
MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "duckduckgo-web-search": {
      "command": "duckduckgo-mcp",
      "env": {
        "RATE_LIMIT_PER_SECOND": "2",
        "RATE_LIMIT_PER_MONTH": "20000"
      }
    }
  }
}
```

## 機能

### ウェブ検索 (`duckduckgo_web_search`)
- DuckDuckGoを使用したウェブ検索
- 最大10件の検索結果を返却
- Markdown形式で整形された結果

### ウェブブラウジング (`web_browse`)
- 指定URLのウェブページ内容を取得・解析
- タイトル、メタ情報、メインコンテンツを構造化
- 画像、動画、リンクなどのメディア情報を含む

## 開発者向け情報

### パッケージの公開手順

このパッケージはWindows、macOS、Linuxで動作します。

1. npmアカウントの作成と設定（クロスプラットフォーム共通）：
```bash
# アカウント作成（まだの場合）
npm adduser

# ユーザー名の確認
npm whoami
```

2. package.jsonの更新：
```json
{
  "name": "@your-username/duckduckgo-web-search",
  "version": "1.0.1",
  "publishConfig": {
    "access": "public"
  },
  "bin": {
    "duckduckgo-mcp": "./build/index.js"
  }
}
```
※ `your-username`を、`npm whoami`で表示されたユーザー名に置き換えてください。

3. ビルドと公開：
```bash
# ビルド
npm run build

# 公開（パブリックアクセスを指定）
npm publish --access public
```

4. バージョンの更新（既存バージョンの更新時）：
```bash
# パッチバージョンの更新
npm version patch

# マイナーバージョンの更新
npm version minor

# メジャーバージョンの更新
npm version major
```

### 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/duckduckgo-web-search.git
cd duckduckgo-web-search

# 依存関係のインストール
npm install

# 開発用ビルド（自動リビルド）
npm run watch

# プロダクションビルド
npm run build
```

### デバッグ

MCP Inspectorを使用したデバッグ：

```bash
# 基本的な使用方法
npx @modelcontextprotocol/inspector build/index.js

# カスタムポートでの実行
CLIENT_PORT=8080 SERVER_PORT=9000 npx @modelcontextprotocol/inspector build/index.js

# 環境変数を設定してデバッグ
npx @modelcontextprotocol/inspector -e RATE_LIMIT_PER_SECOND=2 build/index.js
```

### Docker

```bash
# イメージのビルド
docker build -t duckduckgo-web-search .

# コンテナの実行
docker run -it --rm duckduckgo-web-search
```

## レート制限

デフォルトの制限：
- 1リクエスト/秒
- 15,000リクエスト/月（UTC基準でリセット）

環境変数で調整可能：
- `RATE_LIMIT_PER_SECOND`: 秒間リクエスト制限
- `RATE_LIMIT_PER_MONTH`: 月間リクエスト制限

## API仕様

詳細な仕様は[API仕様書](api-specification.md)を参照してください。

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください。
