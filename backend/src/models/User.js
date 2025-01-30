const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return v.endsWith('@piramal.com');
      },
      message: 'Only piramal.com email addresses are allowed'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    console.log('Password modified, hashing:');
    console.log('Original password:', user.password);
    const hashedPassword = await bcrypt.hash(user.password, 8);
    console.log('Hashed password:', hashedPassword);
    user.password = hashedPassword;
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing passwords:');
  console.log('Stored hash:', this.password);
  console.log('Candidate password:', candidatePassword);
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log('Password match:', isMatch);
  return isMatch;
};

// Static method to find user by email with avatar
userSchema.statics.findByEmailWithAvatar = async function(email) {
  return this.findOne({ email }).select('+avatar');
};

// Static method to find user by id with avatar
userSchema.statics.findByIdWithAvatar = async function(id) {
  return this.findById(id).select('+avatar');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
