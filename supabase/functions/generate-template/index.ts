import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, settings } = await req.json();
    console.log('Generating template with prompt:', prompt, 'and settings:', settings);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Use AI to generate template structure
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional template designer. Generate detailed specifications for printable templates (planners, calendars, organizers, etc.) based on user descriptions.

Your response must be valid JSON with this exact structure:
{
  "templateType": "weekly-planner|monthly-calendar|daily-schedule|habit-tracker|meal-planner|custom",
  "layout": {
    "columns": number,
    "rows": number,
    "sections": [{"name": string, "x": number, "y": number, "width": number, "height": number}]
  },
  "elements": [
    {
      "type": "text|line|rect|circle",
      "content": string (for text),
      "x": number,
      "y": number,
      "width": number (optional),
      "height": number (optional),
      "fontSize": number (optional),
      "fontWeight": string (optional),
      "stroke": string (optional),
      "fill": string (optional)
    }
  ],
  "styling": {
    "primaryFont": string,
    "headingSize": number,
    "bodySize": number,
    "accentColor": string,
    "backgroundColor": string
  }
}

Consider:
- Paper dimensions in mm (A4: 210x297, Letter: 216x279, A5: 148x210)
- Print margins (minimum 10mm on all sides)
- Professional typography and spacing
- Visual hierarchy and readability
- Proper grid alignment`
          },
          {
            role: 'user',
            content: `Create a ${settings.paperSize.toUpperCase()} ${settings.orientation} template: ${prompt}

Settings:
- Accent color: ${settings.accentColor}
- Font: ${settings.font}
- DPI: ${settings.dpi}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_template_structure",
              description: "Generate structured template specifications",
              parameters: {
                type: "object",
                properties: {
                  templateType: {
                    type: "string",
                    enum: ["weekly-planner", "monthly-calendar", "daily-schedule", "habit-tracker", "meal-planner", "custom"]
                  },
                  layout: {
                    type: "object",
                    properties: {
                      columns: { type: "number" },
                      rows: { type: "number" },
                      sections: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            x: { type: "number" },
                            y: { type: "number" },
                            width: { type: "number" },
                            height: { type: "number" }
                          },
                          required: ["name", "x", "y", "width", "height"]
                        }
                      }
                    },
                    required: ["columns", "rows", "sections"]
                  },
                  elements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["text", "line", "rect", "circle"] },
                        content: { type: "string" },
                        x: { type: "number" },
                        y: { type: "number" },
                        width: { type: "number" },
                        height: { type: "number" },
                        fontSize: { type: "number" },
                        fontWeight: { type: "string" },
                        stroke: { type: "string" },
                        fill: { type: "string" }
                      },
                      required: ["type", "x", "y"]
                    }
                  },
                  styling: {
                    type: "object",
                    properties: {
                      primaryFont: { type: "string" },
                      headingSize: { type: "number" },
                      bodySize: { type: "number" },
                      accentColor: { type: "string" },
                      backgroundColor: { type: "string" }
                    },
                    required: ["primaryFont", "headingSize", "bodySize", "accentColor", "backgroundColor"]
                  }
                },
                required: ["templateType", "layout", "elements", "styling"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_template_structure" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract template structure from tool call
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No template structure generated');
    }

    const templateSpec = JSON.parse(toolCall.function.arguments);
    console.log('Template spec:', templateSpec);

    // Generate SVG based on template spec
    const svg = generateSVG(templateSpec, settings);
    
    // Convert SVG to base64
    const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
    const previewUrl = `data:image/svg+xml;base64,${svgBase64}`;

    const templateId = `temp_${Date.now()}`;

    return new Response(
      JSON.stringify({
        templateId,
        previewUrl,
        pageSize: settings.paperSize.toUpperCase(),
        orientation: settings.orientation.charAt(0).toUpperCase() + settings.orientation.slice(1),
        style: `${templateSpec.templateType} with ${settings.font} font`,
        downloadUrls: {
          svg: previewUrl, // For now, use the same SVG
          pdf: previewUrl, // Client will handle conversion
          png: previewUrl  // Client will handle conversion
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          prompt,
          settings,
          templateSpec
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-template function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateSVG(spec: any, settings: any): string {
  const dimensions = getPaperDimensions(settings.paperSize, settings.orientation);
  
  // Professional page margins (in mm)
  const margins = {
    top: 30,
    bottom: 20,
    left: 15,
    right: 15
  };
  
  const spacing = {
    headerPadding: 10,
    columnGap: 3,
    rowGap: 2,
    sectionGap: 8
  };
  
  const contentWidth = dimensions.width - margins.left - margins.right;
  const contentHeight = dimensions.height - margins.top - margins.bottom;
  
  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${dimensions.width}mm" height="${dimensions.height}mm" 
     viewBox="0 0 ${dimensions.width} ${dimensions.height}" 
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;family=Roboto:wght@400;500;700&amp;family=IBM+Plex+Sans:wght@400;500;600&amp;display=swap');
      text { font-family: '${spec.styling.primaryFont}', sans-serif; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="${spec.styling.backgroundColor || '#ffffff'}"/>
`;

  // Render layout based on template type
  if (spec.templateType === 'weekly-planner') {
    svgContent += generateWeeklyPlanner(margins, contentWidth, contentHeight, spacing, spec.styling);
  } else if (spec.templateType === 'monthly-calendar') {
    svgContent += generateMonthlyCalendar(margins, contentWidth, contentHeight, spacing, spec.styling);
  } else if (spec.templateType === 'daily-schedule') {
    svgContent += generateDailySchedule(margins, contentWidth, contentHeight, spacing, spec.styling);
  } else if (spec.templateType === 'habit-tracker') {
    svgContent += generateHabitTracker(margins, contentWidth, contentHeight, spacing, spec.styling);
  } else if (spec.templateType === 'meal-planner') {
    svgContent += generateMealPlanner(margins, contentWidth, contentHeight, spacing, spec.styling);
  } else {
    // Custom template - render elements from spec
    spec.elements.forEach((element: any) => {
      svgContent += renderElement(element, spec.styling, margins);
    });
  }

  svgContent += '\n</svg>';
  return svgContent;
}

function renderElement(element: any, styling: any, margins: any): string {
  let content = '';
  
  switch (element.type) {
    case 'text':
      content += `
  <text x="${margins.left + (element.x || 0)}" y="${margins.top + (element.y || 0)}" 
        font-size="${element.fontSize || styling.bodySize}pt" 
        font-weight="${element.fontWeight || 'normal'}"
        fill="${element.fill || '#000000'}"
        text-anchor="${element.textAnchor || 'start'}">
    ${escapeXml(element.content)}
  </text>`;
      break;
    case 'rect':
      content += `
  <rect x="${margins.left + (element.x || 0)}" y="${margins.top + (element.y || 0)}" 
        width="${element.width}" height="${element.height}"
        stroke="${element.stroke || styling.accentColor}" 
        fill="${element.fill || 'none'}" 
        stroke-width="0.5"/>`;
      break;
    case 'line':
      content += `
  <line x1="${margins.left + (element.x || 0)}" y1="${margins.top + (element.y || 0)}" 
        x2="${margins.left + (element.x || 0) + (element.width || 0)}" 
        y2="${margins.top + (element.y || 0) + (element.height || 0)}"
        stroke="${element.stroke || styling.accentColor}" 
        stroke-width="0.5"/>`;
      break;
  }
  
  return content;
}

function generateWeeklyPlanner(margins: any, contentWidth: number, contentHeight: number, spacing: any, styling: any): string {
  let content = '';
  
  // Header
  const headerHeight = 15;
  content += `
  <text x="${margins.left}" y="${margins.top - 5}" 
        font-size="18pt" font-weight="700" fill="#000000">
    Weekly Planner
  </text>
  <text x="${margins.left}" y="${margins.top + 8}" 
        font-size="10pt" fill="#666666">
    Week of: _______________
  </text>`;
  
  // Calculate column dimensions
  const numColumns = 7;
  const totalGaps = (numColumns - 1) * spacing.columnGap;
  const columnWidth = (contentWidth - totalGaps) / numColumns;
  const columnHeight = contentHeight - headerHeight - spacing.sectionGap;
  const startY = margins.top + headerHeight + spacing.sectionGap;
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Draw day columns
  for (let i = 0; i < numColumns; i++) {
    const x = margins.left + (i * (columnWidth + spacing.columnGap));
    
    // Column border
    content += `
  <rect x="${x}" y="${startY}" 
        width="${columnWidth}" height="${columnHeight}"
        stroke="${styling.accentColor}" fill="none" stroke-width="1"/>`;
    
    // Day name header
    content += `
  <rect x="${x}" y="${startY}" 
        width="${columnWidth}" height="12"
        fill="${styling.accentColor}" fill-opacity="0.1"/>
  <text x="${x + columnWidth / 2}" y="${startY + 8}" 
        font-size="9pt" font-weight="600" 
        fill="${styling.accentColor}"
        text-anchor="middle">
    ${days[i]}
  </text>`;
    
    // Date placeholder
    content += `
  <text x="${x + 3}" y="${startY + 20}" 
        font-size="8pt" fill="#999999">
    __/__
  </text>`;
    
    // Task lines
    const lineStartY = startY + 25;
    const lineSpacing = 6;
    const numLines = Math.floor((columnHeight - 30) / lineSpacing);
    
    for (let j = 0; j < numLines; j++) {
      const lineY = lineStartY + (j * lineSpacing);
      content += `
  <line x1="${x + 2}" y1="${lineY}" 
        x2="${x + columnWidth - 2}" y2="${lineY}"
        stroke="#E0E0E0" stroke-width="0.5"/>`;
    }
  }
  
  return content;
}

function generateMonthlyCalendar(margins: any, contentWidth: number, contentHeight: number, spacing: any, styling: any): string {
  let content = '';
  
  // Header
  content += `
  <text x="${margins.left}" y="${margins.top - 5}" 
        font-size="20pt" font-weight="700" fill="#000000">
    _____________ 20___
  </text>`;
  
  const startY = margins.top + 10;
  const numColumns = 7;
  const numRows = 6;
  const totalColGaps = (numColumns - 1) * spacing.columnGap;
  const totalRowGaps = (numRows - 1) * spacing.rowGap;
  const cellWidth = (contentWidth - totalColGaps) / numColumns;
  const cellHeight = (contentHeight - 20 - totalRowGaps) / numRows;
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Day headers
  for (let i = 0; i < numColumns; i++) {
    const x = margins.left + (i * (cellWidth + spacing.columnGap));
    content += `
  <rect x="${x}" y="${startY}" 
        width="${cellWidth}" height="10"
        fill="${styling.accentColor}" fill-opacity="0.15"/>
  <text x="${x + cellWidth / 2}" y="${startY + 7}" 
        font-size="8pt" font-weight="600" 
        fill="${styling.accentColor}"
        text-anchor="middle">
    ${days[i]}
  </text>`;
  }
  
  // Calendar grid
  const gridStartY = startY + 12;
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numColumns; col++) {
      const x = margins.left + (col * (cellWidth + spacing.columnGap));
      const y = gridStartY + (row * (cellHeight + spacing.rowGap));
      
      content += `
  <rect x="${x}" y="${y}" 
        width="${cellWidth}" height="${cellHeight}"
        stroke="#CCCCCC" fill="none" stroke-width="0.5"/>
  <text x="${x + 3}" y="${y + 8}" 
        font-size="9pt" font-weight="500" fill="#333333">
    ${row * 7 + col + 1}
  </text>`;
    }
  }
  
  return content;
}

function generateDailySchedule(margins: any, contentWidth: number, contentHeight: number, spacing: any, styling: any): string {
  let content = '';
  
  // Header
  content += `
  <text x="${margins.left}" y="${margins.top - 5}" 
        font-size="18pt" font-weight="700" fill="#000000">
    Daily Schedule
  </text>
  <text x="${margins.left}" y="${margins.top + 8}" 
        font-size="10pt" fill="#666666">
    Date: _______________
  </text>`;
  
  const startY = margins.top + 18;
  const timeColumnWidth = 25;
  const taskColumnWidth = contentWidth - timeColumnWidth - 5;
  const rowHeight = 12;
  
  // Time slots from 6 AM to 10 PM
  const hours = [];
  for (let h = 6; h <= 22; h++) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h;
    hours.push(`${displayHour}:00 ${period}`);
    hours.push(`${displayHour}:30 ${period}`);
  }
  
  hours.forEach((time, index) => {
    const y = startY + (index * rowHeight);
    
    // Time label
    content += `
  <text x="${margins.left}" y="${y + 8}" 
        font-size="7pt" fill="#666666">
    ${time}
  </text>`;
    
    // Task line
    content += `
  <line x1="${margins.left + timeColumnWidth}" y1="${y + 4}" 
        x2="${margins.left + contentWidth}" y2="${y + 4}"
        stroke="#E0E0E0" stroke-width="0.5"/>`;
  });
  
  return content;
}

function generateHabitTracker(margins: any, contentWidth: number, contentHeight: number, spacing: any, styling: any): string {
  let content = '';
  
  // Header
  content += `
  <text x="${margins.left}" y="${margins.top - 5}" 
        font-size="18pt" font-weight="700" fill="#000000">
    30-Day Habit Tracker
  </text>
  <text x="${margins.left}" y="${margins.top + 8}" 
        font-size="10pt" fill="#666666">
    Month: _______________
  </text>`;
  
  const startY = margins.top + 18;
  const numDays = 30;
  const numHabits = 10;
  const habitLabelWidth = 50;
  const cellSize = Math.min(
    (contentWidth - habitLabelWidth) / numDays,
    (contentHeight - 20) / numHabits
  ) - 1;
  
  // Day numbers header
  for (let day = 1; day <= numDays; day++) {
    const x = margins.left + habitLabelWidth + ((day - 1) * (cellSize + 1));
    content += `
  <text x="${x + cellSize / 2}" y="${startY - 2}" 
        font-size="6pt" fill="#666666" text-anchor="middle">
    ${day}
  </text>`;
  }
  
  // Habit rows
  for (let habit = 0; habit < numHabits; habit++) {
    const y = startY + (habit * (cellSize + 1));
    
    // Habit label
    content += `
  <text x="${margins.left}" y="${y + cellSize / 2 + 2}" 
        font-size="7pt" fill="#333333">
    Habit ${habit + 1}
  </text>`;
    
    // Day checkboxes
    for (let day = 0; day < numDays; day++) {
      const x = margins.left + habitLabelWidth + (day * (cellSize + 1));
      content += `
  <rect x="${x}" y="${y}" 
        width="${cellSize}" height="${cellSize}"
        stroke="${styling.accentColor}" fill="none" stroke-width="0.5"/>`;
    }
  }
  
  return content;
}

function generateMealPlanner(margins: any, contentWidth: number, contentHeight: number, spacing: any, styling: any): string {
  let content = '';
  
  // Header
  content += `
  <text x="${margins.left}" y="${margins.top - 5}" 
        font-size="18pt" font-weight="700" fill="#000000">
    Weekly Meal Planner
  </text>
  <text x="${margins.left}" y="${margins.top + 8}" 
        font-size="10pt" fill="#666666">
    Week of: _______________
  </text>`;
  
  const startY = margins.top + 18;
  const numColumns = 7;
  const numRows = 4; // Breakfast, Lunch, Dinner, Snacks
  const totalColGaps = (numColumns - 1) * spacing.columnGap;
  const totalRowGaps = (numRows - 1) * spacing.rowGap;
  const columnWidth = (contentWidth - totalColGaps) / numColumns;
  const rowHeight = (contentHeight - 30 - totalRowGaps) / numRows;
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  
  // Day headers
  for (let i = 0; i < numColumns; i++) {
    const x = margins.left + (i * (columnWidth + spacing.columnGap));
    content += `
  <rect x="${x}" y="${startY}" 
        width="${columnWidth}" height="10"
        fill="${styling.accentColor}" fill-opacity="0.15"/>
  <text x="${x + columnWidth / 2}" y="${startY + 7}" 
        font-size="8pt" font-weight="600" 
        fill="${styling.accentColor}"
        text-anchor="middle">
    ${days[i]}
  </text>`;
  }
  
  // Meal grid
  const gridStartY = startY + 12;
  for (let row = 0; row < numRows; row++) {
    // Meal label
    content += `
  <text x="${margins.left - 3}" y="${gridStartY + (row * (rowHeight + spacing.rowGap)) + 15}" 
        font-size="7pt" font-weight="600" 
        fill="#666666" text-anchor="end">
    ${meals[row]}
  </text>`;
    
    for (let col = 0; col < numColumns; col++) {
      const x = margins.left + (col * (columnWidth + spacing.columnGap));
      const y = gridStartY + (row * (rowHeight + spacing.rowGap));
      
      content += `
  <rect x="${x}" y="${y}" 
        width="${columnWidth}" height="${rowHeight}"
        stroke="#CCCCCC" fill="none" stroke-width="0.5"/>`;
    }
  }
  
  return content;
}

function getPaperDimensions(paperSize: string, orientation: string): { width: number; height: number } {
  const sizes: Record<string, { width: number; height: number }> = {
    'a4': { width: 210, height: 297 },
    'letter': { width: 216, height: 279 },
    'a5': { width: 148, height: 210 }
  };

  let dims = sizes[paperSize.toLowerCase()] || sizes['a4'];
  
  if (orientation === 'landscape') {
    return { width: dims.height, height: dims.width };
  }
  
  return dims;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
