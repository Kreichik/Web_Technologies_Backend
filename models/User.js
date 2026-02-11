const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
firstName: { type: String, required: true },
lastName: { type: String, required: true },
birthDate: { type: Date, required: true },
email: { type: String, required: true, unique: true },
password: { type: String, required: true },
avatarUrl: { type: String, default: 'assets/images/avatar.png' },
role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

userSchema.pre('save', async function(next) {
if (!this.isModified('password')) {
return next()
}
this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);