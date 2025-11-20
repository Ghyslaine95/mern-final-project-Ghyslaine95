import express from 'express';
import mongoose from 'mongoose'; // Add this import
import Emission from '../models/Emission.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Get analytics data
router.get('/', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Get emissions by category for the period
    const categoryStats = await Emission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: getStartDate(period) }
        }
      },
      {
        $group: {
          _id: '$category',
          totalCO2: { $sum: '$co2e' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalCO2: -1 }
      }
    ]);

    // Get weekly trends for the last 7 days
    const weeklyTrends = await Emission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: getStartDate('week') }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          totalCO2: { $sum: '$co2e' },
          date: { $first: '$date' }
        }
      },
      {
        $sort: { 'date': 1 }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date'
            }
          },
          totalCO2: 1
        }
      }
    ]);

    // Get total emissions for the period
    const totalStats = await Emission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: getStartDate(period) }
        }
      },
      {
        $group: {
          _id: null,
          totalCO2: { $sum: '$co2e' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent emissions for the frontend
    const recentEmissions = await Emission.find({
      user: req.user.id,
      date: { $gte: getStartDate('year') } // Get enough data for trends
    })
    .sort({ date: -1 })
    .limit(100)
    .lean(); // Convert to plain JavaScript objects

    // Convert to plain objects to avoid serialization issues
    const responseData = {
      byCategory: categoryStats.map(item => ({
        _id: item._id,
        totalCO2: item.totalCO2,
        count: item.count
      })),
      weeklyTrends: weeklyTrends,
      total: totalStats[0]?.totalCO2 || 0,
      count: totalStats[0]?.count || 0,
      recentEmissions: recentEmissions.map(emission => ({
        ...emission,
        _id: emission._id.toString(), // Convert ObjectId to string
        user: emission.user.toString() // Convert user ObjectId to string
      }))
    };

    res.json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Helper function to get start date based on period
function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}

export default router;