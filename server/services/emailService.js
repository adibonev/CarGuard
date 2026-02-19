const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

const sendReminderEmail = async (userEmail, carInfo, serviceType, expiryDate) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'CarGuard <onboarding@resend.dev>',
      to: userEmail,
      subject: `🚗 Напомняне: ${serviceType} на ${carInfo.brand} ${carInfo.model} изтича скоро!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">🚗 CarGuard</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Напомняне за автомобилна услуга</h2>
            <p style="color: #666; font-size: 16px;">Здравей,</p>
            <p style="color: #666; font-size: 16px;">
              Това е напомняне, че <strong style="color: #333;">${serviceType}</strong> на твоя автомобил 
              <strong style="color: #333;">${carInfo.brand} ${carInfo.model}</strong> (${carInfo.year}) 
              <strong style="color: #dc3545;">изтича на ${new Date(expiryDate).toLocaleDateString('bg-BG')}</strong>.
            </p>
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                ⚠️ Препоръчваме ти да я подновиш навреме, за да избегнеш глоби или проблеми.
              </p>
            </div>
            <p style="color: #666; font-size: 14px;">
              Влез в системата и актуализирай данните си.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Това съобщение е изпратено автоматично от CarGuard.
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    console.log(`✅ Reminder email sent to ${userEmail}, ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendReminderEmail };
