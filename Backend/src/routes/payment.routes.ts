import express from 'express';
import auth from '../middleware/auth';
import { PaymentController } from '../controllers/payment.controller';

const router = express.Router();

// Create checkout session for premium subscription
router.post('/create-checkout-session', auth, PaymentController.createCheckoutSession);

// Webhook to handle stripe payments
router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook);

// Create Stripe Customer Portal session for subscription management
router.post('/create-portal-session', auth, PaymentController.createPortalSession);

export default router;
