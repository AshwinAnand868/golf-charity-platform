import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

const router = Router();

// PUT /api/users/profile - Update profile
router.put(
  '/profile',
  authenticate,
  [body('name').optional().trim().notEmpty()],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const { name } = req.body;
      const user = await User.findByIdAndUpdate(req.user?._id, { name }, { new: true });
      res.json({ user });
    } catch {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// PUT /api/users/charity - Update charity selection and percentage
router.put(
  '/charity',
  authenticate,
  [
    body('selectedCharity').notEmpty().withMessage('Charity is required'),
    body('charityPercentage').isInt({ min: 10, max: 100 }).withMessage('Percentage must be 10-100'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const { selectedCharity, charityPercentage } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        { selectedCharity, charityPercentage },
        { new: true }
      ).populate('selectedCharity', 'name logo');
      res.json({ user });
    } catch {
      res.status(500).json({ error: 'Failed to update charity' });
    }
  }
);

// PUT /api/users/password - Change password
router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user?._id).select('+password');
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      if (!(await user.comparePassword(currentPassword))) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } catch {
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
);

export default router;
