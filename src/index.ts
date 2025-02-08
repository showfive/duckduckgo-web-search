import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { WEB_SEARCH_TOOL, WEB_BROWSE_TOOL } from "./tools-metadata.js";
import { isWebBrowseArgs, isDuckDuckGoWebSearchArgs } from "./types.js";
import { performBrowse } from "./web-browser.js";
import { performWebSearch } from "./search-engine.js";

// サーバーの実装
const server = new Server({
    name: "duckduckgo-web-search",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});

// ツールハンドラー
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [WEB_SEARCH_TOOL, WEB_BROWSE_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        if (!args) {
            throw new Error("引数が指定されていません");
        }

        switch (name) {
            case "web_browse": {
                if (!isWebBrowseArgs(args)) {
                    throw new Error("web_browseツールの引数が不正です");
                }
                const { url } = args;
                const html = await performBrowse(url);
                return {
                    content: [{ type: "text", text: html }],
                    isError: false,
                };
            }
            case "duckduckgo_web_search": {
                if (!isDuckDuckGoWebSearchArgs(args)) {
                    throw new Error("duckduckgo_web_searchツールの引数が不正です");
                }
                const { query, count = 10 } = args;
                const results = await performWebSearch(query, count);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            default:
                return {
                    content: [{ type: "text", text: `未知のツール: ${name}` }],
                    isError: true,
                };
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("DuckDuckGo Search MCPサーバーがstdioで起動しました");
}

runServer().catch((error) => {
    console.error("サーバー起動中の致命的エラー:", error);
    process.exit(1);
});
