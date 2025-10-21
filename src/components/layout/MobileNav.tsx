import { NavLink } from 'react-router-dom';
import {
  Search,
  LayoutTemplate,
  Table,
  Megaphone,
  Shirt,
  Gift,
  Palette,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'finder', icon: Search, path: '/', label: 'Finder' },
  { id: 'template', icon: LayoutTemplate, path: '/template-generator', label: 'Templates' },
  { id: 'csv', icon: Table, path: '/bulk-csv', label: 'CSV' },
  { id: 'listing', icon: Megaphone, path: '/listing-kit', label: 'Listing' }
];

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors',
                'hover:bg-accent/50',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
