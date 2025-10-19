import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { LayoutTemplate, Sparkles, Download } from 'lucide-react';
import { generateTemplate, downloadFile, presetTemplates, TemplateSettings, GeneratedTemplate } from '@/utils/templateApi';

const colorOptions = [
  { value: '#3b82f6', label: 'Blue', class: 'bg-blue-500' },
  { value: '#10b981', label: 'Green', class: 'bg-green-500' },
  { value: '#8b5cf6', label: 'Purple', class: 'bg-purple-500' },
  { value: '#ec4899', label: 'Pink', class: 'bg-pink-500' },
  { value: '#f59e0b', label: 'Amber', class: 'bg-amber-500' }
];

export function TemplateGeneratorModule() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [preset, setPreset] = useState('');
  const [settings, setSettings] = useState<TemplateSettings>({
    paperSize: 'a4',
    orientation: 'portrait',
    accentColor: '#3b82f6',
    font: 'inter',
    dpi: 300
  });
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    if (value && presetTemplates[value as keyof typeof presetTemplates]) {
      const preset = presetTemplates[value as keyof typeof presetTemplates];
      setPrompt(preset.prompt);
      setSettings(preset.settings);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe the template you want to generate",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateTemplate(prompt, settings);
      setGeneratedTemplate(result);
      toast({
        title: "Template generated!",
        description: "Your template is ready for download"
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (format: 'pdf' | 'png' | 'svg') => {
    if (generatedTemplate) {
      downloadFile(generatedTemplate.templateId, format);
      toast({
        title: "Download started",
        description: `Downloading ${format.toUpperCase()} file...`
      });
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Template Generator</h1>
        <p className="text-muted-foreground">
          Create print-ready planners, calendars, and organizers through natural language prompts
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Input Panel - Left */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-primary" />
              Template Generator
            </CardTitle>
            <CardDescription>
              Describe your ideal planner or calendar in plain English
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="template-prompt">Template Description</Label>
              <Textarea
                id="template-prompt"
                placeholder="e.g., A4 weekly planner with Monday start, 7 columns for days, notes section on right, minimalist style with blue accents"
                rows={5}
                maxLength={500}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {prompt.length}/500
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a preset..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly-planner">Weekly Planner</SelectItem>
                  <SelectItem value="monthly-calendar">Monthly Calendar</SelectItem>
                  <SelectItem value="daily-schedule">Daily Schedule</SelectItem>
                  <SelectItem value="habit-tracker">Habit Tracker</SelectItem>
                  <SelectItem value="meal-planner">Meal Planner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              className="w-full"
              disabled={isGenerating || !prompt.trim()}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Template'}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Panel - Center */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
            <CardDescription>AI-generated layout preview</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <LoadingSpinner message="Generating your template..." />
            ) : generatedTemplate ? (
              <div className="space-y-4">
                {/* Preview Image */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <img 
                    src={generatedTemplate.previewUrl} 
                    alt="Template preview"
                    className="w-full h-auto rounded-md shadow-sm"
                  />
                </div>
                
                {/* Template Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">{generatedTemplate.pageSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orientation:</span>
                    <span className="font-medium">{generatedTemplate.orientation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Style:</span>
                    <span className="font-medium">{generatedTemplate.style}</span>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleDownload('pdf')} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('png')} className="flex-1">
                    PNG
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('svg')} className="flex-1">
                    SVG
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <LayoutTemplate className="w-16 h-16 mb-4 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Describe your template and click Generate
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Panel - Right */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Template Settings</CardTitle>
            <CardDescription>Customize your template output</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Paper Size */}
            <div className="space-y-2">
              <Label>Paper Size</Label>
              <Select 
                value={settings.paperSize} 
                onValueChange={(value) => setSettings({...settings, paperSize: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                  <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                  <SelectItem value="a5">A5 (148 × 210 mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <Label>Orientation</Label>
              <Select 
                value={settings.orientation} 
                onValueChange={(value) => setSettings({...settings, orientation: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color Scheme */}
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <Button
                    key={color.value}
                    size="sm"
                    variant={settings.accentColor === color.value ? "default" : "outline"}
                    className={`w-10 h-10 p-0 ${color.class}`}
                    onClick={() => setSettings({...settings, accentColor: color.value})}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Font */}
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select 
                value={settings.font} 
                onValueChange={(value) => setSettings({...settings, font: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="plex">IBM Plex Sans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quality */}
            <div className="space-y-2">
              <Label>Export Quality</Label>
              <Select 
                value={settings.dpi.toString()} 
                onValueChange={(value) => setSettings({...settings, dpi: parseInt(value) as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="72">72 DPI (Screen)</SelectItem>
                  <SelectItem value="150">150 DPI (Standard Print)</SelectItem>
                  <SelectItem value="300">300 DPI (High Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
