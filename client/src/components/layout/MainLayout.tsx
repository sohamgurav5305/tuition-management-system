import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileBottomNav } from './MobileBottomNav';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Application Header */}
      <Header />

      {/* Full-width Centered Page Viewport without Sidebar */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
        <Breadcrumbs />
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar for rapid thumb access */}
      <MobileBottomNav onToggleMenu={() => {}} isMenuOpen={false} />
    </div>
  );
};
