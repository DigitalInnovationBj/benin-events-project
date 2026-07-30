import { render } from "@react-email/components";
import { resend } from "@/lib/resend";
import QRCode from "qrcode";
import { generateTicketPdf } from "@/lib/ticket-pdf";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { OrganizerRequestAdminEmail } from "@/emails/organizer-request-admin";
import { OrganizerRequestDecisionEmail } from "@/emails/organizer-request-decision";
import { AgentInvitationEmail } from "@/emails/agent-invitation";
import {
    ContactNotificationEmail,
    ContactAutoReplyEmail,
} from "@/emails/contact-notification";
import { PayoutNotificationEmail, type PayoutNotifType } from "@/emails/payout-notification";
import { PayoutRequestAdminEmail } from "@/emails/payout-request-admin";
import { TicketGiftEmail } from "@/emails/ticket-gift";
import { AuthVerificationEmail } from "@/emails/auth-verification";
import { EventCancellationEmail } from "@/emails/event-cancellation";
import { RefundConfirmationEmail } from "@/emails/refund-confirmation";

const FROM_VENTES = "Benin Events <ventes@beninevents.com>";
const FROM_SUPPORT = "Benin Events <support@beninevents.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// Génère HTML + texte brut depuis le même template React Email.
// La version texte évite d'être considéré comme spam (emails HTML-only pénalisés).
async function renderBoth(component: React.ReactElement) {
    const [html, text] = await Promise.all([
        render(component),
        render(component, { plainText: true }),
    ]);
    return { html, text };
}

// Génère un QR code en PNG embarqué inline (CID) pour les clients email.
// Évite le blocage des images externes (Gmail bloque les URLs externes par défaut).
async function generateQrAttachment(content: string, index: number) {
    const buffer = await QRCode.toBuffer(content, {
        width: 300,
        errorCorrectionLevel: "H",
        margin: 2,
    });
    return {
        filename: `qr-${index}.png`,
        content: buffer.toString("base64"),
        contentType: "image/png",
        contentDisposition: "inline" as const,
        contentId: `qr-${index}`,
    };
}

// ─────────────────────────────────────────────
// sendOrderConfirmationEmail
// ─────────────────────────────────────────────

export interface OrderItemForEmail {
    id: string;
    ticketTitle: string;
    quantity: number;
    price: number;
    emailTemplate: "PRIMARY" | "SECONDARY";
}

export interface SendOrderConfirmationParams {
    to: string;
    customerName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string | null;
    eventType: "IN_PERSON" | "ONLINE";
    orderReference: string;
    totalAmount: number;
    items: OrderItemForEmail[];
}

export async function sendOrderConfirmationEmail(
    params: SendOrderConfirmationParams,
) {
    const {
        to, customerName, eventTitle, eventDate,
        eventLocation, eventType, orderReference, totalAmount, items,
    } = params;

    const itemsWithQR = items.map((item, index) => {
        const verifyUrl = `${APP_URL}/verify?item=${item.id}&order=${orderReference}`;
        return { ...item, qrCodeDataUrl: `cid:qr-${index}`, verifyUrl };
    });

    const totalTickets = items.reduce((sum, i) => sum + i.quantity, 0);

    const [{ html, text }, qrAttachments, pdfAttachments] = await Promise.all([
        renderBoth(OrderConfirmationEmail({
            customerName, eventTitle, eventDate, eventLocation,
            eventType, orderReference, totalAmount, items: itemsWithQR, appUrl: APP_URL,
        })),
        Promise.all(items.map((item, index) => {
            const verifyUrl = `${APP_URL}/verify?item=${item.id}&order=${orderReference}`;
            return generateQrAttachment(verifyUrl, index);
        })),
        Promise.all(items.map(async (item, index) => {
            const verifyUrl = `${APP_URL}/verify?item=${item.id}&order=${orderReference}`;
            const qrBuffer = await QRCode.toBuffer(verifyUrl, {
                width: 300,
                errorCorrectionLevel: "H",
                margin: 2,
            });
            const qrDataUri = `data:image/png;base64,${qrBuffer.toString("base64")}`;
            const pdfBuffer = await generateTicketPdf({
                eventTitle,
                eventDate,
                eventLocation,
                eventType,
                ticketTitle: item.ticketTitle,
                price: item.price,
                orderReference,
                ticketIndex: index + 1,
                ticketTotal: totalTickets,
                qrDataUri,
                template: item.emailTemplate,
            });
            const slug = eventTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 30);
            return {
                filename: `billet-${index + 1}-${slug}.pdf`,
                content: pdfBuffer.toString("base64"),
                contentType: "application/pdf",
            };
        })),
    ]);

    await resend.emails.send({
        from: FROM_VENTES,
        to,
        subject: `Vos billets pour ${eventTitle} - Confirmation`,
        html,
        text,
        attachments: [...qrAttachments, ...pdfAttachments],
    });
}

// ─────────────────────────────────────────────
// sendOrganizerRequestAdminEmail
// ─────────────────────────────────────────────

export interface SendOrganizerRequestAdminParams {
    adminEmails: string[];
    applicantName: string;
    applicantEmail: string;
    organizerName: string;
    organizerEmail: string;
    phoneNumber: string;
    address: string;
    description?: string;
}

export async function sendOrganizerRequestAdminEmail(
    params: SendOrganizerRequestAdminParams,
) {
    const { adminEmails, ...rest } = params;
    const { html, text } = await renderBoth(
        OrganizerRequestAdminEmail({ ...rest, adminPanelUrl: `${APP_URL}/admin/requests` }),
    );

    await resend.emails.send({
        from: FROM_SUPPORT,
        to: adminEmails,
        subject: `Nouvelle demande d'organisateur - ${params.organizerName}`,
        html,
        text,
    });
}

// ─────────────────────────────────────────────
// sendOrganizerRequestDecisionEmail
// ─────────────────────────────────────────────

export interface SendOrganizerRequestDecisionParams {
    to: string;
    applicantName: string;
    status: "APPROVED" | "REJECTED";
    eventCreationFeeEnabled?: boolean;
    eventCreationFee?: number;
    featuredEventFeeEnabled?: boolean;
    featuredEventFee?: number;
}

export async function sendOrganizerRequestDecisionEmail(
    params: SendOrganizerRequestDecisionParams,
) {
    const { to, applicantName, status, eventCreationFeeEnabled, eventCreationFee, featuredEventFeeEnabled, featuredEventFee } = params;

    const { html, text } = await renderBoth(
        OrganizerRequestDecisionEmail({
            applicantName, status, appUrl: APP_URL,
            eventCreationFeeEnabled, eventCreationFee,
            featuredEventFeeEnabled, featuredEventFee,
        }),
    );

    const subject = status === "APPROVED"
        ? "Votre demande d'organisateur a été approuvée - Benin Events"
        : "Votre demande d'organisateur - Décision";

    await resend.emails.send({ from: FROM_SUPPORT, to, subject, html, text });
}

// ─────────────────────────────────────────────
// sendAgentInvitationEmail
// ─────────────────────────────────────────────

export interface SendAgentInvitationParams {
    to: string;
    recipientName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string | null;
    eventType: "IN_PERSON" | "ONLINE";
    organizerName: string;
    token: string;
}

export async function sendAgentInvitationEmail(params: SendAgentInvitationParams) {
    const { to, recipientName, eventTitle, eventDate, eventLocation, eventType, organizerName, token } = params;
    const confirmUrl = `${APP_URL}/agent/confirm/${token}`;

    const { html, text } = await renderBoth(
        AgentInvitationEmail({ recipientName, eventTitle, eventDate, eventLocation, eventType, organizerName, confirmUrl }),
    );

    await resend.emails.send({
        from: FROM_SUPPORT,
        to,
        subject: `Invitation agent pour ${eventTitle} - Benin Events`,
        html,
        text,
    });
}

// ─────────────────────────────────────────────
// sendPayoutRequestAdminEmail
// ─────────────────────────────────────────────

export interface SendPayoutRequestAdminParams {
    adminEmails: string[];
    organizerName: string;
    organizerEmail: string;
    netAmount: number;
    grossAmount: number;
    commissionRate: number;
    methodType: "MOBILE_MONEY" | "BANK_TRANSFER";
    operator?: string;
    phoneNumber?: string;
    bankName?: string;
    accountName?: string;
    iban?: string;
}

export async function sendPayoutRequestAdminEmail(params: SendPayoutRequestAdminParams) {
    const { adminEmails, ...rest } = params;
    const { html, text } = await renderBoth(
        PayoutRequestAdminEmail({ ...rest, adminPanelUrl: `${APP_URL}/admin/payouts` }),
    );

    await resend.emails.send({
        from: FROM_SUPPORT,
        to: adminEmails,
        subject: `Demande de reversement - ${params.organizerName}`,
        html,
        text,
    });
}

// ─────────────────────────────────────────────
// sendPayoutStatusEmail
// ─────────────────────────────────────────────

export interface SendPayoutStatusParams {
    to: string;
    organizerName: string;
    type: PayoutNotifType;
    netAmount: number;
    grossAmount: number;
    commissionRate: number;
    adminNote?: string;
}

export async function sendPayoutStatusEmail(params: SendPayoutStatusParams) {
    const { to, type, organizerName, netAmount, grossAmount, commissionRate, adminNote } = params;

    const { html, text } = await renderBoth(
        PayoutNotificationEmail({ organizerName, type, netAmount, grossAmount, commissionRate, adminNote, appUrl: APP_URL }),
    );

    const subjects: Record<PayoutNotifType, string> = {
        REQUESTED:  "Votre demande de reversement a été reçue - Benin Events",
        PROCESSING: "Votre reversement est en cours de traitement - Benin Events",
        PAID:       "Votre reversement a été effectué - Benin Events",
        REJECTED:   "Votre demande de reversement - Décision",
    };

    await resend.emails.send({ from: FROM_SUPPORT, to, subject: subjects[type], html, text });
}

// ─────────────────────────────────────────────
// sendTicketGiftEmail
// ─────────────────────────────────────────────

export interface SendTicketGiftParams {
    to: string;
    recipientName: string;
    senderName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string | null;
    eventType: "IN_PERSON" | "ONLINE";
    ticketTitle: string;
    price: number;
    emailTemplate: "PRIMARY" | "SECONDARY";
    orderItemId: string;
    orderReference: string;
}

export async function sendTicketGiftEmail(params: SendTicketGiftParams) {
    const {
        to, recipientName, senderName, eventTitle, eventDate,
        eventLocation, eventType, ticketTitle, price, emailTemplate,
        orderItemId, orderReference,
    } = params;

    const verifyUrl = `${APP_URL}/verify?item=${orderItemId}&order=${orderReference}`;

    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        width: 300,
        errorCorrectionLevel: "H",
        margin: 2,
    });
    const qrDataUri = `data:image/png;base64,${qrBuffer.toString("base64")}`;

    const [{ html, text }, qrAttachment, pdfBuffer] = await Promise.all([
        renderBoth(TicketGiftEmail({
            recipientName, senderName, eventTitle, eventDate,
            eventLocation, eventType, ticketTitle,
            qrCodeUrl: "cid:qr-gift",
            orderItemId, orderReference, appUrl: APP_URL,
        })),
        generateQrAttachment(verifyUrl, 0).then(a => ({ ...a, contentId: "qr-gift" })),
        generateTicketPdf({
            eventTitle, eventDate, eventLocation, eventType,
            ticketTitle, price, orderReference,
            ticketIndex: 1, ticketTotal: 1,
            qrDataUri,
            template: emailTemplate,
        }),
    ]);

    const slug = eventTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 30);

    await resend.emails.send({
        from: FROM_VENTES,
        to,
        subject: `${senderName} vous offre un billet pour ${eventTitle}`,
        html,
        text,
        attachments: [
            qrAttachment,
            {
                filename: `billet-cadeau-${slug}.pdf`,
                content: pdfBuffer.toString("base64"),
                contentType: "application/pdf",
            },
        ],
    });
}

// ─────────────────────────────────────────────
// sendContactEmails
// ─────────────────────────────────────────────

export interface SendContactEmailsParams {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function sendContactEmails(params: SendContactEmailsParams) {
    const { name, email, subject, message } = params;

    const [notif, reply] = await Promise.all([
        renderBoth(ContactNotificationEmail({ name, email, subject, message, adminPanelUrl: APP_URL })),
        renderBoth(ContactAutoReplyEmail({ name, subject, appUrl: APP_URL })),
    ]);

    await Promise.all([
        resend.emails.send({
            from: FROM_SUPPORT,
            to: "support@beninevents.com",
            replyTo: email,
            subject: `[Contact] ${subject} - ${name}`,
            html: notif.html,
            text: notif.text,
        }),
        resend.emails.send({
            from: FROM_SUPPORT,
            to: email,
            subject: "Nous avons bien reçu votre message - Benin Events",
            html: reply.html,
            text: reply.text,
        }),
    ]);
}

// ─────────────────────────────────────────────
// sendAuthOtpEmail (better-auth : vérification & reset password)
// ─────────────────────────────────────────────

export interface SendAuthOtpParams {
    to: string;
    otp: string;
    type: "email-verification" | "forget-password" | "sign-in" | "change-email";
}

export async function sendAuthOtpEmail(params: SendAuthOtpParams) {
    const { to, otp, type } = params;

    const { html, text } = await renderBoth(AuthVerificationEmail({ otp, type }));

    const subject =
        type === "forget-password"
            ? `${otp} — Réinitialisation de votre mot de passe`
            : `${otp} — Vérifiez votre adresse email`;

    await resend.emails.send({
        from: FROM_SUPPORT,
        to,
        subject,
        html,
        text,
    });
}

// ─────────────────────────────────────────────
// sendEventCancellationEmail
// ─────────────────────────────────────────────

export interface SendEventCancellationParams {
    to: string;
    recipientName: string;
    eventTitle: string;
    eventDate: string;
    orderReference: string;
    totalAmount: number;
    reason?: string;
}

export async function sendEventCancellationEmail(params: SendEventCancellationParams) {
    const { to, recipientName, eventTitle, eventDate, orderReference, totalAmount, reason } = params;

    const { html, text } = await renderBoth(
        EventCancellationEmail({
            recipientName,
            eventTitle,
            eventDate,
            orderReference,
            totalAmount,
            reason,
            appUrl: APP_URL,
        }),
    );

    await resend.emails.send({
        from: FROM_SUPPORT,
        to,
        subject: `« ${eventTitle} » est annulé — remboursement en cours`,
        html,
        text,
    });
}

// ─────────────────────────────────────────────
// sendRefundConfirmationEmail
// ─────────────────────────────────────────────

export interface SendRefundConfirmationParams {
    to: string;
    recipientName: string;
    eventTitle: string;
    orderReference: string;
    totalAmount: number;
}

export async function sendRefundConfirmationEmail(params: SendRefundConfirmationParams) {
    const { to, recipientName, eventTitle, orderReference, totalAmount } = params;

    const { html, text } = await renderBoth(
        RefundConfirmationEmail({ recipientName, eventTitle, orderReference, totalAmount }),
    );

    await resend.emails.send({
        from: FROM_SUPPORT,
        to,
        subject: `Remboursement effectué — ${totalAmount.toLocaleString("fr-FR")} FCFA`,
        html,
        text,
    });
}
