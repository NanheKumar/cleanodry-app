export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://staging.petqc.com/api";

export type Store = {
  id: number;
  name: string;
  code?: string;
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

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: string }).message)
        : "Request failed. Please try again.";
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function getStores() {
  return request<Store[]>("/stores");
}

export async function getServices() {
  return request<Service[]>("/services");
}

export async function sendOtp(mobile: string) {
  return request<{
    success: boolean;
    customers?: CustomerSummary[];
    customer_id?: number;
    debug_otp?: string;
    message?: string;
  }>("/whatsapp/otp", {
    method: "POST",
    body: JSON.stringify({ mobile: normalizeMobile(mobile) }),
  });
}

export async function verifyOtp(params: {
  mobile: string;
  otp: string;
  customerId: number;
}) {
  const data = await request<{
    success: boolean;
    access_token: string;
    expires_at?: string;
    customer: CustomerSummary;
  }>("/whatsapp/otp/verify", {
    method: "POST",
    body: JSON.stringify({
      mobile: normalizeMobile(params.mobile),
      otp: params.otp,
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
