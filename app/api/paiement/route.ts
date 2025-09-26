import { prisma } from '@/functions/prisma';
import { ApiResponse } from '@/utils/format-api-response';
import { randomUUID } from 'crypto';

type Data = {
  reference?: string;
  status?: string;
  callbackInfo?: {
    userId: string;
    eventId: string;
    dateId: string;
  };
  error?: string;
};

enum PURCHASE_STATUT {
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  CONFIRMED = 'CONFIRMED',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return ApiResponse({
      success: false,
      error: 'Reference parameter is required',
      statusCode: 400,
    });
  }

  const apiKey = process.env.FEEXPAY_API_KEY;

  if (!apiKey) {
    return ApiResponse({
      success: false,
      error: 'API key is not configured',
      statusCode: 500,
    });
  }

  try {
    const response = await fetch(
      `https://api.feexpay.me/api/transactions/public/single/status/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.json();
      return ApiResponse({
        success: false,
        error: `FeexPay API error: ${JSON.stringify(errorText)}`,
        statusCode: response.status,
      });
    }

    const data = await response.json();

    // Map FeexPay status to PURCHASE_STATUT
    const statusMap: { [key: string]: PURCHASE_STATUT } = {
      success: PURCHASE_STATUT.CONFIRMED,
      failed: PURCHASE_STATUT.CANCELLED,
      pending: PURCHASE_STATUT.PENDING,
    };
    const purchaseStatus = statusMap[data.status.toLowerCase()] || PURCHASE_STATUT.PENDING;

    // Extract callback_info (assuming FeexPay includes it in the response)
    const callbackInfo = data.callback_info || {
      userId: '',
      eventId: '',
      dateId: '',
    };

    if (!callbackInfo.userId || !callbackInfo.eventId || !callbackInfo.dateId) {
      return ApiResponse({
        success: false,
        error: 'Missing callback_info (userId, eventId, dateId) in FeexPay response',
        statusCode: 400,
      });
    }

    // Generate unique qrcode and code
    const qrcode = randomUUID();
    const code = randomUUID().slice(0, 8).toUpperCase();

    // Save to Prisma Purchase model
    const purchase = await prisma.purchase.create({
      data: {
        reference,
        eventId: callbackInfo.eventId,
        userId: callbackInfo.userId,
        eventDateId: callbackInfo.dateId,
        qrcode,
        code,
        statut: purchaseStatus,
      },
    });

    return ApiResponse({
      success: true,
      data: {
        reference: data.reference,
        status: data.status,
        callbackInfo: {
          userId: callbackInfo.userId,
          eventId: callbackInfo.eventId,
          dateId: callbackInfo.dateId,
        },
      },
      statusCode: 200,
    });
  } catch (error) {
    return ApiResponse({
      success: false,
      error: (error as Error).message,
      statusCode: 500,
    });
  }
}