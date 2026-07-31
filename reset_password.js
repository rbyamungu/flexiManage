const mongoose = require('./backend/node_modules/mongoose');
const config = require('./backend/configs')();
const User = require('./backend/models/users');

async function run() {
  const mongoUrl = config.mongodb.url || 'mongodb://127.0.0.1:27017/flexiwan?replicaSet=rs0&directConnection=true';
  console.log('CONNECTING TO MONGO:', mongoUrl);
  await mongoose.connect(mongoUrl);
  const user = await User.findOne({ email: 'admin@kivu.homelab' });
  if (user) {
    user.emailVerified = true;
    user.isVerified = true;
    user.setPassword('Password123!', async (err, updatedUser) => {
      if (err) {
        console.error('SET_PASSWORD_ERROR:', err);
        process.exit(1);
      }
      await updatedUser.save();
      console.log('PASSWORD_RESET_SUCCESSFUL_FOR:', updatedUser.email);
      process.exit(0);
    });
  } else {
    console.log('USER_NOT_FOUND');
    process.exit(1);
  }
}
run().catch(e => { console.error('RUN_ERR:', e); process.exit(1); });
