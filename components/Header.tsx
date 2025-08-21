
import React from 'react';
import { TrophyIcon, UserGroupIcon, CogIcon, DatabaseIcon, LogOutIcon, ShieldCheckIcon } from './icons';
import { ViewType, Profile } from '../types';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
  profile: Profile | null;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onLogout, profile }) => {
  const navButtonClasses = (view: ViewType) => 
    `flex items-center justify-center sm:justify-start px-3 py-2 text-sm font-medium rounded-md transition-colors w-full sm:w-auto ${
      currentView === view 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
    }`;
    
  const appName = profile?.app_name || 'Sistem Poin Siswa';
  const logoUrl = profile?.logo_url;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2">
        <div className="flex items-center space-x-3">
          {logoUrl ? (
            <img src={logoUrl} alt="App Logo" className="h-8 w-8 rounded-md object-cover" />
          ) : (
            <TrophyIcon className="h-8 w-8 text-blue-600" />
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate" title={appName}>
            {appName}
          </h1>
        </div>
        <nav className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:space-x-1">
          <button onClick={() => onNavigate('students')} className={navButtonClasses('students')} title="Daftar Siswa">
            <UserGroupIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Daftar Siswa</span>
          </button>
          <button onClick={() => onNavigate('rules')} className={navButtonClasses('rules')} title="Manajemen Peraturan">
            <ShieldCheckIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Peraturan</span>
          </button>
          <button onClick={() => onNavigate('data')} className={navButtonClasses('data')} title="Ekspor/Impor Data">
            <DatabaseIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Data</span>
          </button>
          <button onClick={() => onNavigate('settings')} className={navButtonClasses('settings')} title="Pengaturan Aplikasi">
            <CogIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>
           <button onClick={onLogout} className="flex items-center justify-center sm:justify-start px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-red-100 hover:text-red-700 w-full sm:w-auto" title="Keluar">
            <LogOutIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;