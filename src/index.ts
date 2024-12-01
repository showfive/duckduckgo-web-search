import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// インターフェース定義
interface DuckDuckGoSearchArgs {
    query: string;
    count?: number;
}

interface DuckDuckGoResponse {
    AbstractText?: string;
    AbstractSource?: string;
    AbstractURL?: string;
    RelatedTopics: Array<{
        Text?: string;
        FirstURL?: string;
    }>;
}

const WEB_SEARCH_TOOL = {
    name: "duckduckgo_web_search",
    description: "Performs a web search using the DuckDuckGo API, ideal for general queries, news, articles, and online content. " +
        "Use this for broad information gathering, recent events, or when you need diverse web sources. " +
        "Supports content filtering and region-specific searches. " +
        "Maximum 20 results per request.",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Search query (max 400 chars)"
            },
            count: {
                type: "number",
                description: "Number of results (1-20, default 10)",
                default: 10
            }
        },
        required: ["query"],
    },
};

// Server implementation
const server = new Server({
    name: "example-servers/duckduckgo-search",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});

const RATE_LIMIT = {
    perSecond: 1,
    perMonth: 15000
};

let requestCount = {
    second: 0,
    month: 0,
    lastReset: Date.now()
};

function checkRateLimit(): void {
    const now = Date.now();
    if (now - requestCount.lastReset > 1000) {
        requestCount.second = 0;
        requestCount.lastReset = now;
    }
    if (requestCount.second >= RATE_LIMIT.perSecond ||
        requestCount.month >= RATE_LIMIT.perMonth) {
        throw new Error('Rate limit exceeded');
    }
    requestCount.second++;
    requestCount.month++;
}

function isDuckDuckGoWebSearchArgs(args: unknown): args is DuckDuckGoSearchArgs {
    return (
        typeof args === "object" &&
        args !== null &&
        "query" in args &&
        typeof (args as DuckDuckGoSearchArgs).query === "string"
    );
}

async function performWebSearch(query: string, count: number = 10): Promise<string> {
    checkRateLimit();
    
    // DuckDuckGo search API endpoint
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('no_html', '1');
    url.searchParams.set('no_redirect', '1');
    url.searchParams.set('skip_disambig', '1');
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status} ${response.statusText}\n${await response.text()}`);
    }

    const data = await response.json() as DuckDuckGoResponse;
    
    const results = [];
    
    // Add instant answer if available
    if (data.AbstractText) {
        results.push({
            title: data.AbstractSource || '',
            description: data.AbstractText,
            url: data.AbstractURL || ''
        });
    }

    // Add related topics
    const relatedTopics = data.RelatedTopics || [];
    for (let i = 0; i < Math.min(count - results.length, relatedTopics.length); i++) {
        const topic = relatedTopics[i];
        if (topic.Text && topic.FirstURL) {
            results.push({
                title: topic.Text.split(' - ')[0] || topic.Text,
                description: topic.Text,
                url: topic.FirstURL
            });
        }
    }

    // Markdown形式で検索結果を返す
    const formattedResults = results.map(r => {
        return `### ${r.title}
${r.description}

🔗 [記事を読む](${r.url})
`;
    }).join('\n\n');

    // 検索結果の前にサマリーを追加
    return `# DuckDuckGo 検索結果
${query} の検索結果（${results.length}件）

---

${formattedResults}
`;
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [WEB_SEARCH_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        if (!args) {
            throw new Error("No arguments provided");
        }

        switch (name) {
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
