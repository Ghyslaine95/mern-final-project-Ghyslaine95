import mongoose from 'mongoose';

const emissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Emission must belong to a user']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: {
      values: ['transportation', 'energy', 'diet', 'shopping', 'waste'],
      message: 'Category must be transportation, energy, diet, shopping, or waste'
    }
  },
  activity: {
    type: String,
    required: [true, 'Please provide an activity'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0, 'Amount must be positive']
  },
  unit: {
    type: String,
    required: [true, 'Please provide a unit']
  },
  co2e: {
    type: Number,
    required: [true, 'CO2 equivalent is required'],
    min: [0, 'CO2 equivalent must be positive']
  },
  date: {
    type: Date,
    required: [true, 'Please provide a date'],
    max: [Date.now, 'Date cannot be in the future']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
emissionSchema.index({ user: 1, date: -1 });
emissionSchema.index({ user: 1, category: 1 });
emissionSchema.index({ user: 1, createdAt: -1 });

// Virtual for formatted date
emissionSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Static method for user stats
emissionSchema.statics.getUserStats = async function(userId, period = 'month') {
  const startDate = getStartDate(period);
  
  const stats = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        totalCO2: { $sum: '$co2e' },
        count: { $sum: 1 },
        averageCO2: { $avg: '$co2e' }
      }
    },
    {
      $sort: { totalCO2: -1 }
    }
  ]);

  return stats;
};

function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case 'week': return new Date(now.setDate(now.getDate() - 7));
    case 'month': return new Date(now.setMonth(now.getMonth() - 1));
    case 'year': return new Date(now.setFullYear(now.getFullYear() - 1));
    default: return new Date(now.setMonth(now.getMonth() - 1));
  }
}

export default mongoose.model('Emission', emissionSchema);