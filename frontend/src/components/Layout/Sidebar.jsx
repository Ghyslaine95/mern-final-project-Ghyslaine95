import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Plus, 
  List, 
  BarChart3, 
  Settings,
  Leaf 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Add Emission', href: '/add-emission', icon: Plus },
  { name: 'My Emissions', href: '/emissions', icon: List },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Profile', href: '/profile', icon: Settings },
];

const Sidebar = () => {
  return (
    <div className="w-64 bg-green-700 text-white">
      <div className="flex items-center justify-center p-6 border-b border-green-600">
        <Leaf className="h-8 w-8 mr-2" />
        <span className="text-xl font-bold">EcoTrack</span>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-green-100 hover:bg-green-600'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4 border-t border-green-600">
        <div className="text-center text-green-200 text-sm">
          Saving the planet, one emission at a time 🌍
        </div>
      </div>
    </div>
  );
};

export default Sidebar;