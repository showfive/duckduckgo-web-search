import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { checkRateLimit } from './rate-limiter.js';

export async function performWebSearch(query: string, count: number = 10): Promise<string> {
    checkRateLimit();
    
    // DuckDuckGo search API endpoint    
    const response = await fetch('https://html.duckduckgo.com/html', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'q': query,
            's': '0',
            'o': 'json',
            'api': 'd.js',
            'vqd': '',
            'kl': 'jp-jp',
            'bing_market': 'jp-jp',
            'format': 'json',
            'no_html': '1',
            'no_redirect': '1',
            'skip_disambig': '1'
        })
    });
    
    if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status} ${response.statusText}\n${await response.text()}`);
    }

    const htmlText = await response.text();
    // DOMパーサーを使用してHTML解析
    const parser = new JSDOM(htmlText, {
        runScripts: "outside-only",
        resources: "usable",
        includeNodeLocations: true,
        pretendToBeVisual: false
    });
    const doc = parser.window.document;

    // 検索結果を抽出
    const searchResults = Array.from(doc.querySelectorAll('.result')).map(result => {
        const element = result as Element;
        return {
            title: element.querySelector('.result__title')?.textContent?.trim() || '',
            link: element.querySelector('.result__url')?.getAttribute('href') || '',
            snippet: element.querySelector('.result__snippet')?.textContent?.trim() || ''
        };
    });

    // Markdown形式で検索結果を返す
    const ken = searchResults.length < count ? searchResults.length : count;
    const formattedResults = searchResults.slice(0, count).map(r => {
        return `### ${r.title}
- snippet: ${r.snippet}
- page_url: ${r.link}
`;
    }).join('\n\n');

    // 検索結果の前にサマリーを追加
    return `# DuckDuckGo search results
query: ${query}
result count: ${ken}

-----

${formattedResults}
`;
}