import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Emission from '../models/Emission.js';
import EmissionCalculator from '../services/emissionCalculator.js';
import { protect } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// POST route to create new emission
router.post('/', [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('activity').notEmpty().withMessage('Activity is required')
], async (req, res, next) => {
  try {
    console.log('🟢 POST /emissions - Full request:', req.body);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      console.log('❌ Validation errors:', errors.array());
      return next(new AppError(`Validation failed: ${firstError.msg}`, 400));
    }

    const { category, activity, amount, unit, notes, date } = req.body;

    console.log('🔍 Field analysis:', {
      category,
      activity,
      amount,
      amountType: typeof amount,
      unit,
      notes,
      date
    });

    // Convert amount to number (this should always work due to validation)
    const numericAmount = parseFloat(amount);
    console.log('🔍 Parsed amount:', numericAmount);

    // Calculate CO2 equivalent using EmissionCalculator
    console.log('🟡 Calculating CO2e for:', { category, activity, amount: numericAmount, unit });
    
    let co2e;
    try {
      // Use the appropriate calculation method based on category
      switch (category) {
        case 'transportation':
          co2e = EmissionCalculator.calculateTransportation(activity, numericAmount);
          break;
        case 'energy':
          co2e = EmissionCalculator.calculateEnergy(activity, numericAmount);
          break;
        case 'diet':
          co2e = EmissionCalculator.calculateDiet(activity, numericAmount);
          break;
        case 'shopping':
          co2e = EmissionCalculator.calculateShopping(activity, numericAmount);
          break;
        case 'waste':
          co2e = EmissionCalculator.calculateWaste(activity, numericAmount);
          break;
        default:
          co2e = numericAmount * 1; // Default factor
      }
      console.log('🟡 CO2e calculated:', co2e);
    } catch (calcError) {
      console.error('❌ Error in emission calculation:', calcError);
      return next(new AppError('Error calculating emission. Please check your inputs.', 400));
    }

    // Create emission record
    console.log('🟡 Creating Emission document...');
    const emission = await Emission.create({
      user: req.user.id,
      category: category,
      activity: activity,
      amount: numericAmount,
      unit: unit,
      co2e: co2e,
      date: date ? new Date(date) : new Date(),
      notes: notes || ''
    });

    console.log('✅ Emission created successfully:', emission._id);

    res.status(201).json({
      status: 'success',
      message: 'Emission recorded successfully',
      data: {
        emission
      }
    });

  } catch (error) {
    console.error('❌ SERVER ERROR DETAILS:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation failed: ${errors.join(', ')}`, 400));
    }
    
    next(new AppError('Server error while creating emission record', 500));
  }
});

// GET all emissions
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, startDate, endDate } = req.query;
    
    // Build filter object
    const filter = { user: req.user.id };
    
    // Add category filter if provided
    if (category && category !== '') {
      filter.category = category;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate && startDate !== '') {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate && endDate !== '') {
        filter.date.$lte = new Date(endDate);
      }
    }

    console.log('📊 Fetching emissions with filter:', filter);

    const emissions = await Emission.find(filter)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Emission.countDocuments(filter);

    res.json({
      status: 'success',
      results: emissions.length,
      data: {
        emissions
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching emissions:', error);
    next(error);
  }
});

// ========== STATS ROUTES - ADD THESE ==========

// GET emissions statistics summary
router.get('/stats/summary', async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const startDate = getStartDate(period);
    
    console.log(`📊 Fetching stats for period: ${period}, from: ${startDate}`);

    const stats = await Emission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { 
            $gte: startDate,
            $lte: new Date() 
          }
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
        $project: {
          category: '$_id',
          totalCO2: 1,
          count: 1,
          averageCO2: { $round: ['$averageCO2', 2] },
          _id: 0
        }
      },
      {
        $sort: { totalCO2: -1 }
      }
    ]);

    const totalEmissions = stats.reduce((sum, stat) => sum + stat.totalCO2, 0);
    const totalEntries = stats.reduce((sum, stat) => sum + stat.count, 0);

    console.log('📊 Stats calculated:', {
      totalEmissions,
      totalEntries,
      categories: stats
    });

    res.json({
      status: 'success',
      data: {
        period,
        totalEmissions: Math.round(totalEmissions * 100) / 100,
        totalEntries,
        categories: stats
      }
    });
  } catch (error) {
    console.error('❌ Error fetching emission stats:', error);
    next(error);
  }
});

// GET emissions over time (for charts)
router.get('/stats/over-time', async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const startDate = getStartDate(period);

    let groupFormat;
    switch (period) {
      case 'week':
        groupFormat = '%Y-%m-%d'; // Daily for week
        break;
      case 'month':
        groupFormat = '%Y-%m-%d'; // Daily for month
        break;
      case 'year':
        groupFormat = '%Y-%m'; // Monthly for year
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    console.log(`📈 Fetching over-time data for period: ${period}, format: ${groupFormat}`);

    const emissionsOverTime = await Emission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { 
            $gte: startDate,
            $lte: new Date() 
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$date'
            }
          },
          totalCO2: { $sum: '$co2e' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          totalCO2: { $round: ['$totalCO2', 2] },
          count: 1,
          _id: 0
        }
      }
    ]);

    console.log('📈 Over-time data:', emissionsOverTime);

    res.json({
      status: 'success',
      data: {
        period,
        emissionsOverTime
      }
    });
  } catch (error) {
    console.error('❌ Error fetching emissions over time:', error);
    next(error);
  }
});

// GET category breakdown
router.get('/stats/category-breakdown', async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const startDate = getStartDate(period);

    console.log(`📋 Fetching category breakdown for period: ${period}`);

    const breakdown = await Emission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { 
            $gte: startDate,
            $lte: new Date() 
          }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            activity: '$activity'
          },
          totalCO2: { $sum: '$co2e' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          activities: {
            $push: {
              activity: '$_id.activity',
              totalCO2: { $round: ['$totalCO2', 2] },
              count: '$count'
            }
          },
          categoryTotal: { $sum: '$totalCO2' }
        }
      },
      {
        $project: {
          category: '$_id',
          activities: 1,
          categoryTotal: { $round: ['$categoryTotal', 2] },
          _id: 0
        }
      },
      {
        $sort: { categoryTotal: -1 }
      }
    ]);

    console.log('📋 Category breakdown:', breakdown);

    res.json({
      status: 'success',
      data: {
        period,
        breakdown
      }
    });
  } catch (error) {
    console.error('❌ Error fetching category breakdown:', error);
    next(error);
  }
});

// GET available activities for a category
router.get('/activities/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const activities = EmissionCalculator.getAvailableActivities(category);
    
    res.json({
      status: 'success',
      data: {
        category,
        activities
      }
    });
  } catch (error) {
    next(error);
  }
});

// ========== INDIVIDUAL EMISSION ROUTES ==========

// GET emission by ID
router.get('/:id', async (req, res, next) => {
  try {
    // Check if the ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError('Invalid emission ID', 400));
    }

    const emission = await Emission.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!emission) {
      return next(new AppError('No emission found with that ID', 404));
    }

    res.json({
      status: 'success',
      data: {
        emission
      }
    });
  } catch (error) {
    console.error('❌ Error fetching emission:', error);
    next(error);
  }
});

// UPDATE emission by ID
router.put('/:id', async (req, res, next) => {
  try {
    // Check if the ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError('Invalid emission ID', 400));
    }

    const { category, activity, amount, unit, notes, date } = req.body;

    // Find emission and verify ownership
    const emission = await Emission.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!emission) {
      return next(new AppError('No emission found with that ID', 404));
    }

    // Update fields if provided
    if (category) emission.category = category;
    if (activity) emission.activity = activity;
    if (amount !== undefined) emission.amount = parseFloat(amount);
    if (unit) emission.unit = unit;
    if (notes !== undefined) emission.notes = notes;
    if (date) emission.date = new Date(date);

    // Recalculate CO2e if relevant fields changed
    if (category || activity || amount !== undefined) {
      const finalCategory = category || emission.category;
      const finalActivity = activity || emission.activity;
      const finalAmount = amount !== undefined ? parseFloat(amount) : emission.amount;
      
      let co2e;
      switch (finalCategory) {
        case 'transportation':
          co2e = EmissionCalculator.calculateTransportation(finalActivity, finalAmount);
          break;
        case 'energy':
          co2e = EmissionCalculator.calculateEnergy(finalActivity, finalAmount);
          break;
        case 'diet':
          co2e = EmissionCalculator.calculateDiet(finalActivity, finalAmount);
          break;
        case 'shopping':
          co2e = EmissionCalculator.calculateShopping(finalActivity, finalAmount);
          break;
        case 'waste':
          co2e = EmissionCalculator.calculateWaste(finalActivity, finalAmount);
          break;
        default:
          co2e = finalAmount * 1;
      }
      emission.co2e = co2e;
    }

    await emission.save();

    console.log('✅ Emission updated successfully:', emission._id);

    res.json({
      status: 'success',
      data: {
        emission
      }
    });
  } catch (error) {
    console.error('❌ Error updating emission:', error);
    next(error);
  }
});

// DELETE emission by ID
router.delete('/:id', async (req, res, next) => {
  try {
    // Check if the ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError('Invalid emission ID', 400));
    }

    const emission = await Emission.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!emission) {
      return next(new AppError('No emission found with that ID', 404));
    }

    console.log('✅ Emission deleted successfully:', req.params.id);

    res.json({
      status: 'success',
      message: 'Emission deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('❌ Error deleting emission:', error);
    next(error);
  }
});

// Helper function for start date
function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case 'week': 
      return new Date(now.setDate(now.getDate() - 7));
    case 'month': 
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'year': 
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'all':
      return new Date(0); // Beginning of time
    default: 
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}

export default router;