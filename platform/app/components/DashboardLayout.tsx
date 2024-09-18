import React, { useState } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { User } from '../types/user';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, user }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans">
      <AppSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1 transition-all duration-300" style={{ marginLeft: isOpen ? '16rem' : '5rem' }}>
        <AppHeader user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-[#f9fafc]">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
