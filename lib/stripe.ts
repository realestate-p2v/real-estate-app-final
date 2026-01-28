import { loadStripe } from '@stripe/stripe-js';

// Make sure the variable name matches exactly what is in your .env file
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
