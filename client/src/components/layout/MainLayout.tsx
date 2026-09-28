import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileBottomNav } from './MobileBottomNav';

export const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex transition-colors duration-200">
      {/* Side Navbar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Application Header */}
        <Header onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />

        {/* Page Content Viewport */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar for rapid thumb access */}
      <MobileBottomNav
        onToggleMenu={() => setMobileMenuOpen((prev) => !prev)}
        isMenuOpen={mobileMenuOpen}
      />
    </div>
  );
};
