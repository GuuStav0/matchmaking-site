import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "8fd82b3be871ce",
    pass: "fdc927c329c504",
  },
});

export const enviarEmailRecuperacao = (email, token) => {
  return new Promise((resolve, reject) => {
    // Link apontando para a nova rota no React
    const urlRedefinir = `http://localhost:5173/reset-password?token=${token}`;

    const mailOptions = {
      from: '"Matchup" <hello@demomailtrap.co>',
      to: email,
      subject: "🔄 Recuperação de Senha - Matchup",
      html: `
        <div style="font-family: sans-serif; background-color: #1e1b4b; color: #fff; padding: 40px; border-radius: 8px; max-width: 600px;">
          <h2 style="color: #a855f7;">Recuperação de Senha</h2>
          <p>Você solicitou a redefinição de senha para sua conta no Matchup.</p>
          <p>Clique no botão abaixo para escolher uma nova senha. Este link expira em 15 minutos.</p>
          <div style="margin: 30px 0;">
            <a href="${urlRedefinir}" style="background-color: #a855f7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Redefinir Senha</a>
          </div>
          <p style="color: #64748b; font-size: 12px;">Se você não solicitou isso, ignore este e-mail.</p>
        </div>
      `,
      headers: {
        "X-Priority": "1", // Alta prioridade
        "X-MSMail-Priority": "High", // Prioridade para Outlook/Hotmail
        Importance: "high", // Importância do e-mail
        Precedence: "bulk", // Avisa o servidor que é um e-mail automatizado legítimo
      }
    };

    console.log("✈️ Tentando disparar e-mail para:", email);

    // Dispara o e-mail usando callback para capturar qualquer comportamento assíncrono
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ ERRO INTERNO DO NODEMAILER:", error);
        reject(error);
      } else {
        console.log("✅ E-MAIL ENVIADO COM SUCESSO:", info.response);
        resolve(info);
      }
    });
  });
};
