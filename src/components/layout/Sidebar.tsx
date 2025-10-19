import { NavLink } from 'react-router-dom';
import {
  Search,
  FileText,
  Table,
  Megaphone,
  Shirt,
  Gift,
  Palette,
  Package,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  name: string;
  icon: LucideIcon;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'finder', name: 'Product Finder', icon: Search, path: '/' },
  { id: 'spec-writer', name: 'Spec Writer', icon: FileText, path: '/spec-writer' },
  { id: 'bulk-csv', name: 'Bulk CSV', icon: Table, path: '/bulk-csv' },
  { id: 'listing-kit', name: 'Listing Kit', icon: Megaphone, path: '/listing-kit' },
  { id: 'pod-briefs', name: 'POD Briefs', icon: Shirt, path: '/pod-briefs' },
  { id: 'lead-magnet', name: 'Lead Magnet', icon: Gift, path: '/lead-magnet' },
  { id: 'brand-kit', name: 'Brand Kit', icon: Palette, path: '/brand-kit' },
  { id: 'delivery-pack', name: 'Delivery Pack', icon: Package, path: '/delivery-pack' }
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-border bg-sidebar">
      <nav className="flex-1 space-y-1 p-4">
        <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
          Generators
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/80'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent p-4">
          <p className="text-xs font-medium text-sidebar-accent-foreground mb-1">
            💡 Pro Tip
          </p>
          <p className="text-xs text-sidebar-accent-foreground/80">
            All generators use realistic mock data. Perfect for testing workflows!
          </p>
        </div>
      </div>
    </aside>
  );
}
