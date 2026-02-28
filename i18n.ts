import { getRequestConfig } from 'next-intl/server';
import { routing } from './i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // next-intl v4: locale comes from requestLocale (async)
    let locale = await requestLocale;

    // Fallback to default if locale is invalid
    if (!locale || !routing.locales.includes(locale as 'en' | 'my')) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});
