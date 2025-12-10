// src/types.ts
export interface TourStep {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
}

export interface AnalyticsEvent {
  tourId: string;
  eventType: 'tour_started' | 'step_viewed' | 'step_completed' | 'tour_completed' | 'tour_skipped';
  stepId?: string;
  timestamp: string;
  sessionId: string;
}