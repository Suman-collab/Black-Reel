export const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    currency: 'INR',
    description: 'A starter plan for casual watching on mobile devices.',
    features: ['HD Streaming', '1 Screen', 'Mobile & Tablet'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 199,
    currency: 'INR',
    description: 'Best for regular streaming on multiple devices in Full HD.',
    features: ['Full HD Streaming', '2 Screens', 'All Devices', 'Downloads'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 299,
    currency: 'INR',
    description: 'Full premium access for families and binge-watchers in 4K + HDR.',
    features: ['4K + HDR', '4 Screens', 'All Devices', 'Downloads', 'Dolby Audio'],
  },
];

export const getPlanById = (planId) => plans.find((plan) => plan.id === planId) || null;

