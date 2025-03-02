// components/UI/AppBar.js
import React, { useState, useEffect } from 'react';
import { Activity, Plus, Menu, X, Upload, FileText, Bell, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const AppBar = ({ 
  onAddNewEntry, 
  onShowImport, 
  onToggleReport, 
  userName = '' 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // Track scroll position to add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Track online status
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('swOffline', handleOffline);
    
    // Check initial status
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('swOffline', handleOffline);
    };
  }, []);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <>
      {/* Main app bar */}
      <header 
        className={`sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 
                  transition-shadow ${isScrolled ? 'shadow-md' : ''}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & title */}
            <div className="flex items-center">
              <Activity size={24} className="text-blue-600 dark:text-blue-400 mr-2" />
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                Blutdruck-Tracker
              </h1>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <button 
                onClick={onAddNewEntry}
                className="flex items-center px-4 py-2 font-medium text-sm rounded-lg
                          bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <Plus size={16} className="mr-1" />
                Neuer Eintrag
              </button>
              
              <button 
                onClick={onShowImport}
                className="flex items-center px-4 py-2 font-medium text-sm rounded-lg
                          bg-green-600 text-white hover:bg-green-700 transition"
              >
                <Upload size={16} className="mr-1" />
                Import/Export
              </button>
              
              <button 
                onClick={onToggleReport}
                className="flex items-center px-4 py-2 font-medium text-sm rounded-lg
                          bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                          hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                <FileText size={16} className="mr-1" />
                Bericht
              </button>
            </nav>
            
            {/* Right section with theme toggle and mobile menu button */}
            <div className="flex items-center">
              {/* Offline status indicator */}
              {isOffline && (
                <div className="hidden sm:block mr-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300">
                    <span className="w-2 h-2 mr-1 rounded-full bg-yellow-400 animate-pulse"></span>
                    Offline
                  </span>
                </div>
              )}
              
              {/* Theme toggle */}
              <div className="mr-4">
                <ThemeToggle />
              </div>
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                onClick={toggleMobileMenu}
                aria-label="Hauptmenü"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Offline banner for mobile */}
        {isOffline && (
          <div className="sm:hidden bg-yellow-50 dark:bg-yellow-900/30 py-1 px-4">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
              Sie sind offline. Die App funktioniert weiterhin.
            </p>
          </div>
        )}
      </header>
      
      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-gray-800/50 dark:bg-black/50 backdrop-blur-sm pt-16">
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <button 
                onClick={() => {
                  onAddNewEntry();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 font-medium text-sm rounded-lg
                          bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <Plus size={18} className="mr-2" />
                Neuer Eintrag
              </button>
              
              <button 
                onClick={() => {
                  onShowImport();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 font-medium text-sm rounded-lg
                          bg-green-600 text-white hover:bg-green-700 transition"
              >
                <Upload size={18} className="mr-2" />
                Import/Export
              </button>
              
              <button 
                onClick={() => {
                  onToggleReport();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 font-medium text-sm rounded-lg
                          bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                          hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                <FileText size={18} className="mr-2" />
                Ärztlichen Bericht erstellen
              </button>
              
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 font-medium text-sm rounded-lg
                          bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 
                          hover:bg-red-200 dark:hover:bg-red-900/30 transition mt-2"
              >
                <X size={18} className="mr-2" />
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppBar;