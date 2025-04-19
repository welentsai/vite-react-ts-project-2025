import React, { useState } from 'react';

// Icons (you can replace these with your preferred icon library)
const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Dashboard icon
const DashboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

// Users icon
const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

// Settings icon
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// Analytics icon
const AnalyticsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

// Interface for the menu items
interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  path: string;
}

// Sample menu items
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'users',
    title: 'Users',
    icon: <UsersIcon />,
    path: '/users',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: <AnalyticsIcon />,
    path: '/analytics',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
  },
];

export type SidebarProps = object;

export const Sidebar: React.FC<SidebarProps> = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');

  // Toggle sidebar expansion
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle menu item click
  const handleMenuItemClick = (id: string) => {
    setActiveItem(id);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div
        className={`bg-gray-800 text-white transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-20'
        } flex h-full flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          {isExpanded ? (
            <h1 className="text-xl font-bold">My App</h1>
          ) : (
            <div className="flex w-full justify-center">
              <MenuIcon />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1 hover:bg-gray-700 focus:outline-none"
          >
            {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <ul>
            {menuItems.map(item => (
              <li key={item.id} className="mb-2 px-2">
                <button
                  onClick={() => handleMenuItemClick(item.id)}
                  className={`flex w-full items-center rounded-md p-2 transition-colors ${
                    activeItem === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {isExpanded && (
                    <span className="ml-3 transition-opacity duration-300">{item.title}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-semibold text-white">
              U
            </div>
            {isExpanded && (
              <div className="ml-3 transition-opacity duration-300">
                <p className="text-sm font-medium">User Name</p>
                <p className="text-xs text-gray-400">user@example.com</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 bg-gray-100 p-8">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">
          {menuItems.find(item => item.id === activeItem)?.title}
        </h1>
        <p className="text-gray-600">This is the main content area. Your page content goes here.</p>
      </div>
    </div>
  );
};
