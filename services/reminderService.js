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
    
    // Helper function to add delay between emails (avoid rate limiting)
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Only send reminders for these service types (ones that expire)
    const reminderTypes = ['гражданска', 'винетка', 'преглед', 'каско', 'данък', 'пожарогасител'];

    for (const service of services) {
      // Skip service types that don't need reminders
      if (!reminderTypes.includes(service.serviceType)) {
        console.log(`Skipping ${service.serviceType} - not a reminder type`);
        continue;
      }
      
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
      
      // Normalize email to lowercase
      const userEmail = user.email.toLowerCase();

      console.log(`Today: ${today.toISOString()}, Expiry: ${expiryDate.toISOString()}, Reminder threshold: ${reminderDate.toISOString()}`);
      console.log(`Condition check: expiry <= reminderDate = ${expiryDate <= reminderDate}`);

      // Check if service expires within the user's reminder period OR is already expired
      // Send reminder if: expiry is in the past OR expiry is within reminder period
      if (expiryDate <= reminderDate) {
        console.log(`Sending email to ${userEmail}...`);
        const emailSent = await sendReminderEmail(
          userEmail,
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
          // Add delay to avoid rate limiting (Resend allows 2 requests/second)
          await delay(600);
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

