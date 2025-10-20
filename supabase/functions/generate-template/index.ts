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
  // Calculate dimensions based on paper size and orientation
  const dimensions = getPaperDimensions(settings.paperSize, settings.orientation);
  
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

  // Render all elements
  spec.elements.forEach((element: any) => {
    switch (element.type) {
      case 'text':
        svgContent += `
  <text x="${element.x}" y="${element.y}" 
        font-size="${element.fontSize || spec.styling.bodySize}" 
        font-weight="${element.fontWeight || 'normal'}"
        fill="${element.fill || '#000000'}">
    ${escapeXml(element.content)}
  </text>`;
        break;
      case 'rect':
        svgContent += `
  <rect x="${element.x}" y="${element.y}" 
        width="${element.width}" height="${element.height}"
        stroke="${element.stroke || spec.styling.accentColor}" 
        fill="${element.fill || 'none'}" 
        stroke-width="1"/>`;
        break;
      case 'line':
        svgContent += `
  <line x1="${element.x}" y1="${element.y}" 
        x2="${element.x + (element.width || 0)}" y2="${element.y + (element.height || 0)}"
        stroke="${element.stroke || spec.styling.accentColor}" 
        stroke-width="1"/>`;
        break;
      case 'circle':
        svgContent += `
  <circle cx="${element.x}" cy="${element.y}" 
          r="${element.width || 5}"
          stroke="${element.stroke || spec.styling.accentColor}" 
          fill="${element.fill || 'none'}" 
          stroke-width="1"/>`;
        break;
    }
  });

  svgContent += '\n</svg>';
  return svgContent;
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
