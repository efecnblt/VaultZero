export interface Credential {
  id: string;
  serviceName: string;
  url: string;
  username: string;
  password: string;
  category: string;
  iconURL: string;
  createdAt: string;
}

export type Category = 'All' | 'Social' | 'Work' | 'Finance' | 'Other';
