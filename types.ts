
export interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  category: 'Health' | 'Environment';
  imageUrl: string;
  endDate: string;
  donorCount: number;
}

export interface Donation {
  id: string;
  campaignId: string;
  amount: number;
  donorName: string;
  donorGender: string;
  schoolId: string;
  method: 'benefit' | 'cash';
  timestamp: number;
}

export interface User {
  name: string;
  role: 'Student' | 'Teacher' | 'Parent' | 'Admin';
}
