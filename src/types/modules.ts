export type ModuleType = 
  | 'finder' 
  | 'spec-writer' 
  | 'bulk-csv' 
  | 'listing-kit' 
  | 'pod-briefs' 
  | 'lead-magnet' 
  | 'brand-kit' 
  | 'delivery-pack';

export interface ModuleConfig {
  id: ModuleType;
  name: string;
  description: string;
  icon: string;
}

export interface GenerationStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export interface ModuleState {
  formData: Record<string, any>;
  output: any | null;
  status: GenerationStatus['status'];
  lastGenerated: Date | null;
}
