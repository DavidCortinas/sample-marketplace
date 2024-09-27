import express from "express";
import cookieParser from "cookie-parser";
import { getSession } from "./session.server";
import { installGlobals } from "@remix-run/node";
import { Headers, Request as NodeFetchRequest } from "node-fetch";
import { createRequestHandler as createRemixRequestHandler } from "@remix-run/express";
import * as build from "@remix-run/dev/server-build";

installGlobals();

const app = express();

// Serve static files from the public directory
app.use(express.static("public"));

// Middleware to parse cookies
app.use(cookieParser());

// Middleware to handle sessions
app.use(async (req, res, next) => {
  const session = await getSession(req);
  (req as any).session = session;
  next();
});

// Remix request handler
app.all(
  "*",
  async (req, res, next) => {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          headers.append(key, v);
        }
      } else if (value !== undefined) {
        headers.append(key, value);
      }
    }

    const body = req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined;
    const remixRequest = new NodeFetchRequest(req.url, {
      method: req.method,
      headers,
      body,
    });

    const handler = createRemixRequestHandler({
      build,
      getLoadContext: async () => {
        return { session: (req as any).session };
      },
    });

    return handler(remixRequest, res, next);
  }
);

const port = process.env.PORT || 5173;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
