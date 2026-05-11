import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const clientConfig = {
  appId,
  token,
  functionsVersion,
  requiresAuth: false,
  appBaseUrl
};

if (import.meta.env.VITE_BASE44_APP_BASE_URL) {
  clientConfig.serverUrl = '';
}

//Create a client with authentication required
export const base44 = createClient(clientConfig);
