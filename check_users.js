const mongoose = require('./backend/node_modules/mongoose');
const config = require('./backend/configs');
const url = (config.mongodb && config.mongodb.url) || 'mongodb://127.0.0.1:27017/flexiwan';
mongoose.connect(url)
  .then(async () => {
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('USERS_COUNT:', users.length);
    users.forEach(u => {
      console.log('USER_EMAIL:', u.email, '| emailVerified:', u.emailVerified, '| isVerified:', u.isVerified);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
  });
