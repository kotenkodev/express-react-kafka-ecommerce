import { createProxyMiddleware } from "http-proxy-middleware";
import { ClientRequest, IncomingMessage } from "http";
import { Request } from "express";

const stripApiPrefix = (path: string, req: IncomingMessage): string =>
  ((req as Request).originalUrl ?? path).replace(/^\/api(?=\/|$)/, "");

export const createGatewayProxy = (target: string, stripPrefix = true) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: stripPrefix ? stripApiPrefix : undefined,
    on: {
      proxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
        const expressReq = req as unknown as Request;
        proxyReq.setHeader("x-forwarded-for", expressReq.ip || req.socket.remoteAddress || "");
        if (expressReq.user) {
          proxyReq.setHeader("x-user-id", String(expressReq.user.id));
          if (expressReq.user.email) {
            proxyReq.setHeader("x-user-email", expressReq.user.email);
          }
          proxyReq.setHeader("x-user-role", expressReq.user.role);
        }
      },
      error: (err: Error, _req: IncomingMessage, res: any) => {
        console.error(
          `[API-Gateway] Proxy error connecting to ${target}:`,
          err.message,
        );
        if (res && typeof res.writeHead === "function" && !res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Bad Gateway",
              message: "Downstream service is currently unavailable",
            }),
          );
        }
      },
    },
  });
};

export const createSseProxy = (target: string) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: stripApiPrefix,
    on: {
      proxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
        const expressReq = req as unknown as Request;
        if (expressReq.user) {
          proxyReq.setHeader("x-user-id", String(expressReq.user.id));
          proxyReq.setHeader("x-user-role", expressReq.user.role);
        }
      },
      error: (err: Error, _req: IncomingMessage, res: any) => {
        console.error(
          `[API-Gateway] SSE proxy error connecting to ${target}:`,
          err.message,
        );
        if (res && typeof res.writeHead === "function" && !res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Bad Gateway",
              message: "Downstream SSE event stream unavailable",
            }),
          );
        }
      },
    },
  });
};
