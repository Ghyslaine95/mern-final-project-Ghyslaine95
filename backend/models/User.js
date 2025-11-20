import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be less than 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    location: {
      country: String,
      city: String,
      timezone: String
    }
  },
  preferences: {
    units: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    },
    weeklyGoal: {
      type: Number,
      default: 50,
      min: [0, 'Goal must be positive']
    },
    notifications: {
      email: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true }
    }
  },
  stats: {
    totalCO2Saved: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: Date,
    achievements: [String]
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'stats.lastActive': -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile?.firstName || ''} ${this.profile?.lastName || ''}`.trim();
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.updateLastActive = function() {
  this.stats.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
};

export default mongoose.model('User', userSchema);