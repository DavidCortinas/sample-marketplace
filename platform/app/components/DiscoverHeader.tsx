import { useState, useRef } from 'react';
import { Link, useNavigate, Form, useLoaderData } from "@remix-run/react";
import { Tooltip } from './Tooltip';
import type { User } from "../types/user";
import { ThemeToggle } from './ThemeToggle';

export default function DiscoverHeader({ user }: { user: User | null }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  console.log('discover header user', user)

  const { accessToken } = useLoaderData<{ accessToken: string }>();
  console.log('discover header accessToken', accessToken)

  const { refreshToken } = useLoaderData<{ refreshToken: string }>();
  console.log('discover header refreshToken', refreshToken)

  const isAuthenticated = user && user.data;
  console.log('discover header isAuthenticated', isAuthenticated)

  const handleImageError = () => {
    setImageError(true);
  };

  const handleSignInOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isAuthenticated) {
      console.log("Attempting to sign out with refresh token:", refreshToken);
      e.preventDefault();
      e.currentTarget.form?.submit();
    } else {
      navigate('/login');
    }
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-header-bg border-b border-header-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <img
              src="/images/audafact-temp.png"
              alt="AUDAFACT"
              width={48}
              height={48}
              className="mr-2"
            />
            <h1 className="text-[20px] font-bold mr-4 text-header-text">
              AUDAFACT <span className="text-[16px] font-normal text-header-secondary">DIGGER</span>
            </h1>
          </div>
          <div className="flex items-center">
            <nav className="hidden md:flex space-x-4">
              <Link to="/discover/new" className="text-header-link hover:text-header-link-hover">New Releases</Link>
              <Link to="/discover/trending" className="text-header-link hover:text-header-link-hover">Trending</Link>
              <Link to="/discover/genres" className="text-header-link hover:text-header-link-hover">Genres</Link>
            </nav>
            <div className="ml-4 relative flex-shrink-0">
              <button
                ref={avatarButtonRef}
                className="bg-header-button rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-button-primary"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                onMouseEnter={() => setIsTooltipVisible(true)}
                onMouseLeave={() => setIsTooltipVisible(false)}
              >
                <span className="sr-only">Open user menu</span>
                {!imageError ? (
                  <div className="h-8 w-8 rounded-full bg-header-button flex items-center justify-center text-header-secondary">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                ) : (
                  <img 
                    className="h-8 w-8 rounded-full" 
                    src={""} 
                    alt="User avatar" 
                    onError={handleImageError}
                  />
                )}
              </button>
              {isTooltipVisible && (
                <Tooltip 
                  text="Click to open user menu"
                  targetRect={avatarButtonRef.current?.getBoundingClientRect() || null}
                  position="bottom"
                />
              )}
              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-header-bg ring-1 ring-black ring-opacity-5 z-50">
                  {isAuthenticated && (
                    <>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-header-text hover:bg-header-button-hover">Your Profile</Link>
                      <Link to="/settings" className="block px-4 py-2 text-sm text-header-text hover:bg-header-button-hover">Settings</Link>
                      <Form method="post" action="/api/auth/logout">
                        <input type="hidden" name="accessToken" value={accessToken} />
                        <input type="hidden" name="refreshToken" value={refreshToken} />
                        <button 
                          type="submit"
                          className="block w-full text-left px-4 py-2 text-sm text-header-text hover:bg-header-button-hover"
                          onClick={(e) => {
                            console.log("Sign Out button clicked");
                            handleSignInOut(e);
                          }}
                        >
                          Sign Out
                        </button>
                      </Form>
                    </>
                  )}
                  {!isAuthenticated && (
                    <button 
                      onClick={handleSignInOut}
                      className="block w-full text-left px-4 py-2 text-sm text-header-text hover:bg-header-button-hover"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              )}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
