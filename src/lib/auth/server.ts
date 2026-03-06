import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL || "https://placeholder-url.neonauth.us-east-1.aws.neon.tech/neondb/auth",
    cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET || "fallback-secret-at-least-thirty-two-chars-long",
    },
});
