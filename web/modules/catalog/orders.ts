export type SampleOrder = {
  id: string;
  date: string;
  company: string;
  contact: string;
  total: number;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'On hold';
  payment: 'Paid' | 'ACH processing';
  lines: { id: string; quantity: number }[];
};
export const sampleOrders: SampleOrder[] = [
  {
    id: 'HV-10482',
    date: 'Sep 14, 2026',
    company: 'Jean’s Market',
    contact: 'Jean Martin',
    total: 169728,
    status: 'Shipped',
    payment: 'Paid',
    lines: [
      { id: 'jasmine-rice', quantity: 12 },
      { id: 'madame-sarah-black-eye-peas', quantity: 10 },
      { id: 'cornmeal', quantity: 10 },
    ],
  },
  {
    id: 'HV-10476',
    date: 'Sep 12, 2026',
    company: 'Caribbean Table',
    contact: 'Nadia Pierre',
    total: 112570,
    status: 'On hold',
    payment: 'ACH processing',
    lines: [
      { id: 'fresh-epis-seasoning-medium-spicy', quantity: 10 },
      { id: 'haitian-coffee', quantity: 5 },
    ],
  },
  {
    id: 'HV-10461',
    date: 'Sep 9, 2026',
    company: 'Sunrise Foods',
    contact: 'Marc Charles',
    total: 217536,
    status: 'Processing',
    payment: 'Paid',
    lines: [
      { id: 'diri-shella-haitian-rice', quantity: 24 },
      { id: 'breadfruit-flour', quantity: 20 },
    ],
  },
  {
    id: 'HV-10429',
    date: 'Sep 2, 2026',
    company: 'Jean’s Market',
    contact: 'Jean Martin',
    total: 139828,
    status: 'Delivered',
    payment: 'Paid',
    lines: [
      { id: 'jasmine-rice', quantity: 12 },
      { id: 'caribbean-pikliz', quantity: 5 },
    ],
  },
  {
    id: 'HV-10408',
    date: 'Aug 26, 2026',
    company: 'Jean’s Market',
    contact: 'Jean Martin',
    total: 108760,
    status: 'Delivered',
    payment: 'Paid',
    lines: [
      { id: 'small-red-beans', quantity: 12 },
      { id: 'breadfruit-flour', quantity: 10 },
    ],
  },
];
