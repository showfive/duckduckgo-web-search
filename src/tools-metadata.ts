export const WEB_BROWSE_TOOL = {
    name: "web_browse",
    description: "Retrieves the HTML content of a specified web page. " +
        "Use this to fetch and analyze web content from a given URL.",
    inputSchema: {
        type: "object",
        properties: {
            url: {
                type: "string",
                description: "URL of the webpage to browse"
            }
        },
        required: ["url"],
    },
};

export const WEB_SEARCH_TOOL = {
    name: "duckduckgo_web_search",
    description: "Performs a web search using the DuckDuckGo API, ideal for general queries, news, articles, and online content. " +
        "Use this for broad information gathering, recent events, or when you need diverse web sources. " +
        "Supports content filtering and region-specific searches. " +
        "Maximum 10 results per request.",
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