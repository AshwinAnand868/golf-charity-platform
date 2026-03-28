import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireSubscription, AuthRequest } from '../middleware/auth';
import { UserScores } from '../models/Score';

const router = Router();

// GET /api/scores - Get my scores
router.get('/', authenticate, requireSubscription, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userScores = await UserScores.findOne({ user: req.user?._id });
    res.json({ scores: userScores?.scores || [] });
  } catch {
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// POST /api/scores - Add a new score
router.post(
  '/',
  authenticate,
  requireSubscription,
  [
    body('value').isInt({ min: 1, max: 45 }).withMessage('Score must be between 1 and 45'),
    body('date').isISO8601().withMessage('Valid date required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { value, date } = req.body;
      const userId = req.user?._id;

      let userScores = await UserScores.findOne({ user: userId });

      if (!userScores) {
        userScores = new UserScores({ user: userId, scores: [] });
      }

      // Add new score
      userScores.scores.push({ value, date: new Date(date) });

      // Sort by date desc and keep only 5
      userScores.scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (userScores.scores.length > 5) {
        userScores.scores = userScores.scores.slice(0, 5);
      }

      await userScores.save();

      res.json({ message: 'Score added successfully', scores: userScores.scores });
    } catch (error) {
      console.error('Score add error:', error);
      res.status(500).json({ error: 'Failed to add score' });
    }
  }
);

// PUT /api/scores/:index - Update a score by index
router.put(
  '/:index',
  authenticate,
  requireSubscription,
  [
    body('value').isInt({ min: 1, max: 45 }).withMessage('Score must be between 1 and 45'),
    body('date').isISO8601().withMessage('Valid date required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { index } = req.params;
      const { value, date } = req.body;
      const idx = parseInt(index);

      const userScores = await UserScores.findOne({ user: req.user?._id });
      if (!userScores || idx < 0 || idx >= userScores.scores.length) {
        res.status(404).json({ error: 'Score not found' });
        return;
      }

      userScores.scores[idx] = { value, date: new Date(date) };
      userScores.scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      await userScores.save();

      res.json({ message: 'Score updated', scores: userScores.scores });
    } catch {
      res.status(500).json({ error: 'Failed to update score' });
    }
  }
);

// DELETE /api/scores/:index - Delete a score
router.delete('/:index', authenticate, requireSubscription, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idx = parseInt(req.params.index);
    const userScores = await UserScores.findOne({ user: req.user?._id });

    if (!userScores || idx < 0 || idx >= userScores.scores.length) {
      res.status(404).json({ error: 'Score not found' });
      return;
    }

    userScores.scores.splice(idx, 1);
    await userScores.save();

    res.json({ message: 'Score deleted', scores: userScores.scores });
  } catch {
    res.status(500).json({ error: 'Failed to delete score' });
  }
});

export default router;
