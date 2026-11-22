import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  CreditCard, 
  KeyRound, 
  FileCheck, 
  Gift, 
  Coins,
  Settings, 
  ScrollText, 
  LogOut, 
  Menu, 
  X, 
  Flame,
  ShieldCheck 
} from 'lucide-react';

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Tournaments & Slots', path: '/admin/tournaments', icon: Trophy },
    { name: 'Registrations & Payments', path: '/admin/registrations', icon: CreditCard },
    { name: 'Room Credentials (Email)', path: '/admin/rooms', icon: KeyRound },
    { name: 'Match Result Review', path: '/admin/results', icon: FileCheck },
    { name: 'Cash Prizes & Payouts', path: '/admin/prizes', icon: Gift },
    { name: 'Coin Withdrawals & Wallet', path: '/admin/withdrawals', icon: Coins },
    { name: 'Site Settings', path: '/admin/settings', icon: Settings },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-[#07090D] flex flex-col md:flex-row">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-[#0B0E14] border-b border-[#1F293D] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-brand-orange" />
          <span className="font-display font-bold text-white uppercase tracking-wider">Admin Panel</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-[#161B26] text-slate-300"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#0B0E14] border-r border-[#1F293D] flex flex-col justify-between transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-[#1F293D] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white uppercase tracking-wider">Rahul Esports Admin</h2>
              <p className="text-[10px] text-purple-400 font-semibold uppercase">{user?.role || 'Administrator'}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-purple-950/70 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-[#161B26]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout footer */}
        <div className="p-4 border-t border-[#1F293D] space-y-2">
          <div className="px-2">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Admin Content View */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
}
