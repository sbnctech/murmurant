export class NullPaymentProvider {
  createIntent() {
    return { id: "null_intent", status: "authorized" };
  }

  getIntent() {
    return { id: "null_intent", status: "authorized" };
  }

  captureIntent() {
    return { id: "null_intent", status: "captured" };
  }

  cancelIntent() {
    return { id: "null_intent", status: "canceled" };
  }

  refund() {
    return { id: "null_refund", status: "refunded" };
  }

  verifyWebhook(payload: Record<string, unknown>) {
    if (!payload || !payload.event_id) {
      throw new Error("invalid_request");
    }
    return true;
  }
}
