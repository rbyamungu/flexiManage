const mongoose = require('./backend/node_modules/mongoose');
const config = require('./backend/configs');
const url = (config.mongodb && config.mongodb.url) || 'mongodb://127.0.0.1:27017/flexiwan';
mongoose.connect(url)
  .then(async () => {
    const res = await mongoose.connection.db.collection('users').updateMany(
      {},
      { $set: { emailVerified: true, isVerified: true, verified: true, status: 'active' } }
    );
    console.log('UPDATED_USERS_RESULT:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
  });
