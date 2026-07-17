import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Linking, Platform } from 'react-native';

import { API_BASE_URL, ApiError, registerCustomerFcmToken } from '@/lib/api';

const REGISTERED_TOKEN_STORAGE_KEY = 'cleanodry.lastRegisteredFcmToken';
const TRUSTED_ACTION_HOSTS = new Set(['cleanodry.com', 'www.cleanodry.com', 'cleanodry.in', 'www.cleanodry.in']);
const FCM_REGISTRATION_PATH = '/customer-fcm-token';

type FcmRegistrationErrorCode =
  | 'permission_denied'
  | 'not_physical_device'
  | 'token_not_fcm'
  | 'empty_token'
  | 'api_401'
  | 'api_422'
  | 'api_500'
  | 'timeout'
  | 'network_error';

type FcmDiagnostics = {
  permission: string;
  physicalDevice: boolean;
  tokenGenerated: boolean;
  tokenType: string;
  maskedToken: string;
  customerId: string;
  storeId: string;
  apiBaseUrl: string;
  finalEndpoint: string;
  requestStarted: boolean;
  responseStatus: string;
  cacheSkipped: boolean;
  result: 'success' | 'failure';
  errorCode?: FcmRegistrationErrorCode;
  safeMessage?: string;
};

export class FcmRegistrationError extends Error {
  constructor(
    public code: FcmRegistrationErrorCode,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'FcmRegistrationError';
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(customerToken: string, customerId?: number, storeId?: number) {
  const diagnostics = createDiagnostics(customerId, storeId);

  try {
    if (Platform.OS !== 'android' || !Device.isDevice) {
      throw new FcmRegistrationError('not_physical_device', 'FCM registration requires a physical Android device.');
    }

    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#25D366',
      sound: 'default',
    });

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    if (existing.status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    diagnostics.permission = finalStatus;

    if (finalStatus !== 'granted') {
      throw new FcmRegistrationError('permission_denied', 'Notification permission was not granted.');
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = await Notifications.getDevicePushTokenAsync();
    diagnostics.tokenGenerated = Boolean(token.data);
    diagnostics.tokenType = token.type;
    diagnostics.maskedToken = maskToken(token.data);

    if (token.type !== 'fcm') {
      throw new FcmRegistrationError('token_not_fcm', `Native push token type was ${token.type}.`);
    }

    if (!token.data) {
      throw new FcmRegistrationError('empty_token', 'Native FCM token was empty.');
    }

    await registerFcmToken(customerToken, token.data, customerId, storeId, diagnostics);

    diagnostics.result = 'success';
    logFcmDiagnostics(diagnostics);

    return {
      token: token.data,
      projectId,
    };
  } catch (error) {
    const registrationError = normalizeFcmRegistrationError(error);
    diagnostics.result = 'failure';
    diagnostics.errorCode = registrationError.code;
    diagnostics.responseStatus = String(registrationError.status ?? diagnostics.responseStatus);
    diagnostics.safeMessage = registrationError.message;
    logFcmDiagnostics(diagnostics);
    throw registrationError;
  }
}

export function addPushTokenRefreshListener(
  customerToken: string,
  customerId?: number,
  storeId?: number,
  onRegistrationError?: (error: FcmRegistrationError) => void,
) {
  if (Platform.OS !== 'android' || !Device.isDevice) {
    return () => undefined;
  }

  const subscription = Notifications.addPushTokenListener((token) => {
    if (token.type === 'fcm' && token.data) {
      const diagnostics = {
        ...createDiagnostics(customerId, storeId),
        permission: 'refresh_listener',
        tokenGenerated: true,
        tokenType: token.type,
        maskedToken: maskToken(token.data),
      };

      void registerFcmToken(customerToken, token.data, customerId, storeId, diagnostics)
        .then(() => {
          diagnostics.result = 'success';
          logFcmDiagnostics(diagnostics);
        })
        .catch((error) => {
          const registrationError = normalizeFcmRegistrationError(error);
          onRegistrationError?.(registrationError);
          diagnostics.result = 'failure';
          diagnostics.errorCode = registrationError.code;
          diagnostics.responseStatus = String(registrationError.status ?? diagnostics.responseStatus);
          diagnostics.safeMessage = registrationError.message;
          logFcmDiagnostics(diagnostics);
        });
    }
  });

  return () => {
    subscription.remove();
  };
}

export function addStoreNotificationListeners(onNotification: () => void) {
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    if (isStoreNotification(notification.request.content.data)) {
      onNotification();
    }
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (isStoreNotification(data)) {
      onNotification();
      void openTrustedActionUrl(data);
    }
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

export async function clearLocalFcmRegistrationState() {
  await SecureStore.deleteItemAsync(REGISTERED_TOKEN_STORAGE_KEY).catch(() => undefined);
}

async function registerFcmToken(
  customerToken: string,
  fcmToken: string,
  customerId?: number,
  storeId?: number,
  diagnostics?: FcmDiagnostics,
) {
  const registrationKey = buildRegistrationKey(fcmToken, customerId, storeId);
  const lastRegistrationKey = await SecureStore.getItemAsync(REGISTERED_TOKEN_STORAGE_KEY).catch(() => null);
  if (lastRegistrationKey === registrationKey) {
    if (diagnostics) {
      diagnostics.cacheSkipped = true;
    }
    return;
  }

  if (diagnostics) {
    diagnostics.requestStarted = true;
  }

  const response = await registerCustomerFcmToken(customerToken, {
    fcmToken,
    platform: Platform.OS,
    deviceName: Device.deviceName ?? undefined,
    appVersion: Constants.expoConfig?.version,
  });

  if (diagnostics) {
    diagnostics.responseStatus = String(response.status);
  }

  await SecureStore.setItemAsync(REGISTERED_TOKEN_STORAGE_KEY, registrationKey).catch(() => undefined);
}

function createDiagnostics(customerId?: number, storeId?: number): FcmDiagnostics {
  return {
    permission: 'unknown',
    physicalDevice: Platform.OS === 'android' && Device.isDevice,
    tokenGenerated: false,
    tokenType: 'unknown',
    maskedToken: 'none',
    customerId: customerId ? String(customerId) : 'unknown',
    storeId: storeId ? String(storeId) : 'unknown',
    apiBaseUrl: API_BASE_URL,
    finalEndpoint: `${API_BASE_URL}${FCM_REGISTRATION_PATH}`,
    requestStarted: false,
    responseStatus: 'not_requested',
    cacheSkipped: false,
    result: 'failure',
  };
}

function buildRegistrationKey(fcmToken: string, customerId?: number, storeId?: number) {
  return [API_BASE_URL, customerId ?? 'unknown', storeId ?? 'unknown', fcmToken].join(':');
}

function maskToken(token: string | undefined) {
  if (!token) {
    return 'none';
  }

  if (token.length <= 10) {
    return `${token.slice(0, 2)}...${token.slice(-2)}`;
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function normalizeFcmRegistrationError(error: unknown) {
  if (error instanceof FcmRegistrationError) {
    return error;
  }

  if (error instanceof ApiError) {
    if (error.message.toLowerCase().includes('timed out')) {
      return new FcmRegistrationError('timeout', 'FCM registration request timed out.', error.status);
    }

    return new FcmRegistrationError(apiErrorCode(error.status), safeApiMessage(error), error.status);
  }

  return new FcmRegistrationError('network_error', 'FCM registration network error.');
}

function apiErrorCode(status: number): FcmRegistrationErrorCode {
  if (status === 401) {
    return 'api_401';
  }

  if (status === 422) {
    return 'api_422';
  }

  if (status >= 500) {
    return 'api_500';
  }

  return 'network_error';
}

function safeApiMessage(error: ApiError) {
  if (error.status === 401) {
    return 'FCM registration failed: unauthorized.';
  }

  if (error.status === 422) {
    return 'FCM registration failed: validation error.';
  }

  if (error.status >= 500) {
    return 'FCM registration failed: server error.';
  }

  return error.message || 'FCM registration failed.';
}

export function logFcmRegistrationFailure(error: unknown, source: string) {
  if (!__DEV__) {
    return;
  }

  const registrationError = normalizeFcmRegistrationError(error);
  console.warn('[Cleanodry FCM] registration failure', {
    source,
    category: registrationError.code,
    status: registrationError.status ?? 'unknown',
    message: registrationError.message,
  });
}

function logFcmDiagnostics(diagnostics: FcmDiagnostics) {
  if (!__DEV__) {
    return;
  }

  console.info('[Cleanodry FCM] registration result', {
    permission: diagnostics.permission,
    physicalDevice: diagnostics.physicalDevice,
    tokenGenerated: diagnostics.tokenGenerated,
    tokenType: diagnostics.tokenType,
    maskedToken: diagnostics.maskedToken,
    customerId: diagnostics.customerId,
    storeId: diagnostics.storeId,
    apiBaseUrl: diagnostics.apiBaseUrl,
    finalEndpoint: diagnostics.finalEndpoint,
    requestStarted: diagnostics.requestStarted,
    responseStatus: diagnostics.responseStatus,
    cacheSkipped: diagnostics.cacheSkipped,
    result: diagnostics.result,
    category: diagnostics.errorCode,
    message: diagnostics.safeMessage,
  });
}

async function openTrustedActionUrl(data: Record<string, unknown>) {
  const url = trustedActionUrl(data.action_url);
  if (!url) {
    return;
  }

  const canOpen = await Linking.canOpenURL(url).catch(() => false);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

function trustedActionUrl(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const rawUrl = value.trim();
  if (rawUrl.startsWith('/')) {
    return `cleanodryapp://${rawUrl.replace(/^\/+/, '')}`;
  }

  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'cleanodryapp:') {
      return rawUrl;
    }

    if ((url.protocol === 'https:' || url.protocol === 'http:') && TRUSTED_ACTION_HOSTS.has(url.hostname.toLowerCase())) {
      return rawUrl;
    }
  } catch {
    return null;
  }

  return null;
}

function isStoreNotification(data: Record<string, unknown> | undefined): data is Record<string, unknown> {
  if (!data) {
    return false;
  }

  return (
    data.type === 'store_notification' ||
    Boolean(data.notification_id || data.store_id || data.action_url || data.image_url)
  );
}
