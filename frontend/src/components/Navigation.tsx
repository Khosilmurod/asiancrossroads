import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { FaInstagram, FaLinkedin, FaUser } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const SocialIcon = ({ Icon, href }: { Icon: IconType; href: string }) => {
  const IconComponent = Icon as React.ComponentType<{ className: string }>;
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-600 hover:text-gray-900 transition-colors"
    >
      <div className="w-6 h-6 flex items-center justify-center">
        <IconComponent className="w-5 h-5" />
      </div>
    </a>
  );
};

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className="relative text-[15px] text-gray-600 hover:text-gray-900 transition-colors group"
    >
      {children}
      <div className={`absolute bottom-[-2px] ${isActive ? 'w-full left-0' : 'w-0 left-1/2'} h-[2px] bg-gray-900 group-hover:w-full group-hover:left-0 transition-all duration-300`} />
    </Link>
  );
};

export const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-[72px]">
          {/* Left section */}
          <div className="flex items-center space-x-12">
            <Link to="/" className="flex items-center">
              <span className="text-[15px] font-semibold">Asian Crossroads</span>
            </Link>
            <div className="flex items-center space-x-8">
              <NavLink to="/events">Events</NavLink>
              <NavLink to="/articles">Articles</NavLink>
              <NavLink to="/team">Team</NavLink>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-6">
            {user ? (
              <div className="flex items-center space-x-6">
                {(user.role === 'ADMIN' || user.role === 'PRESIDENT' || user.role === 'BOARD') && (
                  <NavLink to="/subscribers">Subscribers</NavLink>
                )}
                {(user.role === 'ADMIN' || user.role === 'PRESIDENT') && (
                  <NavLink to="/emails">Email Approval</NavLink>
                )}
                <NavLink to="/profile">Profile</NavLink>
                <button
                  onClick={() => logout()}
                  className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-4">
                  <SocialIcon Icon={FaInstagram} href="https://instagram.com/asiancrossroads" />
                  <SocialIcon Icon={FaLinkedin} href="https://linkedin.com/company/asiancrossroads" />
                </div>
                <button
                  onClick={() => {
                    if (window.location.pathname !== '/') {
                      window.location.href = '/#mailing-list';
                    } else {
                      document.getElementById('mailing-list')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-[#2563EB] text-white px-5 py-2 rounded-[3px] text-[15px] font-medium hover:bg-[#1d4ed8] transition-colors"
                >
                  Join Mailing List
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}; 