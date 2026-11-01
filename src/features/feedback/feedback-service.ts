import { prisma } from "@/lib/db";
import { FeedbackCategory, FeedbackStatus } from "@prisma/client";

export interface SubmitFeedbackInput {
  cinemaId?: string | null;
  screeningId?: string | null;
  ticketNumber?: string | null;
  customerId?: string | null;
  category: FeedbackCategory;
  message: string;
  deviceInfo?: string | null;
}

export class FeedbackService {
  static async submitFeedback(input: SubmitFeedbackInput) {
    if (!input.message || input.message.trim().length === 0) {
      throw new Error("Feedback message cannot be empty.");
    }

    if (input.message.length > 2000) {
      throw new Error("Feedback message cannot exceed 2000 characters.");
    }

    let screeningId = input.screeningId;
    let cinemaId = input.cinemaId;

    // Resolve screening and cinema from ticket if provided
    if (input.ticketNumber && (!screeningId || !cinemaId)) {
      const ticket = await prisma.demonstrationTicket.findUnique({
        where: { ticketNumber: input.ticketNumber },
        select: { screeningId: true, screening: { select: { cinemaId: true } } },
      });
      if (ticket) {
        if (!screeningId) screeningId = ticket.screeningId;
        if (!cinemaId) cinemaId = ticket.screening.cinemaId;
      }
    }

    // Resolve cinemaId from screening if omitted but screeningId is present
    if (!cinemaId && screeningId) {
      const screening = await prisma.screening.findUnique({
        where: { id: screeningId },
        select: { cinemaId: true },
      });
      if (screening) {
        cinemaId = screening.cinemaId;
      }
    }

    // Resolve customerId from ticket break sessions if omitted but ticketNumber is present
    let customerId = input.customerId;
    if (!customerId && input.ticketNumber) {
      const session = await prisma.breakSession.findFirst({
        where: { ticket: { ticketNumber: input.ticketNumber } },
        select: { customerId: true, phoneNumber: true },
        orderBy: { createdAt: "desc" },
      });
      if (session?.customerId) {
        customerId = session.customerId;
      } else if (session?.phoneNumber) {
        const customer = await prisma.customerAccount.findUnique({
          where: { phoneNumber: session.phoneNumber },
          select: { id: true },
        });
        if (customer) {
          customerId = customer.id;
        }
      }
    }

    return await prisma.patronFeedback.create({
      data: {
        cinemaId: cinemaId || null,
        screeningId: screeningId || null,
        ticketNumber: input.ticketNumber || null,
        customerId: customerId || null,
        category: input.category,
        message: input.message.trim(),
        deviceInfo: input.deviceInfo || null,
        status: FeedbackStatus.PENDING,
      },
      include: {
        screening: {
          select: {
            title: true,
            screen: { select: { name: true } },
          },
        },
      },
    });
  }

  static async listByCinema(
    cinemaId: string,
    options?: { status?: FeedbackStatus; limit?: number }
  ) {
    return await prisma.patronFeedback.findMany({
      where: {
        cinemaId,
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      include: {
        screening: {
          select: {
            title: true,
            screen: { select: { name: true } },
          },
        },
        customer: {
          select: {
            name: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });
  }

  static async updateStatus(
    id: string,
    cinemaId: string,
    status: FeedbackStatus,
    operatorNotes?: string
  ) {
    const existing = await prisma.patronFeedback.findFirst({
      where: { id, cinemaId },
    });

    if (!existing) {
      throw new Error("Feedback item not found or unauthorized for this cinema circuit.");
    }

    return await prisma.patronFeedback.update({
      where: { id },
      data: {
        status,
        operatorNotes: operatorNotes !== undefined ? operatorNotes : existing.operatorNotes,
        resolvedAt: status === FeedbackStatus.RESOLVED ? new Date() : existing.resolvedAt,
      },
    });
  }

  static async listByCustomer(customerId: string) {
    return await prisma.patronFeedback.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        screening: {
          select: {
            title: true,
            cinema: { select: { name: true } },
          },
        },
      },
    });
  }
}
