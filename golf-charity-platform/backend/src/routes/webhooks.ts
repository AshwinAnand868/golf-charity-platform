import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '../models/User';
import { Charity } from '../models/Charity';
import { calculateCharityContribution, calculatePrizePoolContribution } from '../utils/drawEngine';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Stripe requires raw body for webhook verification
router.post('/stripe', require('express').raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Webhook error' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as 'monthly' | 'yearly';

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await User.findByIdAndUpdate(userId, {
            'subscription.status': 'active',
            'subscription.plan': plan,
            'subscription.stripeSubscriptionId': subscription.id,
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
            'subscription.cancelAtPeriodEnd': false,
          });
          console.log(`✅ Subscription activated for user ${userId}`);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const user = await User.findOne({ 'subscription.stripeCustomerId': customerId }).populate('selectedCharity');
        if (user && invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await User.findByIdAndUpdate(user._id, {
            'subscription.status': 'active',
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          });

          // Process charity contribution
          if (user.selectedCharity) {
            const amountPaid = invoice.amount_paid;
            const charityAmount = calculateCharityContribution(amountPaid, user.charityPercentage);
            await Charity.findByIdAndUpdate(user.selectedCharity, {
              $inc: { totalReceived: charityAmount },
            });
            console.log(`💚 Charity contribution: ${charityAmount} for ${user.selectedCharity}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const status = subscription.status === 'active' ? 'active'
            : subscription.status === 'canceled' ? 'cancelled'
            : subscription.status === 'past_due' ? 'lapsed'
            : 'inactive';

          await User.findByIdAndUpdate(userId, {
            'subscription.status': status,
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
            'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await User.findByIdAndUpdate(userId, {
            'subscription.status': 'cancelled',
            'subscription.stripeSubscriptionId': null,
            'subscription.currentPeriodEnd': null,
          });
          console.log(`🔴 Subscription cancelled for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': customerId },
          { 'subscription.status': 'lapsed' }
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
