"use client";

/**
 * Passkey Manager Component
 *
 * Client-side component for managing passkeys (WebAuthn credentials).
 * Allows users to:
 * - View their registered passkeys
 * - Add new passkeys
 * - Remove existing passkeys
 *
 * Charter Compliance:
 * - P1: User controls their authentication credentials
 * - P7: All passkey mutations are audit-logged
 */

import { useState, useCallback, useEffect } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { formatClubDateTime } from "@/lib/timezone";

interface Passkey {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  isRevoked: boolean;
}

interface PasskeyManagerProps {
  initialPasskeys?: Passkey[];
}

export default function PasskeyManager({ initialPasskeys = [] }: PasskeyManagerProps) {
  const [passkeys, setPasskeys] = useState<Passkey[]>(initialPasskeys);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Fetch passkeys on mount
  useEffect(() => {
    if (initialPasskeys.length === 0) {
      fetchPasskeys();
    }
  }, [initialPasskeys.length]);

  const fetchPasskeys = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/me/passkeys", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPasskeys(data.passkeys || []);
      }
    } catch {
      // Silently fail on initial load
    }
  }, []);

  const handleAddPasskey = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Begin registration
      const beginRes = await fetch("/api/v1/auth/passkey/register/begin", {
        method: "POST",
        credentials: "include",
      });

      if (!beginRes.ok) {
        const data = await beginRes.json();
        throw new Error(data.error || data.message || "Failed to start registration");
      }

      const { options, challengeId } = await beginRes.json();

      // Step 2: Create credential
      const credential = await startRegistration({
        optionsJSON: options,
      });

      // Step 3: Finish registration
      const finishRes = await fetch("/api/v1/auth/passkey/register/finish", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          response: credential,
          deviceName: deviceName || undefined,
        }),
      });

      if (!finishRes.ok) {
        const data = await finishRes.json();
        throw new Error(data.error || data.message || "Failed to register passkey");
      }

      setSuccess("Passkey added successfully!");
      setShowAddForm(false);
      setDeviceName("");
      await fetchPasskeys();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add passkey";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [deviceName, fetchPasskeys]);

  const handleRemovePasskey = useCallback(
    async (passkeyId: string) => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const res = await fetch("/api/v1/me/passkeys", {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passkeyId,
            reason: "User requested removal",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || data.message || "Failed to remove passkey");
        }

        setSuccess("Passkey removed successfully");
        setConfirmDelete(null);
        await fetchPasskeys();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to remove passkey";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [fetchPasskeys]
  );

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Never";
    return formatClubDateTime(new Date(isoString));
  };

  const activePasskeys = passkeys.filter((p) => !p.isRevoked);

  return (
    <div data-test-id="passkey-manager" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 600,
            margin: 0,
            color: "#111827",
          }}
        >
          Passkeys
        </h3>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={loading}
          data-test-id="add-passkey-button"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            backgroundColor: "#1e40af",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          + Add Passkey
        </button>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "20px",
        }}
      >
        Passkeys provide passwordless, phishing-resistant authentication using Touch ID,
        Face ID, Windows Hello, or security keys.
      </p>

      {/* Messages */}
      {error && (
        <div
          data-test-id="passkey-manager-error"
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            color: "#dc2626",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          data-test-id="passkey-manager-success"
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "6px",
            color: "#166534",
            fontSize: "14px",
          }}
        >
          {success}
        </div>
      )}

      {/* Add Passkey Form */}
      {showAddForm && (
        <div
          data-test-id="add-passkey-form"
          style={{
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        >
          <h4
            style={{
              fontSize: "16px",
              fontWeight: 500,
              marginBottom: "12px",
              color: "#111827",
            }}
          >
            Add a new passkey
          </h4>
          <div style={{ marginBottom: "12px" }}>
            <label
              htmlFor="deviceName"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
              }}
            >
              Device name (optional)
            </label>
            <input
              type="text"
              id="deviceName"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., MacBook Pro, iPhone 15"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleAddPasskey}
              disabled={loading}
              data-test-id="confirm-add-passkey"
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: loading ? "#94a3b8" : "#1e40af",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Adding..." : "Add Passkey"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setDeviceName("");
              }}
              disabled={loading}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: "#fff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Passkey List */}
      {activePasskeys.length === 0 ? (
        <div
          data-test-id="no-passkeys"
          style={{
            padding: "32px",
            textAlign: "center",
            backgroundColor: "#f9fafb",
            border: "1px dashed #d1d5db",
            borderRadius: "8px",
            color: "#6b7280",
          }}
        >
          <p style={{ marginBottom: "8px" }}>No passkeys registered yet.</p>
          <p style={{ fontSize: "14px" }}>
            Add a passkey to enable passwordless sign-in.
          </p>
        </div>
      ) : (
        <ul
          data-test-id="passkey-list"
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {activePasskeys.map((passkey) => (
            <li
              key={passkey.id}
              data-test-id="passkey-item"
              style={{
                padding: "16px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 500,
                    color: "#111827",
                    marginBottom: "4px",
                  }}
                >
                  {passkey.deviceName || "Unnamed passkey"}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Added: {formatDate(passkey.createdAt)}
                  {passkey.lastUsedAt && (
                    <span style={{ marginLeft: "12px" }}>
                      Last used: {formatDate(passkey.lastUsedAt)}
                    </span>
                  )}
                </div>
              </div>
              <div>
                {confirmDelete === passkey.id ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleRemovePasskey(passkey.id)}
                      disabled={loading}
                      data-test-id="confirm-remove-passkey"
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        backgroundColor: "#dc2626",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      disabled={loading}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        backgroundColor: "#fff",
                        color: "#374151",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(passkey.id)}
                    disabled={loading}
                    data-test-id="remove-passkey-button"
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 500,
                      backgroundColor: "#fff",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "4px",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Warning if only one passkey */}
      {activePasskeys.length === 1 && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#92400e",
          }}
        >
          <strong>Note:</strong> If you remove your only passkey, you will need to use
          email magic links to sign in and add a new passkey.
        </div>
      )}
    </div>
  );
}
