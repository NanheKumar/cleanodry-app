export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://staging.petqc.com/api";

export type Store = {
  id: number;
  name: string;
  code?: string;
};

export type StoreAccount = Store & {
  customer_id: number;
};

export type Service = {
  id: number;
  name: string;
  code?: string;
};

export type CustomerSummary = {
  id: number;
  first_name: string;
  last_name: string;
  mobile: string;
  store: Store | null;
};

export type SessionUser = {
  token: string;
  customerId: number;
  firstName: string;
  lastName: string;
  mobile: string;
  store: Store | null;
  expiresAt?: string;
};

export type OtpVerification = {
  success: boolean;
  token_type: string;
  selection_token: string;
  expires_at?: string;
  customer_exists?: boolean;
  requires_store_selection?: boolean;
  active_customer?: CustomerSummary | null;
  active_store?: Store | null;
  customers?: CustomerSummary[];
};

export type StoreNotification = {
  id: number | string;
  title?: string | null;
  heading?: string | null;
  message?: string | null;
  body?: string | null;
  description?: string | null;
  created_at?: string | null;
  published_at?: string | null;
  read_at?: string | null;
  is_read?: boolean | number;
};

export type CustomerPackageLabel = {
  id: number;
  package_id: number;
  package_name: string;
  balance: number;
  label: string;
  store_label?: string;
};

export type StorePackage = {
  id: number;
  name: string;
  code?: string;
  amount: number;
  discount_type?: string;
  discount_value?: number;
  validity_days?: number;
  description?: string | null;
  is_active?: boolean;
  label?: string;
  services?: Service[];
};

export type CustomerPackageLabelsPayload = {
  success: boolean;
  customer?: Pick<CustomerSummary, "id" | "first_name" | "last_name" | "mobile">;
  store_label?: string;
  has_package: boolean;
  package_balance: number;
  packages: CustomerPackageLabel[];
};

export type StorePackagesPayload = {
  success: boolean;
  store?: Store & { label?: string };
  package_count?: number;
  packages: StorePackage[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function normalizeMobile(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^91(?=\d{10}$)/, "")
    .replace(/^0(?=\d{10}$)/, "");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : null),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (
    !response.ok ||
    (typeof payload === "object" &&
      payload &&
      "success" in payload &&
      (payload as { success?: boolean }).success === false)
  ) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: string }).message)
        : "Request failed. Please try again.";
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function getStores() {
  const payload = await request<Store[] | { stores?: Store[]; data?: Store[] }>("/stores");
  return Array.isArray(payload) ? payload : (payload.stores ?? payload.data ?? []);
}

export async function getStoresForMobile(mobile: string) {
  const payload = await request<
    StoreAccount[] | { customer_exists?: boolean; stores?: StoreAccount[]; data?: StoreAccount[] }
  >(`/stores?mobile=${encodeURIComponent(normalizeMobile(mobile))}`);
  return Array.isArray(payload) ? payload : (payload.stores ?? payload.data ?? []);
}

export async function getServices() {
  return request<Service[]>("/services");
}

export async function sendOtp(mobile: string) {
  return request<{
    success: boolean;
    customer_exists?: boolean;
    mobile?: string;
    message?: string;
  }>("/whatsapp/otp", {
    method: "POST",
    body: JSON.stringify({ mobile: normalizeMobile(mobile) }),
  });
}

export async function verifyOtp(params: { mobile: string; otp: string }) {
  return request<OtpVerification>("/whatsapp/otp/verify", {
    method: "POST",
    body: JSON.stringify({
      mobile: normalizeMobile(params.mobile),
      otp: params.otp,
    }),
  });
}

export async function selectStore(params: { selectionToken: string; storeId: number; customerId: number }) {
  const data = await request<{
    success: boolean;
    access_token: string;
    expires_at?: string;
    customer: CustomerSummary;
  }>("/whatsapp/otp/select-store", {
    method: "POST",
    headers: { Authorization: `Bearer ${params.selectionToken}` },
    body: JSON.stringify({
      store_id: params.storeId,
      customer_id: params.customerId,
    }),
  });

  return {
    token: data.access_token,
    expiresAt: data.expires_at,
    customerId: data.customer.id,
    firstName: data.customer.first_name,
    lastName: data.customer.last_name,
    mobile: data.customer.mobile,
    store: data.customer.store,
  } satisfies SessionUser;
}

export async function registerCustomer(params: {
  firstName: string;
  lastName: string;
  mobile: string;
  storeId: number;
  address: string;
  pincode: string;
}) {
  return request<{
    success: boolean;
    customer: CustomerSummary;
    message?: string;
  }>("/customer-register", {
    method: "POST",
    body: JSON.stringify({
      first_name: params.firstName,
      last_name: params.lastName,
      mobile: normalizeMobile(params.mobile),
      store_id: params.storeId,
      address: params.address,
      pincode: params.pincode,
    }),
  });
}

export async function schedulePickup(
  token: string | null,
  params: {
    storeId: number;
    fullName: string;
    mobile: string;
    address: string;
    serviceId: number;
    pickupDate: string;
    pickupTime: string;
    notes: string;
  },
) {
  return request<{ success: boolean; pickup_id: number }>("/pickups", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({
      store_id: params.storeId,
      fullName: params.fullName,
      mobile: normalizeMobile(params.mobile),
      address: params.address,
      service: params.serviceId,
      pickupDate: params.pickupDate,
      pickupTime: params.pickupTime,
      notes: params.notes,
    }),
  });
}

export async function getCustomerDetails(token: string) {
  return request<{ success: boolean; customer: Record<string, unknown> }>(
    "/customer-details",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export async function updateCustomer(
  token: string,
  params: {
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
    address: string;
    pincode: string;
    gstNo: string;
  },
) {
  return request<{
    success: boolean;
    message?: string;
    customer?: Record<string, unknown>;
  }>("/customer-update", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email,
      gender: params.gender,
      address: params.address,
      pincode: params.pincode,
      gst_no: params.gstNo,
    }),
  });
}

export async function getCustomerPickups(token: string) {
  return request<{ success: boolean; pickups: Record<string, unknown>[] }>(
    "/customer-pickups",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export async function getCustomerOrders(token: string) {
  return request<{ success: boolean; orders: Record<string, unknown>[] }>(
    "/customer-orders",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export async function getCustomerPackageLabels(token: string) {
  return request<CustomerPackageLabelsPayload>("/customer-package-labels", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getStorePackages(token: string, storeId: number) {
  return request<StorePackagesPayload>(`/store-packages?store_id=${encodeURIComponent(String(storeId))}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

type StoreNotificationsPayload =
  | StoreNotification[]
  | {
      success?: boolean;
      data?: StoreNotification[];
      notifications?: StoreNotification[];
      unread_count?: number;
    };

export async function getStoreNotifications(token: string, limit = 20) {
  const payload = await request<StoreNotificationsPayload>(
    `/store-notifications?limit=${encodeURIComponent(String(limit))}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const notifications = Array.isArray(payload)
    ? payload
    : (payload.notifications ?? payload.data ?? []);
  const unreadCount = Array.isArray(payload)
    ? notifications.filter((item) => !item.read_at && item.is_read !== true && item.is_read !== 1).length
    : (payload.unread_count ??
      notifications.filter((item) => !item.read_at && item.is_read !== true && item.is_read !== 1).length);

  return { notifications, unreadCount };
}
