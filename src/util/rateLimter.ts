class RateLimiter {
    private requestQueue: Array<() => Promise<any>> = [];
    private isProcessing = false;

    private requestInterval = 1000 / this.requestsPerSecond; // Convert to milliseconds
    private lastRequestTime = 0;

    constructor(
        private requestsPerSecond: number = 10
    ) {
    }

    async callWithRateLimit(call: Promise<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            this.requestQueue.push(async () => {
                try {
                    const result = await call;
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });

            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }
    private async processQueue(): Promise<void> {
        if (this.requestQueue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const request = this.requestQueue.shift()!;

        // Wait if needed to respect rate limit
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.requestInterval) {
            await this.delay(this.requestInterval - timeSinceLastRequest);
        }

        this.lastRequestTime = Date.now();
        await request();

        // Process next request
        this.processQueue();
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
