import { prisma } from "@/lib/db";
import { PrismaClient } from "@prisma/client";

export interface RightsCheckResult {
  isAuthorized: boolean;
  maxSessionDurationSeconds: number;
  reason?: string;
  assetTitle?: string;
  licenseType?: string;
  licenseSource?: string;
}

type PrismaTransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export class RightsService {
  /**
   * Verifies that the screening's content asset has a valid, active authorization
   * for the specific cinema and current time window.
   * Accepts an optional transaction client (tx) to prevent connection pool exhaustion.
   */
  static async verifyScreeningRights(
    screeningId: string,
    cinemaId: string,
    tx?: PrismaTransactionClient
  ): Promise<RightsCheckResult> {
    const client = tx || prisma;
    const screening = await client.screening.findUnique({
      where: { id: screeningId },
      include: {
        contentAsset: true,
      },
    });

    if (!screening) {
      return {
        isAuthorized: false,
        maxSessionDurationSeconds: 0,
        reason: "Screening not found.",
      };
    }

    if (screening.cinemaId !== cinemaId) {
      return {
        isAuthorized: false,
        maxSessionDurationSeconds: 0,
        reason: "Cross-tenant mismatch: screening does not belong to the cinema.",
      };
    }

    const now = new Date();

    const authorization = await client.rightsAuthorization.findFirst({
      where: {
        contentAssetId: screening.contentAssetId,
        cinemaId: cinemaId,
        isAuthorized: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
    });

    if (!authorization) {
      return {
        isAuthorized: false,
        maxSessionDurationSeconds: 0,
        reason: "Content rights authorization missing or expired for this screening and venue.",
        assetTitle: screening.contentAsset.title,
        licenseType: screening.contentAsset.licenseType,
      };
    }

    return {
      isAuthorized: true,
      maxSessionDurationSeconds: authorization.maxSessionDurationSeconds,
      assetTitle: screening.contentAsset.title,
      licenseType: screening.contentAsset.licenseType,
      licenseSource: screening.contentAsset.licenseSource,
    };
  }
}
