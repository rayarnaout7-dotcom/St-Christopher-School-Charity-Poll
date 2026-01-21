import { Campaign } from './types';

export const IBAN_NUMBER = 'BH08ABCO58416009101001';
export const COMMUNITY_GOAL = 75; // Total BHD Goal as requested

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'cancer-research',
    title: 'Cancer Research Support',
    description: 'A professional initiative supporting breakthrough medical research. Every BHD contributed funds laboratory equipment and patient care programs.',
    goal: 75,
    raised: 0, // Reset to zero
    category: 'Health',
    imageUrl: 'https://images.unsplash.com/photo-1579152276532-535c21af3bb5?auto=format&fit=crop&q=80&w=800',
    endDate: '2024-12-31',
    donorCount: 0
  },
  {
    id: 'coral-reefs',
    title: 'Marine Restoration Program',
    description: 'Dedicated to preserving coral reefs. These funds support propagation tanks and biodiversity monitoring in partnership with local biologists.',
    goal: 75,
    raised: 12, // Only 12 BHD donated so far
    category: 'Environment',
    imageUrl: 'https://images.unsplash.com/photo-1546026423-9d6655c32936?auto=format&fit=crop&q=80&w=800',
    endDate: '2024-11-15',
    donorCount: 1
  }
];

export const CATEGORIES = ['All', 'Health', 'Environment'] as const;