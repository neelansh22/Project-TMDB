'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  BarChart3,
  Map,
  Tags,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  userEmail?: string | null;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      description: 'Overview & KPIs',
    },
    {
      title: 'Conversations',
      icon: MessageSquare,
      href: '/conversations',
      description: 'Call details',
    },
    {
      title: 'Operations',
      icon: Activity,
      href: '/analytics/operations',
      description: 'Transfers & errors',
    },
    {
      title: 'Geography',
      icon: Map,
      href: '/analytics/geography',
      description: 'Location trends',
    },
    {
      title: 'Topics',
      icon: Tags,
      href: '/analytics/topics',
      description: 'Intent breakdown',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 z-50 flex flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Teneo Memory
              </h1>
              <p className="text-xs text-gray-500">Analytics</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* User Info */}
        {!isCollapsed && userEmail && (
          <div className="px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{userEmail.split('@')[0]}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                    active
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.title}</div>
                      {!active && (
                        <div className="text-xs text-gray-500 group-hover:text-gray-400">
                          {item.description}
                        </div>
                      )}
                    </div>
                  )}
                  {active && !isCollapsed && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-gray-800 p-2">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all w-full ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Spacer to prevent content overlap */}
      <div className={`${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 transition-all duration-300`} />
    </>
  );
}
