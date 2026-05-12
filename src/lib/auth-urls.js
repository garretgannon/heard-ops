export const CANONICAL_APP_BASE_URL = 'https://heard-ops.base44.app';

const staleBase44Hosts = new Set(['base44.app', 'www.base44.app']);

export function normalizeAppBaseUrl(value) {
    if (!value) {
        return CANONICAL_APP_BASE_URL;
    }

    try {
        const url = new URL(value);
        if (staleBase44Hosts.has(url.hostname)) {
            return CANONICAL_APP_BASE_URL;
        }
        return url.origin;
    } catch {
        return CANONICAL_APP_BASE_URL;
    }
}

export function clearStaleAuthStorage() {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const storedAppBaseUrl = window.localStorage.getItem('base44_app_base_url');
        if (storedAppBaseUrl && normalizeAppBaseUrl(storedAppBaseUrl) !== storedAppBaseUrl) {
            window.localStorage.removeItem('base44_app_base_url');
        }
    } catch {
        // Storage can be unavailable in private browsing contexts.
    }
}

export function buildLoginUrl(fromUrl = window.location.href) {
    clearStaleAuthStorage();
    return `${CANONICAL_APP_BASE_URL}/login?from_url=${encodeURIComponent(fromUrl)}`;
}

export function redirectToLogin(fromUrl = window.location.href) {
    window.location.href = buildLoginUrl(fromUrl);
}
