import { ISmsProvider, SendSmsRequest, SendSmsResult } from "./types";

export class DevSimulatorSmsAdapter implements ISmsProvider {
  public readonly name = "DEV_SIMULATOR" as const;

  // In-memory log of recent simulated messages for operator testing and inspection
  private static recentSimulatedDeliveries: Array<{
    id: string;
    to: string;
    message: string;
    messageType: string;
    timestamp: Date;
    simulatedCode?: string;
  }> = [];

  static getRecentDeliveries() {
    return [...DevSimulatorSmsAdapter.recentSimulatedDeliveries];
  }

  static addDelivery(entry: {
    id: string;
    to: string;
    message: string;
    messageType: string;
    timestamp: Date;
    simulatedCode?: string;
  }) {
    DevSimulatorSmsAdapter.recentSimulatedDeliveries.unshift(entry);
    if (DevSimulatorSmsAdapter.recentSimulatedDeliveries.length > 50) {
      DevSimulatorSmsAdapter.recentSimulatedDeliveries.pop();
    }
  }

  async sendSms(request: SendSmsRequest): Promise<SendSmsResult> {
    const messageId = `sim_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    // Extract OTP if present in message for testing display
    const match = request.message.match(/\b\d{6}\b/);
    const extractedCode = match ? match[0] : undefined;

    // Log simulated delivery
    if (process.env.NODE_ENV !== "production") {
      console.log(`[SMS-SIMULATOR] Delivery to ${request.to}: ${request.message}`);
    }

    DevSimulatorSmsAdapter.addDelivery({
      id: messageId,
      to: request.to,
      message: request.message,
      messageType: request.messageType,
      timestamp: new Date(),
      simulatedCode: extractedCode,
    });

    return {
      success: true,
      provider: this.name,
      providerMessageId: messageId,
      cost: "TZS 0.00 (Simulated)",
      status: "SENT",
      simulatedCode: extractedCode,
    };
  }
}
