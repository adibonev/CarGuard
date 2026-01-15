const Service = require('../models/Service');
const Car = require('../models/Car');
const User = require('../models/User');
const { sendReminderEmail } = require('./emailService');

const startReminderCheck = () => {
  // Check reminders every hour
  setInterval(checkAndSendReminders, 60 * 60 * 1000);
  // Also check on startup
  checkAndSendReminders();
};

const checkAndSendReminders = async () => {
  try {
    const today = new Date();
    const oneMonthLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Find all services that expire within 30 days and haven't sent reminder yet
    const services = await Service.find({
      expiryDate: {
        $gte: today,
        $lte: oneMonthLater
      },
      reminderSent: false
    });

    for (const service of services) {
      const car = await Car.findById(service.carId);
      const user = await User.findById(service.userId);

      if (car && user) {
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
        }
      }
    }

    console.log(`Reminder check completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error in reminder check:', error);
  }
};

module.exports = { startReminderCheck };
