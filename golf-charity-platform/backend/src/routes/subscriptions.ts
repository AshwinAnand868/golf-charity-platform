import { Router, Response } from 'express';
import Stripe from 'stripe';
import { authenticate, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const PRICES = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly',
  yearly: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly',
};

// POST /api/subscriptions/create-checkout - Create Stripe checkout session
router.post('/create-checkout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plan } = req.body; // 'monthly' | 'yearly'
    const user = req.user!;

    if (!['monthly', 'yearly'].includes(plan)) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    // Create or retrieve Stripe customer
    let customerId = user.subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { 'subscription.stripeCustomerId': customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICES[plan as 'monthly' | 'yearly'],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.FRONTEND_URL}/subscribe?cancelled=true`,
      metadata: { userId: user._id.toString(), plan },
      subscription_data: {
        metadata: { userId: user._id.toString(), plan },
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/subscriptions/cancel - Cancel subscription
router.post('/cancel', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const subId = user.subscription.stripeSubscriptionId;

    if (!subId) {
      res.status(400).json({ error: 'No active subscription' });
      return;
    }

    await stripe.subscriptions.update(subId, { cancel_at_period_end: true });

    await User.findByIdAndUpdate(user._id, { 'subscription.cancelAtPeriodEnd': true });

    res.json({ message: 'Subscription will be cancelled at end of billing period' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// POST /api/subscriptions/reactivate - Reactivate subscription
router.post('/reactivate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const subId = user.subscription.stripeSubscriptionId;

    if (!subId) {
      res.status(400).json({ error: 'No subscription found' });
      return;
    }

    await stripe.subscriptions.update(subId, { cancel_at_period_end: false });
    await User.findByIdAndUpdate(user._id, { 'subscription.cancelAtPeriodEnd': false });

    res.json({ message: 'Subscription reactivated' });
  } catch {
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// GET /api/subscriptions/portal - Stripe customer portal
router.get('/portal', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const customerId = user.subscription.stripeCustomerId;

    if (!customerId) {
      res.status(400).json({ error: 'No billing account found' });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch {
    res.status(500).json({ error: 'Failed to open billing portal' });
  }
});

export default router;
