/**
 * ApiDocsClient - Swagger UI client component
 *
 * Loads Swagger UI from CDN and renders the OpenAPI specification.
 * Includes authentication notes and development guidance.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function ApiDocsClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swaggerLoaded, setSwaggerLoaded] = useState(false);

  // Initialize Swagger UI after scripts are loaded
  useEffect(() => {
    if (!swaggerLoaded) return;

    // Wait for SwaggerUIBundle to be available
    const initSwagger = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SwaggerUIBundle = (window as any).SwaggerUIBundle;
      if (!SwaggerUIBundle) {
        setTimeout(initSwagger, 100);
        return;
      }

      try {
        SwaggerUIBundle({
          url: "/api/openapi",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).SwaggerUIStandalonePreset,
          ],
          plugins: [SwaggerUIBundle.plugins.DownloadUrl],
          layout: "StandaloneLayout",
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 2,
          docExpansion: "list",
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          tryItOutEnabled: false, // Disable "Try it out" for safety
          supportedSubmitMethods: [], // No submit methods (read-only)
        });
        setLoading(false);
      } catch (err) {
        console.error("Error initializing Swagger UI:", err);
        setError("Failed to initialize API documentation viewer");
        setLoading(false);
      }
    };

    initSwagger();
  }, [swaggerLoaded]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafafa" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: "#1e293b",
          color: "#fff",
          padding: "16px 24px",
          borderBottom: "3px solid #f59e0b",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
              ClubOS API Documentation
            </h1>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              Internal Developer Documentation - Not for External Use
            </p>
          </div>
          <span
            style={{
              padding: "4px 12px",
              backgroundColor: "#dc2626",
              color: "#fff",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Internal Only
          </span>
        </div>
      </header>

      {/* Auth Notes Banner */}
      <div
        style={{
          backgroundColor: "#fef3c7",
          borderBottom: "1px solid #fde68a",
          padding: "16px 24px",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: "14px",
              fontWeight: 600,
              color: "#92400e",
            }}
          >
            Authentication Notes
          </h2>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 20px",
              fontSize: "13px",
              color: "#78350f",
              lineHeight: 1.6,
            }}
          >
            <li>
              <strong>Cookie-based auth:</strong> Session cookies are set after
              login via magic link or passkey.
            </li>
            <li>
              <strong>Test tokens (dev only):</strong> Use header{" "}
              <code
                style={{
                  backgroundColor: "#fff",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  fontSize: "12px",
                }}
              >
                x-admin-test-token: dev-admin-token
              </code>{" "}
              for E2E tests.
            </li>
            <li>
              <strong>Bearer tokens (dev only):</strong> Format{" "}
              <code
                style={{
                  backgroundColor: "#fff",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  fontSize: "12px",
                }}
              >
                Bearer test-admin-123
              </code>{" "}
              or{" "}
              <code
                style={{
                  backgroundColor: "#fff",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  fontSize: "12px",
                }}
              >
                Bearer test-member-456
              </code>
            </li>
            <li>
              <strong>Security:</strong> Never embed real tokens in
              documentation or code. Use placeholder values.
            </li>
          </ul>
        </div>
      </div>

      {/* Loading/Error states */}
      {loading && !error && (
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #e5e7eb",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p>Loading API documentation...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              margin: "0 auto",
              border: "1px solid #fecaca",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0" }}>Error Loading Documentation</h3>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Swagger UI Container */}
      <div id="swagger-ui" style={{ padding: "0 24px 40px" }} />

      {/* Load Swagger UI from CDN */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => setSwaggerLoaded(true)}
        onError={() => setError("Failed to load Swagger UI library")}
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />

      {/* Custom Swagger UI Styles */}
      <style>{`
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui .info .title {
          font-size: 28px;
        }
        .swagger-ui .scheme-container {
          background: #fff;
          box-shadow: none;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }
        .swagger-ui .opblock-tag {
          border-bottom: 1px solid #e5e7eb;
        }
        .swagger-ui .opblock {
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .swagger-ui .opblock .opblock-summary {
          border-radius: 8px;
        }
        .swagger-ui .btn {
          border-radius: 6px;
        }
        .swagger-ui select {
          border-radius: 6px;
        }
        .swagger-ui input[type=text] {
          border-radius: 6px;
        }
        .swagger-ui textarea {
          border-radius: 6px;
        }
        .swagger-ui .model-box {
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
