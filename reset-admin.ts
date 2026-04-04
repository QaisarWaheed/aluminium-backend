import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

async function reset() {
  const uri = 'mongodb+srv://wasifzahoor138_db_user:wasif123@cluster0.xyuwjtx.mongodb.net/Aluminium-pos?appName=Cluster0';
  await mongoose.connect(uri);
  
  const userSchema = new mongoose.Schema({ email: String, password: String, role: String }, { strict: false });
  const User = mongoose.model('User', userSchema);
  
  const users = await User.find({});
  console.log("Users in DB:", users.map(u => ({ email: u.email, role: u.role })));
  
  const admin = await User.findOne({ email: 'admin@example.com' });
  if (admin) {
    const hashedPassword = await bcrypt.hash('Admin@12345678', 12);
    admin.password = hashedPassword;
    await admin.save();
    console.log("Reset password for admin@example.com to Admin@12345678");
  } else if (users.length > 0) {
    const firstUser = users[0];
    const hashedPassword = await bcrypt.hash('Admin@12345678', 12);
    firstUser.password = hashedPassword;
    await firstUser.save();
    console.log(`Reset password for ${firstUser.email} to Admin@12345678`);
  }
  
  await mongoose.disconnect();
}
reset().catch(console.error);
