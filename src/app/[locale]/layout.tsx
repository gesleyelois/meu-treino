import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import BottomNav from "@/components/BottomNav";

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    const messages = (await import(`../../../messages/${locale}.json`)).default;

    return (
        <html lang={locale} className="dark">
            <head>
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            </head>
            <body className="font-sans antialiased">
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <main className="min-h-dvh pb-20">{children}</main>
                    <BottomNav />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
