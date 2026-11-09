// Assumes cookie auth and a Vite proxy forwarding /api -> Kestrel.

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

/** Shape of ASP.NET Core's default ProblemDetails / ValidationProblemDetails. */
export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>; // validation errors, keyed by field
}

export class ApiError extends Error {
  status: number;
  problem: ProblemDetails | null;

  constructor(status: number, problem: ProblemDetails | null, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get fieldErrors() {
    return this.problem?.errors ?? {};
  }
}

type Params = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  params?: Params;
  signal?: AbortSignal; // pass React Query's signal for automatic cancellation
  headers?: HeadersInit;
}

// Optional global hook, e.g. redirect to /login or clear the query cache.
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

function buildUrl(path: string, params?: Params) {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  // Keep relative paths same-origin; keep absolute URLs intact when VITE_API_URL is set.
  return url.origin === window.location.origin ? url.pathname + url.search : url.href;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  { params, signal, headers }: RequestOptions = {},
): Promise<T> {
  const isFormData = body instanceof FormData;

  const res = await fetch(buildUrl(path, params), {
    method,
    signal,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isFormData && { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let problem: ProblemDetails | null = null;
    if (text) {
      try {
        problem = JSON.parse(text) as ProblemDetails;
      } catch {
        // Plain-text errors (e.g. Results.BadRequest("...")) use the body as the message.
      }
    }

    if (res.status === 401) onUnauthorized?.();
    throw new ApiError(
      res.status,
      problem,
      problem?.title ?? problem?.detail ?? (text || `Request failed (${res.status})`),
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PUT", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PATCH", path, body, opts),
  delete: <T = void>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, undefined, opts),
};
