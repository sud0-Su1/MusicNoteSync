import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;

    try {
      const errorData = await res.json();
      errorMessage = errorData.message || `Request failed with status ${res.status}`;
    } catch (e) {
      const text = (await res.text()) || res.statusText;
      errorMessage = `${res.status}: ${text}`;
    }

    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  try {
    return await res.json();
  } catch (e) {
    // Return null if no JSON content
    return null;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    // Don't redirect for auth endpoints (login/register/user)
    const isAuthEndpoint = url.includes("/api/auth/");
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else if (unauthorizedBehavior === "redirect" && !isAuthEndpoint) {
        // Only redirect non-auth endpoints
        window.location.href = "/login";
        return null;
      }
      
      // Default to throwing for other cases
      const text = await res.text();
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 60000, // 1 minute
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
