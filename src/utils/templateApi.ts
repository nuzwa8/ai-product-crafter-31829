import { simulateGeneration } from './mockData';

export interface TemplateSettings {
  paperSize: 'a4' | 'letter' | 'a5';
  orientation: 'portrait' | 'landscape';
  accentColor: string;
  font: 'inter' | 'roboto' | 'plex';
  dpi: 72 | 150 | 300;
}

export interface GeneratedTemplate {
  templateId: string;
  previewUrl: string;
  pageSize: string;
  orientation: string;
  style: string;
  downloadUrls: {
    pdf: string;
    png: string;
    svg: string;
  };
  metadata?: {
    generatedAt: string;
    prompt: string;
    settings: TemplateSettings;
  };
}

export const generateTemplate = async (
  prompt: string,
  settings: TemplateSettings
): Promise<GeneratedTemplate> => {
  // Simulate API call with delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Return mock template data
  const result = await simulateGeneration('template-generator', { prompt, settings });
  return result as GeneratedTemplate;
};

export const downloadFile = (templateId: string, format: 'pdf' | 'png' | 'svg') => {
  // Simulate file download
  const link = document.createElement('a');
  link.href = `/api/download/${templateId}.${format}`;
  link.download = `template_${templateId}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Preset templates
export const presetTemplates = {
  'weekly-planner': {
    prompt: 'A4 weekly planner with Monday start, 7 columns for days, notes section on right, minimalist style with blue accents',
    settings: {
      paperSize: 'a4' as const,
      orientation: 'portrait' as const,
      accentColor: '#3b82f6',
      font: 'inter' as const,
      dpi: 300 as const
    }
  },
  'monthly-calendar': {
    prompt: 'Monthly calendar with Sunday start, large date boxes, space for notes at bottom, modern clean design',
    settings: {
      paperSize: 'letter' as const,
      orientation: 'landscape' as const,
      accentColor: '#10b981',
      font: 'roboto' as const,
      dpi: 150 as const
    }
  },
  'daily-schedule': {
    prompt: 'Daily schedule from 6 AM to 10 PM, 30-minute increments, priority tasks section, minimalist design',
    settings: {
      paperSize: 'a4' as const,
      orientation: 'portrait' as const,
      accentColor: '#8b5cf6',
      font: 'inter' as const,
      dpi: 300 as const
    }
  },
  'habit-tracker': {
    prompt: '30-day habit tracker with 10 habit rows, checkbox grid, progress bar, motivational quote space',
    settings: {
      paperSize: 'a4' as const,
      orientation: 'landscape' as const,
      accentColor: '#f59e0b',
      font: 'plex' as const,
      dpi: 300 as const
    }
  },
  'meal-planner': {
    prompt: 'Weekly meal planner with breakfast, lunch, dinner, snacks rows, shopping list section, recipe notes',
    settings: {
      paperSize: 'letter' as const,
      orientation: 'portrait' as const,
      accentColor: '#ec4899',
      font: 'roboto' as const,
      dpi: 150 as const
    }
  }
};
