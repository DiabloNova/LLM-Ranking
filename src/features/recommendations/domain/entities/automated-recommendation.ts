export interface AutomatedRecommendation {
  id: string;
  organizationId: string;
  websiteId?: string;
  title: string;
  description: string;
  type: string; // 'opportunity', 'diagnosis', 'alert'
  priorityScore: number;
  status: string; // 'pending', 'applied', 'dismissed'
  recommendedAction: any;
  dedupKey: string;
  createdAt: Date;
  updatedAt: Date;
}
