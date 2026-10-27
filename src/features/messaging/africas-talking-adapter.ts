import { ISmsProvider, SendSmsRequest, SendSmsResult } from "./types";
import { config } from "@/lib/config";

export class AfricasTalkingSmsAdapter implements ISmsProvider {
  public readonly name = "AFRICAS_TALKING" as const;

  async sendSms(request: SendSmsRequest): Promise<SendSmsResult> {
    const { apiKey, username, senderId, baseUrl } = config.africasTalking;

    if (!apiKey) {
      return {
        success: false,
        provider: this.name,
        status: "FAILED",
        errorDetails: "Missing Africa's Talking API key in configuration.",
      };
    }

    try {
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("to", request.to);
      params.append("message", request.message);
      if (senderId) {
        params.append("from", senderId);
      }

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          apiKey: apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          provider: this.name,
          status: "FAILED",
          errorDetails: `Africa's Talking HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      const recipients = data?.SMSMessageData?.Recipients;

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return {
          success: false,
          provider: this.name,
          status: "FAILED",
          errorDetails:
            data?.SMSMessageData?.Message || "No recipient response received from Africa's Talking.",
        };
      }

      const firstRecipient = recipients[0];
      // Status code 101: Sent, 100: Processed, 102: Queued
      const isSuccess = [100, 101, 102].includes(firstRecipient.statusCode);

      return {
        success: isSuccess,
        provider: this.name,
        providerMessageId: firstRecipient.messageId,
        cost: firstRecipient.cost,
        status: isSuccess ? "SENT" : "FAILED",
        errorDetails: isSuccess ? undefined : `Status ${firstRecipient.statusCode}: ${firstRecipient.status}`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        provider: this.name,
        status: "FAILED",
        errorDetails: `Africa's Talking network error: ${message}`,
      };
    }
  }
}
