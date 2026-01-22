const { Op } = require('sequelize');

const startReminderCheck = (models) => {
  console.log('🔔 Reminder service starting...');
  
  // Check reminders every hour
  setInterval(() => {
    console.log('⏰ Running scheduled reminder check...');
    checkAndSendReminders(models);
  }, 60 * 60 * 1000);
  
  // Also check on startup
  setTimeout(() => {
    console.log('🚀 Running startup reminder check...');
    checkAndSendReminders(models);
  }, 3000);
  
  console.log('✅ Reminder service started successfully');
};

const checkAndSendReminders = async (models) => {
  if (!models) return;

  try {
    const { Service, Car, User } = models;
    const { sendReminderEmail } = require('./emailService');

    // Get all services that haven't sent reminder yet
    const services = await Service.findAll({
      where: {
        reminderSent: false
      }
    });

    console.log(`Found ${services.length} services without reminder sent`);

    const today = new Date();

    for (const service of services) {
      // Load car separately since include might not work
      const car = await Car.findByPk(service.carId);
      const user = await User.findByPk(service.userId);

      console.log(`Checking service: ${service.serviceType}, Car: ${car?.brand}, User: ${user?.email}`);

      if (!car || !user) {
        console.log(`Skipping - car or user not found`);
        continue;
      }

      // Get user's reminder days setting (default 30)
      const reminderDays = user.reminderDays || 30;
      const reminderDate = new Date(today.getTime() + reminderDays * 24 * 60 * 60 * 1000);
      const expiryDate = new Date(service.expiryDate);

      console.log(`Today: ${today.toISOString()}, Expiry: ${expiryDate.toISOString()}, Reminder threshold: ${reminderDate.toISOString()}`);
      console.log(`Condition check: expiry <= reminderDate = ${expiryDate <= reminderDate}, expiry >= today = ${expiryDate >= today}`);

      // Check if service expires within the user's reminder period
      if (expiryDate <= reminderDate && expiryDate >= today) {
        console.log(`Sending email to ${user.email}...`);
        const emailSent = await sendReminderEmail(
          user.email,
          {
            brand: car.brand,
            model: car.model,
            year: car.year
          },
          service.serviceType,
          service.expiryDate
        );

        if (emailSent) {
          service.reminderSent = true;
          await service.save();
          console.log(`✅ Reminder sent to ${user.email} for ${service.serviceType}`);
        } else {
          console.log(`❌ Failed to send email to ${user.email}`);
        }
      } else {
        console.log(`Service not in reminder period yet`);
      }
    }

    console.log(`Reminder check completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error in reminder check:', error);
  }
};

module.exports = { startReminderCheck };

