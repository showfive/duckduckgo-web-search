const RATE_LIMIT = {
    perSecond: parseInt(process.env.RATE_LIMIT_PER_SECOND || '1', 10),
    perMonth: parseInt(process.env.RATE_LIMIT_PER_MONTH || '15000', 10)
};

let requestCount = {
    second: 0,
    month: 0,
    lastSecondReset: Date.now(),
    lastMonthReset: new Date().setUTCHours(0, 0, 0, 0)
};

export function checkRateLimit(): void {
    const now = Date.now();
    
    // 秒単位のリセット
    if (now - requestCount.lastSecondReset > 1000) {
        requestCount.second = 0;
        requestCount.lastSecondReset = now;
    }

    // 月単位のリセット（UTC基準）
    const currentMonthStart = new Date().setUTCHours(0, 0, 0, 0);
    if (currentMonthStart > requestCount.lastMonthReset) {
        requestCount.month = 0;
        requestCount.lastMonthReset = currentMonthStart;
    }

    // レート制限のチェック
    if (requestCount.second >= RATE_LIMIT.perSecond ||
        requestCount.month >= RATE_LIMIT.perMonth) {
        throw new Error(`レート制限超過。現在の制限: ${RATE_LIMIT.perSecond}リクエスト/秒, ${RATE_LIMIT.perMonth}リクエスト/月`);
    }

    requestCount.second++;
    requestCount.month++;
}