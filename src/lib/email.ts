import { render } from "@react-email/components";
import { resend } from "@/lib/resend";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { OrganizerRequestAdminEmail } from "@/emails/organizer-request-admin";
import { OrganizerRequestDecisionEmail } from "@/emails/organizer-request-decision";
import { AgentInvitationEmail } from "@/emails/agent-invitation";
import {
    ContactNotificationEmail,
    ContactAutoReplyEmail,
} from "@/emails/contact-notification";

const FROM_VENTES = "Benin Events <ventes@beninevents.com>";
const FROM_SUPPORT = "Benin Events <support@beninevents.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// Retourne une URL publique vers un QR code PNG (compatible avec tous les clients email).
// Les data URLs base64 sont bloquées par Gmail, Outlook et la plupart des webmails.
function buildQrUrl(content: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(content)}&ecc=H&margin=2`;
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
        to,
        customerName,
        eventTitle,
        eventDate,
        eventLocation,
        eventType,
        orderReference,
        totalAmount,
        items,
    } = params;

    const itemsWithQR = items.map((item) => {
        const verifyUrl = `${APP_URL}/verify?item=${item.id}&order=${orderReference}`;
        return { ...item, qrCodeDataUrl: buildQrUrl(verifyUrl) };
    });

    const html = await render(
        OrderConfirmationEmail({
            customerName,
            eventTitle,
            eventDate,
            eventLocation,
            eventType,
            orderReference,
            totalAmount,
            items: itemsWithQR,
            appUrl: APP_URL,
        }),
    );

    await resend.emails.send({
        from: FROM_VENTES,
        to,
        subject: `✓ Vos billets pour ${eventTitle}`,
        html,
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

    const html = await render(
        OrganizerRequestAdminEmail({
            ...rest,
            adminPanelUrl: `${APP_URL}/admin/requests`,
        }),
    );

    await resend.emails.send({
        from: FROM_SUPPORT,
        to: adminEmails,
        subject: `🔔 Nouvelle demande d'organisateur — ${params.organizerName}`,
        html,
    });
}

// ─────────────────────────────────────────────
// sendOrganizerRequestDecisionEmail
// ─────────────────────────────────────────────

export interface SendOrganizerRequestDecisionParams {
    to: string;
    applicantName: string;
    status: "APPROVED" | "REJECTED";
}

export async function sendOrganizerRequestDecisionEmail(
    params: SendOrganizerRequestDecisionParams,
) {
    const { to, applicantName, status } = params;

    const html = await render(
        OrganizerRequestDecisionEmail({
            applicantName,
            status,
            appUrl: APP_URL,
        }),
    );

    const subject =
        status === "APPROVED"
            ? "🎉 Votre demande d'organisateur a été approuvée !"
            : "Votre demande d'organisateur — Décision";

    await resend.emails.send({
        from: FROM_SUPPORT,
        to,
        subject,
        html,
    });
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

export async function sendAgentInvitationEmail(
    params: SendAgentInvitationParams,
) {
    const {
        to,
        recipientName,
        eventTitle,
        eventDate,
        eventLocation,
        eventType,
        organizerName,
        token,
    } = params;

    const confirmUrl = `${APP_URL}/agent/confirm/${token}`;

    const html = await render(
        AgentInvitationEmail({
            recipientName,
            eventTitle,
            eventDate,
            eventLocation,
            eventType,
            organizerName,
            confirmUrl,
        }),
    );

    await resend.emails.send({
        from: FROM_SUPPORT,
        to,
        subject: `🎟️ Invitation agent — ${eventTitle}`,
        html,
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

    const [notifHtml, replyHtml] = await Promise.all([
        render(
            ContactNotificationEmail({
                name,
                email,
                subject,
                message,
                adminPanelUrl: APP_URL,
            }),
        ),
        render(
            ContactAutoReplyEmail({
                name,
                subject,
                appUrl: APP_URL,
            }),
        ),
    ]);

    await Promise.all([
        resend.emails.send({
            from: FROM_SUPPORT,
            to: "support@beninevents.com",
            replyTo: email,
            subject: `📬 [Contact] ${subject} — ${name}`,
            html: notifHtml,
        }),
        resend.emails.send({
            from: FROM_SUPPORT,
            to: email,
            subject: "Nous avons bien reçu votre message — Benin Events",
            html: replyHtml,
        }),
    ]);
}
