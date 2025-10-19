import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import Index from "./pages/Index";
import TemplateGenerator from "./pages/TemplateGenerator";
import BulkCsv from "./pages/BulkCsv";
import ListingKit from "./pages/ListingKit";
import PodBriefs from "./pages/PodBriefs";
import LeadMagnet from "./pages/LeadMagnet";
import BrandKit from "./pages/BrandKit";
import DeliveryPack from "./pages/DeliveryPack";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/template-generator" element={<TemplateGenerator />} />
            <Route path="/bulk-csv" element={<BulkCsv />} />
            <Route path="/listing-kit" element={<ListingKit />} />
            <Route path="/pod-briefs" element={<PodBriefs />} />
            <Route path="/lead-magnet" element={<LeadMagnet />} />
            <Route path="/brand-kit" element={<BrandKit />} />
            <Route path="/delivery-pack" element={<DeliveryPack />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
