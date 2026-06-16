export type JsonInit = ResponseInit & {
  headers?: HeadersInit;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};

export function jsonResponse(body: unknown, init: JsonInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("Pragma", "no-cache");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  requestId?: string | null,
) {
  const headers: Record<string, string> = {
    ...NO_STORE_HEADERS,
  };

  if (requestId) {
    headers["X-Request-Id"] = requestId;
  }

  return jsonResponse(
    {
      error: {
        code,
        message,
        ...(requestId ? { request_id: requestId } : {}),
      },
    },
    { status, headers },
  );
}

export function methodNotAllowed(allow: string) {
  return jsonResponse(
    {
      error: {
        code: "method_not_allowed",
        message: "Method not allowed.",
      },
    },
    {
      status: 405,
      headers: {
        Allow: allow,
        ...NO_STORE_HEADERS,
      },
    },
  );
}

export function limitText(value: unknown, maxLength: number) {
  const text = typeof value === "string" ? value : String(value ?? "");
  const normalized = Array.from(text)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? " " : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}

export async function parseJsonBody<T>(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      response: errorResponse(400, "invalid_request", "JSON request body is required."),
    };
  }

  const rawBody = await request.text();
  const bodyBytes = new TextEncoder().encode(rawBody).byteLength;

  if (bodyBytes > maxBytes) {
    return {
      ok: false,
      response: errorResponse(413, "payload_too_large", "Request body is too large."),
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(rawBody) as T,
    };
  } catch {
    return {
      ok: false,
      response: errorResponse(400, "invalid_request", "Request body must be valid JSON."),
    };
  }
}

export function getBearerToken(request: Request) {
  const value = request.headers.get("authorization")?.trim();

  if (!value || !value.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}

export function jsonNoStoreHeaders() {
  return {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
  };
}
