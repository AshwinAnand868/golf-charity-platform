import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { Charity } from '../models/Charity';

const router = Router();

// GET /api/charities - List all active charities (public)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, featured } = req.query;
    const filter: Record<string, unknown> = { isActive: true };

    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;

    const charities = await Charity.find(filter).sort({ featured: -1, name: 1 });
    res.json({ charities });
  } catch {
    res.status(500).json({ error: 'Failed to fetch charities' });
  }
});

// GET /api/charities/:id - Single charity (public)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) {
      res.status(404).json({ error: 'Charity not found' });
      return;
    }
    res.json({ charity });
  } catch {
    res.status(500).json({ error: 'Failed to fetch charity' });
  }
});

// POST /api/charities - Admin: create charity
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const charity = await Charity.create(req.body);
      res.status(201).json({ message: 'Charity created', charity });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create charity' });
    }
  }
);

// PUT /api/charities/:id - Admin: update charity
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!charity) {
      res.status(404).json({ error: 'Charity not found' });
      return;
    }
    res.json({ message: 'Charity updated', charity });
  } catch {
    res.status(500).json({ error: 'Failed to update charity' });
  }
});

// DELETE /api/charities/:id - Admin: delete charity
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const charity = await Charity.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!charity) {
      res.status(404).json({ error: 'Charity not found' });
      return;
    }
    res.json({ message: 'Charity deactivated' });
  } catch {
    res.status(500).json({ error: 'Failed to delete charity' });
  }
});

// PUT /api/charities/:id/feature - Admin: toggle featured
router.put('/:id/feature', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) {
      res.status(404).json({ error: 'Charity not found' });
      return;
    }
    charity.featured = !charity.featured;
    await charity.save();
    res.json({ message: 'Featured status toggled', charity });
  } catch {
    res.status(500).json({ error: 'Failed to update charity' });
  }
});

export default router;
