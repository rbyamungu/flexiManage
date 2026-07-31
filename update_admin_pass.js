const mongoose = require('./backend/node_modules/mongoose');
const config = require('./backend/configs');
const User = require('./backend/models/users');

mongoose.connect(config.mongodbUrl).then(async () => {
  const user = await User.findOne({ email: 'admin@kivu.homelab' });
  if (user) {
    user.emailVerified = true;
    user.isVerified = true;
    user.setPassword('Password123!', async (err, updatedUser) => {
      if (err) {
        console.error('ERR:', err);
        process.exit(1);
      }
      await updatedUser.save();
      console.log('ADMIN_PASSWORD_UPDATED_TO_Password123!');
      process.exit(0);
    });
  } else {
    console.log('USER_NOT_FOUND');
    process.exit(1);
  }
}).catch(e => { console.error('MONGO_ERR:', e); process.exit(1); });
