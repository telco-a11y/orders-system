window.GDL_CONFIG = {
  session: {
    title: 'Weekly Dubai Trade Session',
    subtitle: 'Cat litter, pet food, hygiene and accessories',
    status: 'Scheduled',
    joinUrl: 'https://zoom.us/',
    embedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?si=demo',
    depositPercent: 20
  },
  payments: {
    depositPaymentUrl: 'https://example.com/pay-deposit'
  },
  integrations: {
    webhookUrl: '',
    crmFormUrl: ''
  },
  products: [
    {
      id: 'litter-10l',
      name: 'Premium Bentonite Cat Litter 10L',
      supplier: 'Dubai Node A',
      unitPrice: 6.25,
      finalStorePrice: 8.15,
      expectedMarginPct: 32,
      moq: 240,
      eta: '14-21 days'
    },
    {
      id: 'food-dry-20kg',
      name: 'Dry Cat Food 20kg',
      supplier: 'Dubai Node B',
      unitPrice: 15.9,
      finalStorePrice: 19.7,
      expectedMarginPct: 28,
      moq: 100,
      eta: '10-18 days'
    },
    {
      id: 'odor-control',
      name: 'Odor Control Additive',
      supplier: 'Dubai Node C',
      unitPrice: 3.2,
      finalStorePrice: 4.05,
      expectedMarginPct: 30,
      moq: 500,
      eta: '7-14 days'
    }
  ]
};
