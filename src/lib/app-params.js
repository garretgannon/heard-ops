const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map(), location: { href: '' } } : window;
const storage = windowObj.localStorage;
const defaultAppId = '69f0c74de6e9ba52961af58a';
const defaultBase44Url = 'https://base44.app';

const toSnakeCase = (str) => {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
    if (isNode) {
        return defaultValue;
    }
    const storageKey = `base44_${toSnakeCase(paramName)}`;
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get(paramName);
    if (removeFromUrl) {
        urlParams.delete(paramName);
        const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
            }${window.location.hash}`;
        window.history.replaceState({}, document.title, newUrl);
    }
    if (searchParam) {
        storage.setItem(storageKey, searchParam);
        return searchParam;
    }
    if (defaultValue) {
        storage.setItem(storageKey, defaultValue);
        return defaultValue;
    }
    const storedValue = storage.getItem(storageKey);
    if (storedValue) {
        return storedValue;
    }
    return null;
}

const getAppParams = () => {
    if (getAppParamValue("clear_access_token") === 'true') {
        storage.removeItem('base44_access_token');
        storage.removeItem('token');
    }
    return {
        appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID || defaultAppId }),
        token: getAppParamValue("access_token", { removeFromUrl: true }),
        fromUrl: getAppParamValue("from_url", { defaultValue: windowObj.location.href }),
        functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
        appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL || defaultBase44Url }),
    }
}


export const appParams = {
    ...getAppParams()
}
