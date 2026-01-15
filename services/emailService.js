const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendReminderEmail = async (userEmail, carInfo, serviceType, expiryDate) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `🚗 Напомена: ${serviceType} на ${carInfo.brand} ${carInfo.model} изтича скоро!`,
    html: `
      <h2>Напомена за автомобилна услуга</h2>
      <p>Здравей,</p>
      <p>Това е напомена, че <strong>${serviceType}</strong> на твоя автомобил <strong>${carInfo.brand} ${carInfo.model}</strong> (${carInfo.year}) <strong>изтича на ${new Date(expiryDate).toLocaleDateString('bg-BG')}</strong>.</p>
      <p>Препоръчваме ти да я поднови в скоро време, за да избегнеш проблеми.</p>
      <p>Влез в системата и актуализирай данните си.</p>
      <p>Благодаря!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendReminderEmail };
