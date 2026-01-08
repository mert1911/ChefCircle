import { Request, Response } from 'express';
import Stripe from 'stripe';
import User from '../models/User';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '../config';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export class PaymentController {
  // Helper methods
  private static async updateUserSubscription(userId: string, subscriptionData: {
    subscriptionType: 'free' | 'premium' | 'premium_annual';
    subscriptionStatus: 'active' | 'canceled' | 'past_due' | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    subscriptionStartDate?: Date | null;
    subscriptionEndDate?: Date | null;
  }) {
    try {
      const cleanedData = { ...subscriptionData };
      
      // Validate and clean dates before updating
      if (cleanedData.subscriptionStartDate && isNaN(cleanedData.subscriptionStartDate.getTime())) {
        delete cleanedData.subscriptionStartDate;
      }
      
      if (cleanedData.subscriptionEndDate && isNaN(cleanedData.subscriptionEndDate.getTime())) {
        delete cleanedData.subscriptionEndDate;
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        cleanedData,
        { new: true, runValidators: true }
      ).select('-password');
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  }

  private static safeStripeTimestampToDate(timestamp: any): Date | undefined {
    if (typeof timestamp === 'number' && timestamp > 0) {
      const date = new Date(timestamp * 1000);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return undefined;
  }

  // Create checkout session for premium subscription
  static async createCheckoutSession(req: Request, res: Response) {
    try {
      const { priceId, plan } = req.body;

      const validPriceIds = [
        'price_1RXKhqR0ns7Y7OiCNz8ftzvg', // Monthly Product ID (stripe)
        'price_1RXKj2R0ns7Y7OiCxzG3tZlg'  // Annual Product ID (stripe)
      ];

      if (!validPriceIds.includes(priceId)) {
        return res.status(400).json({ error: 'Invalid price ID' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/payment/cancel`,
        metadata: {
          userId: req.user!.id,
          plan: plan || 'premium',
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ 
        error: 'Failed to create checkout session', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Handle Stripe webhook events
  static async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      if (STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(req.body, sig as string, STRIPE_WEBHOOK_SECRET);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        try {
          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan;
          
          if (!userId) {
            console.error('No userId found in session metadata');
            break;
          }
          
          const user = await User.findById(userId);
          if (!user) {
            console.error('User not found:', userId);
            break;
          }
          
          // Determine subscription type based on plan
          let subscriptionType: 'premium' | 'premium_annual' = 'premium';
          if (plan === 'annual' || session.metadata?.plan === 'annual') {
            subscriptionType = 'premium_annual';
          }
          
          // Get subscription details from Stripe
          const stripeSubscription = await stripe.subscriptions.list({
            customer: session.customer as string,
            limit: 1,
          });
          
          const subscription = stripeSubscription.data[0];
          const subscriptionEndDate = subscription ? PaymentController.safeStripeTimestampToDate((subscription as any).current_period_end) : undefined;
          
          await PaymentController.updateUserSubscription(user._id.toString(), {
            subscriptionType,
            subscriptionStatus: 'active',
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription?.id || undefined,
            subscriptionStartDate: new Date(),
            subscriptionEndDate,
          });
          
          console.log('User upgraded to premium:', user.email);
          
        } catch (error) {
          console.error('Error processing checkout session:', error);
        }
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        
        try {
          // Find user by Stripe customer ID
          const user = await User.findOne({ stripeCustomerId: invoice.customer });
          if (user) {
            // Calculate subscription end date safely
            const subscriptionEndDate = invoice.lines?.data?.[0]?.period?.end 
              ? PaymentController.safeStripeTimestampToDate(invoice.lines.data[0].period.end)
              : undefined;
            
            // Update subscription status to active (renewal)
            await PaymentController.updateUserSubscription(user._id.toString(), {
              subscriptionType: user.subscriptionType as 'premium' | 'premium_annual',
              subscriptionStatus: 'active',
              stripeCustomerId: user.stripeCustomerId,
              stripeSubscriptionId: user.stripeSubscriptionId,
              subscriptionStartDate: user.subscriptionStartDate,
              subscriptionEndDate: subscriptionEndDate || user.subscriptionEndDate,
            });
            console.log('Subscription renewed for user:', user.email);
          }
        } catch (error) {
          console.error('Error processing payment success:', error);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object;
        
        try {
          const user = await User.findOne({ stripeCustomerId: failedInvoice.customer });
          if (user) {
            await PaymentController.updateUserSubscription(user._id.toString(), {
              subscriptionType: user.subscriptionType as 'premium' | 'premium_annual',
              subscriptionStatus: 'past_due',
              stripeCustomerId: user.stripeCustomerId,
              stripeSubscriptionId: user.stripeSubscriptionId,
              subscriptionStartDate: user.subscriptionStartDate,
              subscriptionEndDate: user.subscriptionEndDate,
            });
            console.log('Subscription marked as past due for user:', user.email);
          }
        } catch (error) {
          console.error('Error processing payment failure:', error);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object;
        
        try {
          const user = await User.findOne({ stripeCustomerId: deletedSubscription.customer });
          if (user) {
            await PaymentController.updateUserSubscription(user._id.toString(), {
              subscriptionType: 'free',
              subscriptionStatus: 'canceled',
              stripeCustomerId: user.stripeCustomerId,
              stripeSubscriptionId: undefined,
              subscriptionStartDate: user.subscriptionStartDate,
              subscriptionEndDate: new Date(),
            });
            console.log('User downgraded to free plan:', user.email);
          }
        } catch (error) {
          console.error('Error processing subscription cancellation:', error);
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }

  // Create portal session for subscription management
  static async createPortalSession(req: Request, res: Response) {
    try {
      const user = await User.findById(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (!user.stripeCustomerId) {
        return res.status(400).json({ error: 'No subscription found for this user' });
      }
      
      // Create a portal session
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin}/settings`
      });
      
      res.json({ url: portalSession.url });
    } catch (error) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ 
        error: 'Failed to create portal session', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 