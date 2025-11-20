import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', [
  body('username').optional().isLength({ min: 3 }),
  body('email').optional().isEmail()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: {
          ...req.body.profile && { profile: req.body.profile },
          ...req.body.username && { username: req.body.username },
          ...req.body.email && { email: req.body.email }
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Email or username already exists', 400));
    }
    next(error);
  }
});

// Update user preferences
router.put('/preferences', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: {
          preferences: req.body
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user stats
router.get('/stats', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      status: 'success',
      data: {
        stats: user.stats
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;