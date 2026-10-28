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
                      example: "TK-8821-DEMO",
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
                    ticketNumber: { type: "string", example: "TK-8821-DEMO" },
                    claimToken: { type: "string", example: "CLM-8821-DEMO" },
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
      "/api/sessions/complete": {
        post: {
          summary: "Complete Companion Session Early",
          description: "Allows a patron to voluntarily conclude their companion break before the hard 900s limit expires.",
          parameters: [
            {
              name: "x-session-token",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Session concluded" },
          },
        },
      },
      "/api/webhooks/pos": {
        post: {
          summary: "POS & TMS Webhook Receiver",
          description: "Ingests real-time ticketing admissions, ticket refunds/voids, and projector pause/resume timeline events from Box Office POS or TMS systems.",
          parameters: [
            {
              name: "x-pos-signature",
              in: "header",
              required: true,
              description: "HMAC-SHA256 signature of request body computed using cinema webhook secret.",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["event"],
                  properties: {
                    event: {
                      type: "string",
                      enum: [
                        "ticket.admitted",
                        "ticket.refunded",
                        "screening.timeline_pause",
                        "screening.timeline_resume",
                        "screening.timeline_seek",
                      ],
                    },
                    data: { type: "object" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Webhook event processed" },
            "401": { description: "Invalid HMAC signature" },
          },
        },
      },
      "/api/reminders/dispatch": {
        post: {
          summary: "Dispatch Due Screening Reminders",
          description: "Background worker or cron endpoint evaluating due screening reminders, triggering Africa's Talking SMS and Resend emails.",
          responses: {
            "200": { description: "Reminders evaluated and dispatched" },
          },
        },
      },
      "/api/operator/screenings": {
        get: {
          summary: "List Auditorium Screenings",
          description: "Lists scheduled, active, and past screenings for the authenticated cinema circuit.",
          responses: {
            "200": { description: "Array of screenings" },
          },
        },
        post: {
          summary: "Schedule Auditorium Screening",
          description: "Provisions a new screening with screen assignment, content asset licensing check, and timeline tracking.",
          responses: {
            "200": { description: "Screening scheduled" },
          },
        },
      },
      "/api/operator/tickets": {
        get: {
          summary: "List Demonstration Tickets",
          description: "Lists issued tickets and claim tokens for the cinema circuit.",
          responses: {
            "200": { description: "Array of tickets" },
          },
        },
        post: {
          summary: "Issue Demonstration Ticket",
          description: "Issues an admitted demonstration ticket with QR claim token for live companion testing.",
          responses: {
            "200": { description: "Demonstration ticket issued" },
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
