export interface DuckDuckGoSearchArgs {
    query: string;
    count?: number;
}

export interface WebBrowseArgs {
    url: string;
}

export function isWebBrowseArgs(args: unknown): args is WebBrowseArgs {
    return (
        typeof args === "object" &&
        args !== null &&
        "url" in args &&
        typeof (args as WebBrowseArgs).url === "string"
    );
}

export function isDuckDuckGoWebSearchArgs(args: unknown): args is DuckDuckGoSearchArgs {
    return (
        typeof args === "object" &&
        args !== null &&
        "query" in args &&
        typeof (args as DuckDuckGoSearchArgs).query === "string"
    );
}