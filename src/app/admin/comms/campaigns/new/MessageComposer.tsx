/**
 * Message Composer Component
 *
 * Multi-step wizard for creating email campaigns:
 * 1. Name + Template selection
 * 2. Audience selection (mailing list or custom audience)
 * 3. Preview and confirm
 * 4. Schedule or send now
 *
 * P1.3: Message Composer (Send Flow)
 * Charter: P6 (human-first UI), P2 (scoped auth), P1 (audit)
 *
 * Copyright (c) Murmurant, Inc.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AudienceBuilder, { type AudienceRuleConfig } from "../../lists/AudienceBuilder";

type Step = "basics" | "audience" | "preview" | "schedule";

interface Template {
  id: string;
  name: string;
  slug: string;
  subject: string;
  bodyHtml: string;
  isActive: boolean;
}

interface MailingList {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
}

interface PreviewData {
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
}

const STEP_ORDER: Step[] = ["basics", "audience", "preview", "schedule"];

const STEP_LABELS: Record<Step, string> = {
  basics: "Template",
  audience: "Audience",
  preview: "Preview",
  schedule: "Send",
};

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
      {STEP_ORDER.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 600,
                backgroundColor: isComplete
                  ? "#16a34a"
                  : isCurrent
                    ? "#2563eb"
                    : "#e5e7eb",
                color: isComplete || isCurrent ? "white" : "#6b7280",
              }}
            >
              {isComplete ? "✓" : index + 1}
            </div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: isCurrent ? 600 : 400,
                color: isCurrent ? "#1f2937" : "#6b7280",
              }}
            >
              {STEP_LABELS[step]}
            </span>
            {index < STEP_ORDER.length - 1 && (
              <div
                style={{
                  width: "40px",
                  height: "2px",
                  backgroundColor: isComplete ? "#16a34a" : "#e5e7eb",
                  marginLeft: "8px",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MessageComposer() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("basics");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [mailingLists, setMailingLists] = useState<MailingList[]>([]);
  const [audienceType, setAudienceType] = useState<"list" | "custom">("list");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [customAudience, setCustomAudience] = useState<AudienceRuleConfig | null>(null);
  const [audienceCount, setAudienceCount] = useState<number>(0);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Fetch templates and mailing lists on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch templates
        const templatesRes = await fetch("/api/admin/comms/templates");
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates((data.templates || []).filter((t: Template) => t.isActive));
        }

        // Fetch mailing lists
        const listsRes = await fetch("/api/admin/comms/lists");
        if (listsRes.ok) {
          const data = await listsRes.json();
          setMailingLists(data.lists || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
    fetchData();
  }, []);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedList = mailingLists.find((l) => l.id === selectedListId);

  // Validate current step
  const canProceed = useCallback((): boolean => {
    switch (step) {
      case "basics":
        return campaignName.trim().length > 0 && selectedTemplateId !== "";
      case "audience":
        if (audienceType === "list") {
          return selectedListId !== "";
        }
        return customAudience !== null && audienceCount > 0;
      case "preview":
        return true;
      case "schedule":
        if (scheduleType === "later") {
          return scheduledDate !== "" && scheduledTime !== "";
        }
        return true;
      default:
        return false;
    }
  }, [
    step,
    campaignName,
    selectedTemplateId,
    audienceType,
    selectedListId,
    customAudience,
    audienceCount,
    scheduleType,
    scheduledDate,
    scheduledTime,
  ]);

  const goNext = useCallback(async () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];

      // Load preview when entering preview step
      if (nextStep === "preview" && selectedTemplateId) {
        setLoading(true);
        try {
          // Create a temporary campaign to get preview
          const response = await fetch("/api/admin/comms/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: campaignName,
              messageTemplateId: selectedTemplateId,
              mailingListId: audienceType === "list" ? selectedListId : undefined,
            }),
          });

          if (response.ok) {
            const { campaign } = await response.json();

            // Get preview
            const previewRes = await fetch(
              `/api/admin/comms/campaigns/${campaign.id}?action=preview`,
              { method: "POST" }
            );

            if (previewRes.ok) {
              const { preview } = await previewRes.json();
              setPreviewData(preview);
            }

            // Store campaign ID for final send
            sessionStorage.setItem("draft-campaign-id", campaign.id);
          }
        } catch (err) {
          console.error("Error creating campaign:", err);
          setError("Failed to create campaign draft");
        } finally {
          setLoading(false);
        }
      }

      setStep(nextStep);
    }
  }, [step, campaignName, selectedTemplateId, audienceType, selectedListId]);

  const goBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [step]);

  const handleSend = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const campaignId = sessionStorage.getItem("draft-campaign-id");
      if (!campaignId) {
        throw new Error("Campaign draft not found");
      }

      // Update campaign with mailing list if not already set
      if (audienceType === "list" && selectedListId) {
        await fetch(`/api/admin/comms/campaigns/${campaignId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mailingListId: selectedListId }),
        });
      }

      if (scheduleType === "now") {
        // Send immediately
        const response = await fetch(
          `/api/admin/comms/campaigns/${campaignId}?action=send`,
          { method: "POST" }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to send campaign");
        }

        sessionStorage.removeItem("draft-campaign-id");
        router.push(`/admin/comms/campaigns/${campaignId}?sent=true`);
      } else {
        // Schedule for later
        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

        const response = await fetch(
          `/api/admin/comms/campaigns/${campaignId}?action=schedule`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scheduledAt }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to schedule campaign");
        }

        sessionStorage.removeItem("draft-campaign-id");
        router.push(`/admin/comms/campaigns/${campaignId}?scheduled=true`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send campaign");
    } finally {
      setLoading(false);
    }
  }, [audienceType, selectedListId, scheduleType, scheduledDate, scheduledTime, router]);

  const handleAudienceChange = useCallback((config: AudienceRuleConfig, count: number) => {
    setCustomAudience(config);
    setAudienceCount(count);
  }, []);

  return (
    <div data-test-id="message-composer" style={{ maxWidth: "800px" }}>
      <StepIndicator currentStep={step} />

      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
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

      {/* Step 1: Basics */}
      {step === "basics" && (
        <div data-test-id="composer-step-basics">
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
            Name Your Campaign
          </h2>
          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="campaign-name"
              style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}
            >
              Campaign Name
            </label>
            <input
              id="campaign-name"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., January Newsletter"
              data-test-id="campaign-name-input"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
              }}
            />
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              This name is for your reference and won&apos;t be seen by recipients.
            </div>
          </div>

          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
            Choose a Template
          </h2>
          {templates.length === 0 ? (
            <div
              style={{
                padding: "24px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px" }}>
                No active templates found. Create a template first.
              </p>
              <Link
                href="/admin/comms/templates/new"
                style={{
                  color: "#2563eb",
                  fontSize: "14px",
                  textDecoration: "underline",
                }}
              >
                Create Template
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {templates.map((template) => (
                <label
                  key={template.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "16px",
                    backgroundColor:
                      selectedTemplateId === template.id ? "#eff6ff" : "white",
                    border:
                      selectedTemplateId === template.id
                        ? "2px solid #2563eb"
                        : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplateId === template.id}
                    onChange={() => setSelectedTemplateId(template.id)}
                    style={{ marginTop: "3px" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: "4px" }}>{template.name}</div>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      Subject: {template.subject}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Audience */}
      {step === "audience" && (
        <div data-test-id="composer-step-audience">
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
            Select Your Audience
          </h2>

          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => setAudienceType("list")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: audienceType === "list" ? "#2563eb" : "#f3f4f6",
                color: audienceType === "list" ? "white" : "#374151",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Use Mailing List
            </button>
            <button
              type="button"
              onClick={() => setAudienceType("custom")}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: audienceType === "custom" ? "#2563eb" : "#f3f4f6",
                color: audienceType === "custom" ? "white" : "#374151",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Build Custom Audience
            </button>
          </div>

          {audienceType === "list" && (
            <div>
              {mailingLists.length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px" }}>
                    No mailing lists found. Create a list or use a custom audience.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {mailingLists.map((list) => (
                    <label
                      key={list.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "16px",
                        backgroundColor: selectedListId === list.id ? "#eff6ff" : "white",
                        border:
                          selectedListId === list.id
                            ? "2px solid #2563eb"
                            : "1px solid #e5e7eb",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="mailing-list"
                        value={list.id}
                        checked={selectedListId === list.id}
                        onChange={() => setSelectedListId(list.id)}
                        style={{ marginTop: "3px" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, marginBottom: "4px" }}>{list.name}</div>
                        {list.description && (
                          <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>
                            {list.description}
                          </div>
                        )}
                        <div style={{ fontSize: "13px", color: "#16a34a", fontWeight: 500 }}>
                          {list.memberCount} recipients
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {audienceType === "custom" && (
            <AudienceBuilder
              initialConfig={customAudience || undefined}
              onChange={handleAudienceChange}
            />
          )}
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && (
        <div data-test-id="composer-step-preview">
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
            Preview Your Email
          </h2>

          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontSize: "14px", color: "#166534" }}>
              <strong>Campaign:</strong> {campaignName}
            </div>
            <div style={{ fontSize: "14px", color: "#166534", marginTop: "4px" }}>
              <strong>Template:</strong> {selectedTemplate?.name}
            </div>
            <div style={{ fontSize: "14px", color: "#166534", marginTop: "4px" }}>
              <strong>Audience:</strong>{" "}
              {audienceType === "list"
                ? `${selectedList?.name} (${selectedList?.memberCount} recipients)`
                : `Custom audience (${audienceCount} recipients)`}
            </div>
          </div>

          {previewData ? (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                  Subject
                </div>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>{previewData.subject}</div>
              </div>
              <div
                style={{
                  padding: "20px",
                  maxHeight: "400px",
                  overflow: "auto",
                }}
                dangerouslySetInnerHTML={{ __html: previewData.bodyHtml }}
              />
            </div>
          ) : (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              {loading ? "Loading preview..." : "Preview not available"}
            </div>
          )}

          <div
            style={{
              marginTop: "16px",
              padding: "12px 16px",
              backgroundColor: "#fef3c7",
              border: "1px solid #fcd34d",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#92400e",
            }}
          >
            <strong>Note:</strong> Merge fields like {"{{member.firstName}}"} will be replaced with
            actual member data when the email is sent.
          </div>
        </div>
      )}

      {/* Step 4: Schedule */}
      {step === "schedule" && (
        <div data-test-id="composer-step-schedule">
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
            When to Send?
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "16px",
                backgroundColor: scheduleType === "now" ? "#eff6ff" : "white",
                border:
                  scheduleType === "now" ? "2px solid #2563eb" : "1px solid #e5e7eb",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="schedule"
                value="now"
                checked={scheduleType === "now"}
                onChange={() => setScheduleType("now")}
                style={{ marginTop: "3px" }}
              />
              <div>
                <div style={{ fontWeight: 500, marginBottom: "4px" }}>Send Now</div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Emails will start sending immediately
                </div>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "16px",
                backgroundColor: scheduleType === "later" ? "#eff6ff" : "white",
                border:
                  scheduleType === "later" ? "2px solid #2563eb" : "1px solid #e5e7eb",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="schedule"
                value="later"
                checked={scheduleType === "later"}
                onChange={() => setScheduleType("later")}
                style={{ marginTop: "3px" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: "4px" }}>Schedule for Later</div>
                <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
                  Choose a date and time to send
                </div>

                {scheduleType === "later" && (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      style={{
                        padding: "8px 12px",
                        fontSize: "14px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                      }}
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        fontSize: "14px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#166534", marginBottom: "8px" }}>
              Ready to Send
            </h3>
            <div style={{ fontSize: "14px", color: "#166534" }}>
              <div><strong>Campaign:</strong> {campaignName}</div>
              <div><strong>Template:</strong> {selectedTemplate?.name}</div>
              <div>
                <strong>Recipients:</strong>{" "}
                {audienceType === "list"
                  ? selectedList?.memberCount
                  : audienceCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "32px",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div>
          {step !== "basics" && (
            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              Back
            </button>
          )}
        </div>
        <div>
          {step !== "schedule" ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed() || loading}
              data-test-id="composer-next-button"
              style={{
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 500,
                color: "white",
                backgroundColor: canProceed() && !loading ? "#2563eb" : "#9ca3af",
                border: "none",
                borderRadius: "6px",
                cursor: canProceed() && !loading ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Loading..." : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!canProceed() || loading}
              data-test-id="composer-send-button"
              style={{
                padding: "10px 32px",
                fontSize: "14px",
                fontWeight: 600,
                color: "white",
                backgroundColor: canProceed() && !loading ? "#16a34a" : "#9ca3af",
                border: "none",
                borderRadius: "6px",
                cursor: canProceed() && !loading ? "pointer" : "not-allowed",
              }}
            >
              {loading
                ? "Sending..."
                : scheduleType === "now"
                  ? "Send Campaign"
                  : "Schedule Campaign"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
