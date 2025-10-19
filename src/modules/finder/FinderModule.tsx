import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { simulateGeneration } from '@/utils/mockData';
import { Sparkles, Copy, TrendingUp, DollarSign, Tag, Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function FinderModule() {
  const [formData, setFormData] = useState({
    audience: '',
    platform: '',
    keywords: '',
    priceMin: '1',
    priceMax: '500'
  });
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await simulateGeneration('finder', formData);
      setOutput(result);
      toast.success('Product opportunity discovered! 🎉');
    } catch (error) {
      toast.error('Oops! Something went wrong. Let\'s try that again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    toast.success('Copied to clipboard ✅');
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Product Finder</h1>
        <p className="text-muted-foreground">Discover profitable digital product opportunities based on market research</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <Card className="shadow-elevated animate-slide-in">
          <CardHeader>
            <CardTitle>Research Parameters</CardTitle>
            <CardDescription>Tell us about your target market</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Textarea
                id="audience"
                placeholder="e.g., Busy professionals who want to stay organized..."
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{formData.audience.length}/200 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="etsy">Etsy</SelectItem>
                  <SelectItem value="gumroad">Gumroad</SelectItem>
                  <SelectItem value="custom">Custom Website</SelectItem>
                  <SelectItem value="all">All Platforms</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (comma separated)</Label>
              <Input
                id="keywords"
                placeholder="planner, productivity, digital download"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceMin">Min Price ($)</Label>
                <Input
                  id="priceMin"
                  type="number"
                  value={formData.priceMin}
                  onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMax">Max Price ($)</Label>
                <Input
                  id="priceMax"
                  type="number"
                  value={formData.priceMax}
                  onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !formData.audience}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing market...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Discover Opportunities
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card className="shadow-elevated animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Market Analysis</CardTitle>
                <CardDescription>AI-generated insights</CardDescription>
              </div>
              {output && (
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner message="Researching market opportunities..." />
            ) : output ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold">Use Case</h3>
                  </div>
                  <p className="text-sm text-foreground/90">{output.useCase}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <h3 className="font-semibold">Market Opportunity</h3>
                  </div>
                  <p className="text-sm text-foreground/90">{output.marketOpportunity}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-warning" />
                    <h3 className="font-semibold">Suggested Pricing</h3>
                  </div>
                  <p className="text-sm text-foreground/90">{output.suggestedPricing}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold">Content Pillars</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {output.contentPillars.map((pillar: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">SEO Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {output.seoKeywords.map((keyword: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Mockup Styles</h3>
                  <p className="text-sm text-foreground/90">{output.mockupStyles.join(', ')}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Ready to discover your next product idea?
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Fill in the form and click Generate
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
