import React from 'react';
import { Sidebar, Sidebar2 } from '../SideBar';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = () => {
  const [currentSection, setCurrentSection] = React.useState('dashboard');

  const handleMenuSelect = (sectionId: string) => {
    setCurrentSection(sectionId);
  };

  // Content components for different sections
  const renderContent = () => {
    return <></>;
    // switch (currentSection) {
    //   case 'dashboard':
    //     return <DashboardContent />;
    //   case 'users':
    //     return <UsersContent />;
    //   case 'analytics':
    //     return <AnalyticsContent />;
    //   case 'settings':
    //     return <SettingsContent />;
    //   default:
    //     return <DashboardContent />;
    // }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <Sidebar2
        activeSection={currentSection}
        onMenuSelect={handleMenuSelect}
      />
      <main className="w-full flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div className="w-full px-6 py-8">{renderContent()}</div>
      </main>
    </div>
  );
};
