const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  _getTransporter() {
    if (this.transporter) return this.transporter;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn('⚠ SMTP non configuré. Les emails ne seront pas envoyés.');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return this.transporter;
  }

  async send({ to, subject, html }) {
    const transporter = this._getTransporter();
    if (!transporter) {
      console.log(`[EMAIL] Simulation - À: ${to}, Sujet: ${subject}`);
      return { simulated: true };
    }

    try {
      const info = await transporter.sendMail({
        from: `"MedConnect" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`[EMAIL] Envoyé à ${to} - ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL] Erreur d'envoi à ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  async sendIdentityApproved(user, doc) {
    const docLabel = {
      CNI: "Carte Nationale d'Identité",
      PASSPORT: 'Passeport',
      PERMIS: 'Permis de conduire',
      OTHER: 'Autre',
    }[doc.document_type] || doc.document_type;

    return this.send({
      to: user.email,
      subject: '✅ Pièce d\'identité approuvée - MedConnect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0;">MedConnect</h1>
            <p style="color: #6b7280; font-size: 14px;">Votre santé, notre priorité</p>
          </div>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 24px;">
            <h2 style="color: #065f46; margin: 0 0 12px;">Document approuvé ✅</h2>
            <p style="color: #374151; line-height: 1.6;">Bonjour <strong>${user.first_name} ${user.last_name}</strong>,</p>
            <p style="color: #374151; line-height: 1.6;">Votre <strong>${docLabel}</strong> (N° ${doc.document_number}) a été approuvé par notre équipe.</p>
            <p style="color: #374151; line-height: 1.6;">Vous avez désormais accès à l'ensemble de nos services.</p>
          </div>
          <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 0;">Merci de votre confiance,</p>
            <p style="color: #374151; font-weight: bold; margin: 4px 0 0;">L'équipe MedConnect</p>
          </div>
        </div>
      `,
    });
  }

  async sendIdentityRejected(user, doc, reason) {
    const docLabel = {
      CNI: "Carte Nationale d'Identité",
      PASSPORT: 'Passeport',
      PERMIS: 'Permis de conduire',
      OTHER: 'Autre',
    }[doc.document_type] || doc.document_type;

    return this.send({
      to: user.email,
      subject: '❌ Pièce d\'identité rejetée - MedConnect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0;">MedConnect</h1>
            <p style="color: #6b7280; font-size: 14px;">Votre santé, notre priorité</p>
          </div>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px;">
            <h2 style="color: #991b1b; margin: 0 0 12px;">Document rejeté ❌</h2>
            <p style="color: #374151; line-height: 1.6;">Bonjour <strong>${user.first_name} ${user.last_name}</strong>,</p>
            <p style="color: #374151; line-height: 1.6;">Votre <strong>${docLabel}</strong> (N° ${doc.document_number}) n'a pas pu être validé.</p>
            ${reason ? `<div style="background: #fff; border-radius: 8px; padding: 12px; margin: 12px 0;">
              <p style="color: #374151; font-size: 14px; margin: 0;"><strong>Motif :</strong> ${reason}</p>
            </div>` : ''}
            <p style="color: #374151; line-height: 1.6;">Veuillez soumettre un nouveau document corrigé depuis votre espace personnel.</p>
          </div>
          <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 0;">L'équipe MedConnect reste à votre disposition.</p>
          </div>
        </div>
      `,
    });
  }
}

module.exports = new EmailService();
