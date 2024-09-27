import { useState } from 'react';
import { Link, useNavigate } from "@remix-run/react";
import { User } from "../../types/user";
import { useAuthStore } from "../../stores/authStore";

interface AppHeaderProps {
  user: User;
}

export default function AppHeader({ user }: AppHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { clearTokens } = useAuthStore();

  const handleLogout = async () => {
    clearTokens(); // Clear client-side tokens immediately
    navigate('/'); // Navigate to home page
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/images/audafact-temp.png"
              alt="AUDAFACT"
              width={48}
              height={48}
              className="mr-2"
            />
            <h1 className="text-xl font-bold">
              AUDAFACT <span className="text-[16px] font-normal text-gray-500">SELLER DASHBOARD</span>
            </h1>
          </Link>
          </div>
          <div className="flex items-center">
            <nav className="hidden md:flex space-x-4">
              {/* UPDATE HREF */}
              <a href="/" className="text-gray-500 hover:text-gray-700">Upload Artifact</a>
              <a href="/" className="text-gray-500 hover:text-gray-700">Manage Artifacts</a>
              <a href="/" className="text-gray-500 hover:text-gray-700">Sales Overview</a>
            </nav>
            <div className="ml-4 flex items-center">
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="ml-3 relative">
                <div>
                  <button 
                    className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" 
                    id="user-menu" 
                    aria-haspopup="true"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <img className="h-8 w-8 rounded-full" src={user.avatarUrl || "https://via.placeholder.com/40"} alt="" />
                  </button>
                </div>
                {isUserMenuOpen && (
                  <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5" 
                    role="menu" 
                    aria-orientation="vertical" 
                    aria-labelledby="user-menu"
                  >
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Your Profile</Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Settings</Link>
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
