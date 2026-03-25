export const onRequestError = async (
    ...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>
) => {
    const { captureRequestError } = await import('@sentry/nextjs');
    captureRequestError(...args);
};

export async function register() {
    // Only initialize Sentry in Node.js runtime (not edge runtime)
    // Edge runtime causes duplicated identifier errors with @cloudflare/next-on-pages
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const Sentry = await import('@sentry/nextjs');
        Sentry.init({
            dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
            tracesSampleRate: 1,
            debug: false,
        });
    }
}
