import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Draw } from '../models/Draw';
import { Charity } from '../models/Charity';
import { UserScores } from '../models/Score';

const router = Router();

// GET /api/admin/stats - Dashboard stats
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, activeSubscribers, totalCharities, recentDraws] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ 'subscription.status': 'active' }),
      Charity.countDocuments({ isActive: true }),
      Draw.find({ status: 'published' }).sort({ year: -1, month: -1 }).limit(3),
    ]);

    const totalPrizePool = recentDraws.reduce((sum, d) => sum + d.prizePool.total, 0);

    const charityTotal = await User.aggregate([
      { $match: { 'subscription.status': 'active' } },
      { $group: { _id: null, total: { $sum: '$charityPercentage' } } },
    ]);

    res.json({
      totalUsers,
      activeSubscribers,
      totalCharities,
      totalPrizePool: totalPrizePool / 100,
      recentDraws,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users - List all users with pagination
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('selectedCharity', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id - Single user details
router.get('/users/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).populate('selectedCharity', 'name logo');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const scores = await UserScores.findOne({ user: user._id });
    res.json({ user, scores: scores?.scores || [] });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/admin/users/:id - Update user (admin)
router.put('/users/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, role, 'subscription.status': subStatus } = req.body;
    const update: Record<string, unknown> = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (role) update.role = role;
    if (subStatus) update['subscription.status'] = subStatus;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PUT /api/admin/users/:id/scores - Admin edit user scores
router.put('/users/:id/scores', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scores } = req.body;
    const userScores = await UserScores.findOneAndUpdate(
      { user: req.params.id },
      { scores },
      { new: true, upsert: true }
    );
    res.json({ scores: userScores?.scores });
  } catch {
    res.status(500).json({ error: 'Failed to update scores' });
  }
});

// GET /api/admin/winners - All pending winners
router.get('/winners', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const draws = await Draw.find({
      status: 'published',
      'winners.0': { $exists: true },
    }).populate('winners.user', 'name email');

    const allWinners = draws.flatMap((draw) =>
      draw.winners.map((w) => ({
        ...w.toObject(),
        drawId: draw._id,
        month: draw.month,
        year: draw.year,
      }))
    );

    res.json({ winners: allWinners });
  } catch {
    res.status(500).json({ error: 'Failed to fetch winners' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await UserScores.findOneAndDelete({ user: req.params.id });
    res.json({ message: 'User deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
