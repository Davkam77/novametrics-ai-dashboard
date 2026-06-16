import type { IncomingMessage, ServerResponse } from "node:http";
import { buffer } from "node:stream/consumers";

function toHeaders(input: IncomingMessage["headers"]) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
      continue;
    }

    headers.set(key, value);
  }

  return headers;
}

async function toRequest(req: IncomingMessage) {
  const method = (req.method ?? "GET").toUpperCase();
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const init: RequestInit = {
    method,
    headers: toHeaders(req.headers),
  };

  if (method !== "GET" && method !== "HEAD") {
    const body = await buffer(req);
    init.body = body.length > 0 ? body.toString("utf8") : undefined;
  }

  return new Request(url, init);
}

async function writeResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = await response.arrayBuffer();
  res.end(Buffer.from(body));
}

export async function handleNodeRequest(
  req: IncomingMessage,
  res: ServerResponse,
  handler: (request: Request) => Promise<Response>,
) {
  try {
    const request = await toRequest(req);
    const response = await handler(request);
    await writeResponse(res, response);
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          error: {
            code: "internal_error",
            message: "Internal server error.",
          },
        }),
      );
      return;
    }

    res.end();
  }
}
