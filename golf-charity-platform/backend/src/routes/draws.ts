import { Router, Response } from 'express';
import { authenticate, requireAdmin, requireSubscription, AuthRequest } from '../middleware/auth';
import { Draw } from '../models/Draw';
import { User } from '../models/User';
import { UserScores } from '../models/Score';
import {
  generateRandomDraw,
  generateAlgorithmicDraw,
  calculateMatches,
  calculatePrizeTiers,
  calculatePrizePoolContribution,
  SUBSCRIPTION_PRICES,
} from '../utils/drawEngine';

const router = Router();

// GET /api/draws - Get all published draws (public)
router.get('/', async (req, res): Promise<void> => {
  try {
    const draws = await Draw.find({ status: 'published' })
      .populate('winners.user', 'name email')
      .sort({ year: -1, month: -1 })
      .limit(12);
    res.json({ draws });
  } catch {
    res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

// GET /api/draws/current - Current month draw info
router.get('/current', authenticate, requireSubscription, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const draw = await Draw.findOne({ month: now.getMonth() + 1, year: now.getFullYear() })
      .populate('winners.user', 'name');
    
    const activeCount = await User.countDocuments({ 'subscription.status': 'active' });
    const totalPool = activeCount * calculatePrizePoolContribution(SUBSCRIPTION_PRICES.monthly);

    res.json({ draw, activeSubscribers: activeCount, estimatedPool: totalPool / 100 });
  } catch {
    res.status(500).json({ error: 'Failed to fetch current draw' });
  }
});

// GET /api/draws/my-history - User's draw participation history
router.get('/my-history', authenticate, requireSubscription, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const draws = await Draw.find({
      status: 'published',
      'winners.user': req.user?._id,
    }).sort({ year: -1, month: -1 });
    res.json({ draws });
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/draws/simulate - Admin: run simulation
router.post('/simulate', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year, drawType = 'random' } = req.body;

    const drawnNumbers = drawType === 'algorithmic'
      ? await generateAlgorithmicDraw()
      : generateRandomDraw();

    // Find all active subscribers with scores
    const activeUsers = await User.find({ 'subscription.status': 'active' });
    const userIds = activeUsers.map((u) => u._id);
    const allScores = await UserScores.find({ user: { $in: userIds } });

    // Calculate prize pool
    const prizePoolPerUser = calculatePrizePoolContribution(SUBSCRIPTION_PRICES.monthly);
    const totalPool = activeUsers.length * prizePoolPerUser;

    // Check for rolled over jackpot from previous month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevDraw = await Draw.findOne({ month: prevMonth, year: prevYear, status: 'published' });
    const jackpotRollover = prevDraw?.prizePool.jackpotRolledOver || 0;

    const tiers = calculatePrizeTiers(totalPool, jackpotRollover);

    // Find winners
    const fiveMatchWinners: string[] = [];
    const fourMatchWinners: string[] = [];
    const threeMatchWinners: string[] = [];

    for (const us of allScores) {
      const userNums = us.scores.map((s) => s.value);
      const matches = calculateMatches(userNums, drawnNumbers);
      if (matches >= 5) fiveMatchWinners.push(us.user.toString());
      else if (matches >= 4) fourMatchWinners.push(us.user.toString());
      else if (matches >= 3) threeMatchWinners.push(us.user.toString());
    }

    // Calculate individual prize amounts
    const winners = [];
    
    if (fiveMatchWinners.length > 0) {
      const share = Math.floor(tiers.jackpot / fiveMatchWinners.length);
      for (const uid of fiveMatchWinners) {
        winners.push({ user: uid, matchType: '5-match', prizeAmount: share, verificationStatus: 'unsubmitted', paymentStatus: 'pending', proofUrl: '' });
      }
    }

    const fourShare = fourMatchWinners.length > 0 ? Math.floor(tiers.fourMatch / fourMatchWinners.length) : 0;
    for (const uid of fourMatchWinners) {
      winners.push({ user: uid, matchType: '4-match', prizeAmount: fourShare, verificationStatus: 'unsubmitted', paymentStatus: 'pending', proofUrl: '' });
    }

    const threeShare = threeMatchWinners.length > 0 ? Math.floor(tiers.threeMatch / threeMatchWinners.length) : 0;
    for (const uid of threeMatchWinners) {
      winners.push({ user: uid, matchType: '3-match', prizeAmount: threeShare, verificationStatus: 'unsubmitted', paymentStatus: 'pending', proofUrl: '' });
    }

    // Jackpot rollover if no 5-match winner
    if (fiveMatchWinners.length === 0) {
      tiers.jackpotRolledOver = tiers.jackpot;
    }

    // Upsert simulation
    const draw = await Draw.findOneAndUpdate(
      { month, year },
      {
        month, year, drawnNumbers, drawType,
        status: 'simulation',
        prizePool: tiers,
        winners,
        participantCount: allScores.length,
        jackpotRolledFromPrevious: jackpotRollover,
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Simulation complete', draw });
  } catch (error) {
    console.error('Draw simulation error:', error);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

// POST /api/draws/:id/publish - Admin: publish a draw
router.post('/:id/publish', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) {
      res.status(404).json({ error: 'Draw not found' });
      return;
    }
    draw.status = 'published';
    draw.publishedAt = new Date();
    await draw.save();
    res.json({ message: 'Draw published', draw });
  } catch {
    res.status(500).json({ error: 'Failed to publish draw' });
  }
});

// GET /api/draws/admin/all - Admin: all draws
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const draws = await Draw.find().populate('winners.user', 'name email').sort({ year: -1, month: -1 });
    res.json({ draws });
  } catch {
    res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

// POST /api/draws/winners/:drawId/:userId/verify - Admin: verify winner
router.post('/winners/:drawId/:userId/verify', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { drawId, userId } = req.params;
    const { action } = req.body; // 'approve' | 'reject'

    const draw = await Draw.findById(drawId);
    if (!draw) {
      res.status(404).json({ error: 'Draw not found' });
      return;
    }

    const winner = draw.winners.find((w) => w.user.toString() === userId);
    if (!winner) {
      res.status(404).json({ error: 'Winner not found' });
      return;
    }

    winner.verificationStatus = action === 'approve' ? 'approved' : 'rejected';
    if (action === 'approve') winner.paymentStatus = 'pending';
    winner.reviewedAt = new Date();

    await draw.save();
    res.json({ message: `Winner ${action}d`, draw });
  } catch {
    res.status(500).json({ error: 'Failed to verify winner' });
  }
});

// POST /api/draws/winners/:drawId/:userId/payout - Admin: mark as paid
router.post('/winners/:drawId/:userId/payout', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { drawId, userId } = req.params;
    const draw = await Draw.findById(drawId);
    if (!draw) {
      res.status(404).json({ error: 'Draw not found' });
      return;
    }

    const winner = draw.winners.find((w) => w.user.toString() === userId);
    if (!winner) {
      res.status(404).json({ error: 'Winner not found' });
      return;
    }

    winner.paymentStatus = 'paid';
    await draw.save();
    res.json({ message: 'Payout marked', draw });
  } catch {
    res.status(500).json({ error: 'Failed to mark payout' });
  }
});

// POST /api/draws/:drawId/submit-proof - User submits proof
router.post('/:drawId/submit-proof', authenticate, requireSubscription, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { proofUrl } = req.body;
    const draw = await Draw.findById(req.params.drawId);
    if (!draw) {
      res.status(404).json({ error: 'Draw not found' });
      return;
    }

    const winner = draw.winners.find((w) => w.user.toString() === req.user?._id.toString());
    if (!winner) {
      res.status(404).json({ error: 'You are not a winner in this draw' });
      return;
    }

    winner.proofUrl = proofUrl;
    winner.verificationStatus = 'pending';
    winner.submittedAt = new Date();
    await draw.save();

    res.json({ message: 'Proof submitted for review' });
  } catch {
    res.status(500).json({ error: 'Failed to submit proof' });
  }
});

export default router;
