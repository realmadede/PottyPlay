import { prisma } from "@/lib/db";
import { TicketStatus, ScreeningStatus } from "@prisma/client";
import { RightsService } from "@/features/rights/rights-service";

export type TicketVerificationStatus =
  | "ELIGIBLE"
  | "INVALID_TICKET"
  | "WRONG_SCREENING"
  | "ALREADY_ACTIVATED"
  | "CANCELLED_REFUNDED"
  | "INELIGIBLE"
  | "RIGHTS_UNAUTHORIZED"
  | "SCREENING_NOT_ACTIVE";

export interface TicketVerificationResult {
  status: TicketVerificationStatus;
  isEligible: boolean;
  message: string;
  ticket?: {
    id: string;
    ticketNumber: string;
    claimToken?: string | null;
    seatNumber: string;
    customerName: string;
    status: TicketStatus;
  };
  screening?: {
    id: string;
    title: string;
    status: ScreeningStatus;
    cinemaId: string;
    cinemaName: string;
    screenName: string;
  };
  rights?: {
    maxSessionDurationSeconds: number;
    licenseType: string;
    assetTitle: string;
  };
}

export class TicketService {
  /**
   * Verifies ticket validity, screening association, status, and content rights.
   * Accepts either a ticket number or a claim token.
   */
  static async verifyTicket(
    identifier: string,
    targetScreeningId?: string
  ): Promise<TicketVerificationResult> {
    const cleaned = identifier.trim().toUpperCase();

    const ticket = await prisma.demonstrationTicket.findFirst({
      where: {
        OR: [
          { ticketNumber: cleaned },
          { claimToken: cleaned },
        ],
      },
      include: {
        screening: {
          include: {
            cinema: true,
            screen: true,
            contentAsset: true,
          },
        },
        breakSession: true,
      },
    });

    if (!ticket) {
      return {
        status: "INVALID_TICKET",
        isEligible: false,
        message: "Ticket not found. Please verify the ticket code from your cinema pass.",
      };
    }

    // Check screening match if a specific screening was targeted
    if (targetScreeningId && ticket.screeningId !== targetScreeningId) {
      return {
        status: "WRONG_SCREENING",
        isEligible: false,
        message: "This ticket was issued for a different screening or auditorium.",
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          claimToken: ticket.claimToken,
          seatNumber: ticket.seatNumber,
          customerName: ticket.customerName,
          status: ticket.status,
        },
      };
    }

    // Check if screening is cancelled or completed
    if (
      ticket.screening.status === ScreeningStatus.CANCELLED ||
      ticket.screening.status === ScreeningStatus.COMPLETED
    ) {
      return {
        status: "SCREENING_NOT_ACTIVE",
        isEligible: false,
        message: "The requested screening is currently inactive or has concluded.",
      };
    }

    // Check ticket status
    if (ticket.status === TicketStatus.ALREADY_ACTIVATED || ticket.breakSession) {
      return {
        status: "ALREADY_ACTIVATED",
        isEligible: false,
        message: "This ticket has already been used to activate a companion viewing session.",
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          claimToken: ticket.claimToken,
          seatNumber: ticket.seatNumber,
          customerName: ticket.customerName,
          status: ticket.status,
        },
      };
    }

    if (ticket.status === TicketStatus.CANCELLED_REFUNDED) {
      return {
        status: "CANCELLED_REFUNDED",
        isEligible: false,
        message: "This ticket has been cancelled or refunded and cannot be activated.",
      };
    }

    if (ticket.status === TicketStatus.INELIGIBLE) {
      return {
        status: "INELIGIBLE",
        isEligible: false,
        message: "This seat or ticket category is ineligible for companion viewing breaks.",
      };
    }

    if (ticket.status !== TicketStatus.VALID_ADMITTED) {
      return {
        status: "INVALID_TICKET",
        isEligible: false,
        message: "Ticket status does not permit active admission.",
      };
    }

    // Verify content rights for this screening
    const rightsCheck = await RightsService.verifyScreeningRights(
      ticket.screeningId,
      ticket.screening.cinemaId
    );

    if (!rightsCheck.isAuthorized) {
      return {
        status: "RIGHTS_UNAUTHORIZED",
        isEligible: false,
        message: rightsCheck.reason || "Content rights authorization missing for this screening.",
      };
    }

    return {
      status: "ELIGIBLE",
      isEligible: true,
      message: "Ticket verified. Eligible for companion viewing break.",
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        claimToken: ticket.claimToken,
        seatNumber: ticket.seatNumber,
        customerName: ticket.customerName,
        status: ticket.status,
      },
      screening: {
        id: ticket.screening.id,
        title: ticket.screening.title,
        status: ticket.screening.status,
        cinemaId: ticket.screening.cinema.id,
        cinemaName: ticket.screening.cinema.name,
        screenName: ticket.screening.screen.name,
      },
      rights: {
        maxSessionDurationSeconds: rightsCheck.maxSessionDurationSeconds,
        licenseType: rightsCheck.licenseType || "Authorized",
        assetTitle: rightsCheck.assetTitle || ticket.screening.contentAsset.title,
      },
    };
  }
}
