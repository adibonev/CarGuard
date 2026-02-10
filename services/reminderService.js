let supabaseClient = null;

const startReminderCheck = (supabase) => {
  console.log('🔔 Reminder service starting...');
  supabaseClient = supabase;
  
  // Check reminders every hour
  setInterval(() => {
    console.log('⏰ Running scheduled reminder check...');
    checkAndSendReminders();
  }, 60 * 60 * 1000);
  
  // Also check on startup
  setTimeout(() => {
    console.log('🚀 Running startup reminder check...');
    checkAndSendReminders();
  }, 3000);
  
  console.log('✅ Reminder service started successfully');
};

const checkAndSendReminders = async () => {
  if (!supabaseClient) return;

  try {
    const { sendReminderEmail } = require('./emailService');

    // Get all services that haven't sent reminder yet
    const { data: services, error } = await supabaseClient
      .from('services')
      .select('*')
      .eq('reminder_sent', false);

    if (error) {
      console.error('Error fetching services:', error);
      return;
    }

    console.log(`Found ${services.length} services without reminder sent`);

    const today = new Date();
    
    // Helper function to add delay between emails (avoid rate limiting)
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Only send reminders for these service types (ones that expire)
    const reminderTypes = ['гражданска', 'винетка', 'преглед', 'каско', 'данък', 'пожарогасител'];

    for (const service of services) {
      // Skip service types that don't need reminders
      if (!reminderTypes.includes(service.service_type)) {
        console.log(`Skipping ${service.service_type} - not a reminder type`);
        continue;
      }
      
      // Load car
      const { data: car } = await supabaseClient
        .from('cars')
        .select('*')
        .eq('id', service.car_id)
        .single();

      // Load user
      const { data: user } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', service.user_id)
        .single();

      console.log(`Checking service: ${service.service_type}, Car: ${car?.brand}, User: ${user?.email}`);

      if (!car || !user) {
        console.log(`Skipping - car or user not found`);
        continue;
      }

      if (user.reminder_enabled === false) {
        console.log(`Skipping - reminders disabled for ${user.email}`);
        continue;
      }

      // Get user's reminder days setting (default 30)
      const reminderDays = user.reminder_days || 30;
      const reminderDate = new Date(today.getTime() + reminderDays * 24 * 60 * 60 * 1000);
      const expiryDate = new Date(service.expiry_date);
      
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
          service.service_type,
          service.expiry_date
        );

        if (emailSent) {
          // Update reminder_sent in Supabase
          await supabaseClient
            .from('services')
            .update({ reminder_sent: true })
            .eq('id', service.id);
            
          console.log(`✅ Reminder sent to ${user.email} for ${service.service_type}`);
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

