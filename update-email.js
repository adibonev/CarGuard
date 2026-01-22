const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false
});

async function updateUserEmail() {
  try {
    // Update user email to bonev112@gmail.com
    await sequelize.query(`UPDATE Users SET email = 'bonev112@gmail.com'`);
    console.log('✅ User email updated to bonev112@gmail.com');
    
    // Reset reminder sent flag to test again
    await sequelize.query(`UPDATE Services SET reminderSent = 0`);
    console.log('✅ Reminder flags reset');
    
    await sequelize.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

updateUserEmail();
