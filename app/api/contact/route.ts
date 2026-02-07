//export const runtime = "nodejs";

import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export type ContactFormData = {
  name: string;
  email: string;
  service: string;
  budget: string;
  details: string;
};

export async function POST(request: Request) {
  try {
    const data: ContactFormData = await request.json();
    const { name, email, service, budget, details } = data;

    if (!name || !email || !service || !budget) {
      return NextResponse.json(
        { success: false, message: "Per favore compila tutti i campi obbligatori." },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      dnsTimeout: 30000,
      socketTimeout: 30000,
    });

    const htmlContent = `
      <h2>Nuova richiesta dal sito OBRIYM</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Nome</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
          <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Servizio</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${service}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Budget</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${budget}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Dettagli</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${details || "Non specificato"}</td>
        </tr>
      </table>
    `;

    await transporter.sendMail({
      from: `"OBRIYM Website" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || "info@obriym.com",
      replyTo: email,
      subject: `Nuova richiesta: ${service} - ${name}`,
      html: htmlContent,
      text: `
Nuova richiesta dal sito OBRIYM

Nome: ${name}
Email: ${email}
Servizio: ${service}
Budget: ${budget}
Dettagli: ${details || "Non specificato"}
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Grazie! La tua richiesta è stata inviata con successo.",
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { success: false, message: "Si è verificato un errore. Per favore riprova più tardi." },
      { status: 500 }
    );
  }
}
