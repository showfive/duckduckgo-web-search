import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';
import { checkRateLimit } from './rate-limiter.js';

function safeGetTextContent(element: Element | null): string {
    if (!element) return '';
    try {
        return element.textContent?.trim() || '';
    } catch (e) {
        return '';
    }
}

function extractTextFromHtml(html: string): string {
    try {
        // JSDOMの設定を修正
        // スタイル要素を含まないHTMLを作成
        const cleanHtml = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        const dom = new JSDOM(cleanHtml, {
            runScripts: "outside-only",
            includeNodeLocations: true,
            pretendToBeVisual: true
        });
        const document = dom.window.document;

        // タイトルとメタ情報の取得（エラーハンドリング付き）
        let title = '';
        let description = '';
        
        try {
            title = safeGetTextContent(document.querySelector('title'));
        } catch (e) {
            console.error('Error extracting title:', e);
        }

        try {
            description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
        } catch (e) {
            console.error('Error extracting description:', e);
        }

        // メインコンテンツの特定と要素の処理
        function processElement(element: Element | null): string {
            if (!element) return '';

            let result = '';
            
            // テキストノードの処理
            if (element.nodeType === 3 && element.textContent) { // Text node
                const text = element.textContent.trim();
                // 前後の空白を1つに統一し、空のテキストは無視
                return text ? text.replace(/\s+/g, ' ') + ' ' : '';
            }

            // 要素の種類に応じた処理
            switch (element.tagName) {
                case 'IMG': {
                    const src = element.getAttribute('src');
                    return src ? `[画像(${src})] ` : '';
                }
                
                case 'VIDEO': {
                    let videoSources = '';
                    const src = element.getAttribute('src');
                    if (src) {
                        videoSources += `[動画(${src})] `;
                    }
                    
                    // sourceタグの処理
                    const sources = element.getElementsByTagName('source');
                    Array.from(sources).forEach(source => {
                        const sourceSrc = source.getAttribute('src');
                        if (sourceSrc) {
                            videoSources += `[動画(${sourceSrc})] `;
                        }
                    });
                    
                    return videoSources;
                }

                case 'A': {
                    const href = element.getAttribute('href');
                    const text = element.textContent?.trim();
                    if (href && text) {
                        return `[${text}](${href}) `;
                    }
                    return processChildren(element);
                }

                case 'P':
                case 'DIV':
                case 'SECTION':
                case 'ARTICLE':
                    // ブロック要素の処理
                    {
                        const content = processChildren(element);
                        return content ? content + '\n\n' : ''; // 内容がある場合のみ改行を追加
                    }

                case 'LI':
                    // リスト項目の処理
                    return '- ' + processChildren(element) + '\n';

                case 'H1':
                case 'H2':
                case 'H3':
                case 'H4':
                case 'H5':
                case 'H6':
                    // 見出しの処理
                    {
                        const level = parseInt(element.tagName[1]);
                        const prefix = '#'.repeat(level);
                        return `${prefix} ${processChildren(element)}\n\n`;
                    }

                case 'BR':
                    return '\n';

                case 'SCRIPT':
                case 'STYLE':
                    // 無視する要素
                    return '';

                case 'PRE':
                case 'CODE':
                    // コードブロックの処理
                    return processChildren(element);

                default:
                    // その他の要素は子要素を処理
                    {
                        const content = processChildren(element);
                        // インライン要素の場合は空白を追加しない
                        return content;
                    }
            }
        }

        // 子要素を処理するヘルパー関数
        function processChildren(element: Element): string {
            let result = '';
            for (const child of Array.from(element.childNodes)) {
                result += processElement(child as Element);
            }
            return result;
        }

        // メインコンテンツの特定
        let mainText = '';
        const mainSelectors = ['article', 'main', '[role="main"]', '#main-content', '.main-content', '#content', '.content'];
        
        // セレクタを順番に試す
        for (const selector of mainSelectors) {
            try {
                const element = document.querySelector(selector);
                if (element) {
                    mainText = processElement(element);
                    if (mainText.length > 100) { // 十分な長さのコンテンツが見つかった
                        break;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        // メインコンテンツが見つからない場合は body から取得
        if (!mainText) {
            try {
                const bodyClone = document.body.cloneNode(true) as HTMLElement;
                Array.from(bodyClone.getElementsByTagName('script')).forEach(el => el.remove());
                Array.from(bodyClone.getElementsByTagName('style')).forEach(el => el.remove());
                mainText = processElement(bodyClone);
            } catch (e) {
                console.error('Error extracting body text:', e);
                mainText = 'Failed to extract content';
            }
        }

        // テキストの整形（改良版）
        const cleanText = mainText
            // 段落の処理
            .split(/\n\s*\n+/)              // 空行で段落を分割
            .map(paragraph => {
                return paragraph
                    .replace(/\s+/g, ' ')    // 連続する空白をスペース1つに
                    .trim();
            })
            .filter(paragraph => paragraph.length > 0)
            .join('\n\n')                    // 段落間に空行を挿入
            // メディア情報とリンクの処理
            .replace(/\[画像\(([^)]+)\)\]/g, '\n[画像($1)]\n') // 画像の前後に改行
            .replace(/\[動画\(([^)]+)\)\]/g, '\n[動画($1)]\n') // 動画の前後に改行
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1]($2)')   // リンクの形式を維持
            // 最終的な整形
            .replace(/\n{3,}/g, '\n\n')      // 3つ以上の連続改行を2つに
            .replace(/^\n+|\n+$/g, '')       // 先頭と末尾の改行を削除
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');

        // 構造化テキストの作成
        const structuredText = [
            title ? `# ${title}` : '# No Title',
            description ? `\n## Description\n${description}` : '',
            '\n## Content',
            cleanText
        ].filter(Boolean).join('\n');

        return structuredText;

    } catch (error) {
        console.error('Error in extractTextFromHtml:', error);
        return 'Failed to process webpage content';
    }
}

export async function performBrowse(url: string): Promise<string> {
    checkRateLimit();

    let browser;
    try {
        // ブラウザの起動
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // 新しいページの作成
        const page = await browser.newPage();

        // タイムアウトの設定（30秒）
        page.setDefaultTimeout(30000);

        // ページの移動
        await page.goto(url, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 30000
        });

        // JavaScriptの実行を待機（追加の動的コンテンツのロード用）
        await new Promise(resolve => setTimeout(resolve, 2000));

        // DOMコンテンツの取得
        const htmlContent = await page.content();
        
        // HTMLからテキストを抽出して整形
        const structuredText = extractTextFromHtml(htmlContent);
        return structuredText;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error in performBrowse:', errorMessage);
        throw new Error(`Failed to fetch webpage: ${errorMessage}`);
    } finally {
        // ブラウザの終了処理
        if (browser) {
            await browser.close();
        }
    }
}