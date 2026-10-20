// reset-password.js – run this ONCE to reset your password
// Usage:  node reset-password.js
// Then delete this file (or just don't commit it).

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const EMAIL       = 'tejas@gmail.com'; // ← your email
const NEW_PASS    = 'tejas123';        // ← your new password

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb');
  console.log('MongoDB connected');

  const user = await User.findOne({ email: EMAIL.toLowerCase() });

  if (!user) {
    // User doesn't exist yet → create them
    const hash = await bcrypt.hash(NEW_PASS, 10);
    await User.create({ name: 'Tejas', email: EMAIL.toLowerCase(), password: hash });
    console.log(`✔  Created new user: ${EMAIL}`);
  } else {
    // User exists → update password
    user.password = await bcrypt.hash(NEW_PASS, 10);
    await user.save();
    console.log(`✔  Password reset for: ${EMAIL}`);
  }

  console.log(`\n   Email    : ${EMAIL}`);
  console.log(`   Password : ${NEW_PASS}`);
  console.log('\n   You can now log in with these credentials.\n');

  await mongoose.disconnect();
  process.exit(0);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
