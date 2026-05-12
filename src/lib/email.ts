import { render } from "@react-email/components";
import { resend } from "@/lib/resend";
import QRCode from "qrcode";
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

    const [{ html, text }, attachments] = await Promise.all([
        renderBoth(OrderConfirmationEmail({
            customerName, eventTitle, eventDate, eventLocation,
            eventType, orderReference, totalAmount, items: itemsWithQR, appUrl: APP_URL,
        })),
        Promise.all(items.map((item, index) => {
            const verifyUrl = `${APP_URL}/verify?item=${item.id}&order=${orderReference}`;
            return generateQrAttachment(verifyUrl, index);
        })),
    ]);

    await resend.emails.send({
        from: FROM_VENTES,
        to,
        subject: `Vos billets pour ${eventTitle} - Confirmation`,
        html,
        text,
        attachments,
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
