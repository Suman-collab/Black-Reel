export const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 4.99,
    description: 'A starter plan for casual watching.',
    features: ['Watch on 1 device', 'Access to all originals', 'Ad-supported'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 7.99,
    description: 'Best for regular streaming on multiple devices.',
    features: ['Watch on 2 devices', 'Access to all originals', 'Ad-free'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    description: 'Full premium access for families and binge-watchers.',
    features: ['Watch on 4 devices', 'Access to all originals', 'Ad-free'],
  },
];

export const getPlanById = (planId) => plans.find((plan) => plan.id === planId) || null;
