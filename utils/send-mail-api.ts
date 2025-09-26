import { JSX } from 'react';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface MailSendingProps {
    mail: string[],
    content : JSX.Element,
    subject: string
}
export  async function  sendMail ({mail, content, subject}: MailSendingProps){
    try {
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: mail,
            subject: subject,
            react: content,
        });
        if (error) {
            return { error : error, data : null };
        }
        return { error : null, data : data };
    } catch (error) {
        return { error : error, data : null };
    }
}