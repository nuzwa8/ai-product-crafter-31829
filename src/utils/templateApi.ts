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
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ prompt, settings }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate template');
  }

  return await response.json();
};

export const downloadFile = async (
  templateId: string, 
  format: 'pdf' | 'png' | 'svg',
  dataUrl: string
) => {
  const link = document.createElement('a');
  
  if (format === 'svg') {
    // SVG can be downloaded directly
    link.href = dataUrl;
    link.download = `template_${templateId}.${format}`;
  } else if (format === 'png') {
    // Convert SVG to PNG using canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            link.href = URL.createObjectURL(blob);
            link.download = `template_${templateId}.png`;
            resolve(true);
          } else {
            reject(new Error('Failed to convert to PNG'));
          }
        }, 'image/png');
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  } else if (format === 'pdf') {
    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    
    // Create PDF from SVG
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });
    
    // Calculate PDF dimensions
    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (img.height * pdfWidth) / img.width;
    
    pdf.addImage(dataUrl, 'SVG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`template_${templateId}.pdf`);
    return; // PDF saves directly, no need for link
  }
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up blob URL if created
  if (format === 'png') {
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }
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
