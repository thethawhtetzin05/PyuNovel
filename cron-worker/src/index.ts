export interface Env {
    API_URL: string;
    ADMIN_SECRET_KEY: string;
}

export default {
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
        const targetUrl = env.API_URL || "https://pyunovel.com/api/cron/publish";

        // We use ctx.waitUntil to ensure the fetch completes before the worker shuts down
        ctx.waitUntil(
            (async () => {
                try {
                    const response = await fetch(targetUrl, {
                        method: "GET",
                        headers: {
                            "x-admin-secret": env.ADMIN_SECRET_KEY,
                        },
                    });

                    if (!response.ok) {
                        console.error(`Cron trigger failed with status: ${response.status}`);
                        const text = await response.text();
                        console.error("Response:", text);
                    } else {
                        console.log(`Cron successfully triggered: ${response.status}`);
                    }
                } catch (error) {
                    console.error("Error triggering cron:", error);
                }
            })()
        );
    },

    // Provide a generic fetch handler just in case it is pinged from a browser
    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
        return new Response("Cron Worker is active.", { status: 200 });
    }
};
