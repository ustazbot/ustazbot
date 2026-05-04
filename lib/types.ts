export interface Answer {
  question_id: string;
  summary: string;
  explanation: string;
  dalil: string;
  note: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export type TrackEventName = 'click_chatgpt' | 'click_umrah';

export interface TrackPayload {
  event: TrackEventName;
  question_id?: string;
  timestamp: string;
}
