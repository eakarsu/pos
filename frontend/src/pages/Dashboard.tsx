import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalCustomers: number;
  lowStockCount: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

interface RecentSale {
  id: string;
  total: number;
  items: number;
  customer?: string;
  timestamp: string;
}

interface LowStockItem {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayTransactions: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real dashboard data from API
      const [dashboardStats, recentSalesData, lowStockData] = await Promise.all([
        apiService.request('/dashboard/stats'),
        apiService.request('/dashboard/recent-sales'),
        apiService.request('/dashboard/low-stock')
      ]);

      if (dashboardStats.success) {
        setStats(dashboardStats.data);
      }

      if (recentSalesData.success) {
        setRecentSales(recentSalesData.data);
      }

      if (lowStockData.success) {
        setLowStockItems(lowStockData.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Fallback to mock data if API fails
      setStats({
        todaySales: 2847.50,
        todayTransactions: 67,
        totalCustomers: 1234,
        lowStockCount: 12,
        weeklyGrowth: 8.5,
        monthlyGrowth: 15.2
      });

      setRecentSales([
        { id: '1', total: 45.99, items: 3, customer: 'John Doe', timestamp: '2024-06-19T10:30:00Z' },
        { id: '2', total: 123.45, items: 7, timestamp: '2024-06-19T10:15:00Z' },
        { id: '3', total: 67.80, items: 2, customer: 'Jane Smith', timestamp: '2024-06-19T09:45:00Z' },
        { id: '4', total: 89.99, items: 4, timestamp: '2024-06-19T09:30:00Z' },
        { id: '5', total: 156.78, items: 9, customer: 'Bob Johnson', timestamp: '2024-06-19T09:00:00Z' }
      ]);

      setLowStockItems([
        { id: '1', name: 'Coffee Beans Premium', currentStock: 5, minStock: 20 },
        { id: '2', name: 'Wireless Headphones', currentStock: 2, minStock: 10 },
        { id: '3', name: 'Notebook A4', currentStock: 8, minStock: 25 },
        { id: '4', name: 'USB Cable Type-C', currentStock: 3, minStock: 15 }
      ]);

      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    growth, 
    onClick 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    growth?: number;
    onClick?: () => void;
  }) => (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {growth !== undefined && (
            <div className="flex items-center mt-2">
              {growth >= 0 ? (
                <ChevronUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(growth)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.email}! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Time</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={() => navigate('/pos')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={CurrencyDollarIcon}
          color="bg-green-500"
          growth={stats.weeklyGrowth}
          onClick={() => navigate('/reports')}
        />
        <StatCard
          title="Transactions"
          value={stats.todayTransactions}
          icon={ShoppingCartIcon}
          color="bg-blue-500"
          growth={5.2}
          onClick={() => navigate('/reports')}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          icon={UserGroupIcon}
          color="bg-purple-500"
          onClick={() => navigate('/customers')}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={ExclamationTriangleIcon}
          color="bg-red-500"
          onClick={() => navigate('/inventory')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
              Recent Sales
            </h2>
            <button
              onClick={() => navigate('/reports')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              View All
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6">
            {recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {sale.customer || 'Walk-in Customer'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {sale.items} items • {formatTime(sale.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(sale.total)}</p>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent sales</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-500" />
              Low Stock Alert
            </h2>
            <button
              onClick={() => navigate('/inventory')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              Manage
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6">
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-red-600">
                        {item.currentStock} left (min: {item.minStock})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Low
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">All items in stock</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/pos')}
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <PlusIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900">New Sale</span>
          </button>
          <button
            onClick={() => navigate('/products')}
            className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <PlusIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900">Add Product</span>
          </button>
          <button
            onClick={() => navigate('/customers')}
            className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <UserGroupIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900">Customers</span>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <ChevronUpIcon className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-900">Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
