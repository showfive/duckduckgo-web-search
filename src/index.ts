import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { WEB_SEARCH_TOOL, WEB_BROWSE_TOOL } from "./tools-metadata.js";
import { isWebBrowseArgs, isDuckDuckGoWebSearchArgs } from "./types.js";
import { performBrowse } from "./web-browser.js";
import { performWebSearch } from "./search-engine.js";

// Server implementation
const server = new Server({
    name: "example-servers/duckduckgo-search",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [WEB_SEARCH_TOOL, WEB_BROWSE_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        if (!args) {
            throw new Error("No arguments provided");
        }

        switch (name) {
            case "web_browse": {
                if (!isWebBrowseArgs(args)) {
                    throw new Error("Invalid arguments for web_browse");
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
                    throw new Error("Invalid arguments for duckduckgo_web_search");
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
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("DuckDuckGo Search MCP Server running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
