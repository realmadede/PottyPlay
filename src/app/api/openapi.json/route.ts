import { NextResponse } from "next/server";

export async function GET() {
  const openApiDoc = {
    openapi: "3.1.0",
    info: {
      title: "PottyPlay Cinema Partner Integration API",
      version: "1.0.0",
      description:
        "Authoritative API specification for cinema exhibitors, POS ticketing providers, and Theater Management System (TMS) integrations.",
      contact: {
        name: "PottyPlay Solutions Engineering",
        email: "partners@pottyplay.co.tz",
        url: "https://pottyplay.co.tz/developers",
      },
    },
    servers: [
      {
        url: "https://api.pottyplay.co.tz",
        description: "Production API Gateway",
      },
      {
        url: "https://sandbox.pottyplay.co.tz",
        description: "Exhibitor Certification Sandbox",
      },
    ],
    paths: {
      "/api/tickets/verify": {
        post: {
          summary: "Verify Ticket Entitlement",
          description:
            "Verifies whether an admitted cinema ticket or claim token is eligible to activate a companion viewing break.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ticketNumber", "screeningId"],
                  properties: {
                    ticketNumber: {
                      type: "string",
                      example: "CC-MLM-7821-A12",
                    },
                    screeningId: {
                      type: "string",
                      example: "screening_prime_01",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Entitlement verification result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      isEligible: { type: "boolean" },
                      status: { type: "string", example: "ELIGIBLE" },
                      ticket: {
                        type: "object",
                        properties: {
                          seatNumber: { type: "string" },
                          customerName: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/sessions/activate": {
        post: {
          summary: "Activate Synchronized Bathroom Session",
          description:
            "Atomically provisions a strictly time-bounded (900s) companion playback session linked to live projection.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ticketNumber: { type: "string", example: "CC-MLM-7821-A12" },
                    claimToken: { type: "string", example: "CLM-MLM-A12-8821" },
                    challengeId: { type: "string" },
                    phoneNumber: { type: "string", example: "+255714000111" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Session provisioned",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      sessionToken: { type: "string" },
                      durationSeconds: { type: "integer", example: 900 },
                      initialPlaybackPositionSeconds: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/sessions/sync": {
        get: {
          summary: "Authoritative Playback Synchronization",
          description:
            "Polls or heartbeats current authoritative cinema projection position and remaining break window.",
          parameters: [
            {
              name: "x-session-token",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Live synchronization telemetry",
            },
          },
        },
      },
      "/api/operator/revoke": {
        post: {
          summary: "Revoke Companion Session",
          description:
            "Allows authorized cinema staff or ushers to manually terminate a session upon patron auditorium return.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sessionId", "reason"],
                  properties: {
                    sessionId: { type: "string" },
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Session revoked" },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiDoc);
}
