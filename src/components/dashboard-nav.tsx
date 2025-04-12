'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

interface DashboardNavProps {
  className?: string;
  items: NavItem[];
}

export function DashboardNav({ className, items }: DashboardNavProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  return (
    <nav className={cn('flex items-center space-x-1', className)}>
      {items.map((item) => {
        // Skip items that require permissions the user doesn't have
        if (item.permission && !hasPermission(item.permission)) {
          return null;
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
} 