import React, { useMemo } from 'react';
import { Sale } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Wallet, ShoppingBag } from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ sales }) => {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const dailySales = sales.filter(s => s.timestamp >= today.getTime());
    const monthlySales = sales.filter(s => {
        const d = new Date(s.timestamp);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });

    const calculateTotals = (data: Sale[]) => {
        return data.reduce((acc, curr) => ({
            revenue: acc.revenue + curr.totalAmount,
            cost: acc.cost + curr.totalCost,
            count: acc.count + 1
        }), { revenue: 0, cost: 0, count: 0 });
    };

    const daily = calculateTotals(dailySales);
    const monthly = calculateTotals(monthlySales);
    const total = calculateTotals(sales);

    return { daily, monthly, total };
  }, [sales]);

  // Prepare Chart Data (Last 7 Days)
  const chartData = useMemo(() => {
      const days = [];
      for(let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0,0,0,0);
          
          const label = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric'});
          const nextDay = new Date(d);
          nextDay.setDate(d.getDate() + 1);

          const daySales = sales.filter(s => s.timestamp >= d.getTime() && s.timestamp < nextDay.getTime());
          const revenue = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
          const profit = daySales.reduce((sum, s) => sum + (s.totalAmount - s.totalCost), 0);

          days.push({ name: label, sales: revenue, profit: profit });
      }
      return days;
  }, [sales]);

  const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        <p className={`text-xs mt-1 ${color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'}`}>{sub}</p>
      </div>
      <div className={`p-3 rounded-lg ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-2rem)]">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">ภาพรวมธุรกิจ (Dashboard)</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="ยอดขายวันนี้" 
            value={`฿${stats.daily.revenue.toLocaleString()}`} 
            sub={`${stats.daily.count} ออเดอร์`}
            icon={DollarSign}
            color="emerald"
        />
        <StatCard 
            title="กำไรวันนี้" 
            value={`฿${(stats.daily.revenue - stats.daily.cost).toLocaleString()}`} 
            sub={`Margin: ${stats.daily.revenue ? (((stats.daily.revenue - stats.daily.cost)/stats.daily.revenue)*100).toFixed(1) : 0}%`}
            icon={TrendingUp}
            color="blue"
        />
        <StatCard 
            title="ยอดขายเดือนนี้" 
            value={`฿${stats.monthly.revenue.toLocaleString()}`} 
            sub="สะสมทั้งเดือน"
            icon={Wallet}
            color="purple"
        />
        <StatCard 
            title="ออเดอร์ทั้งหมด" 
            value={stats.total.count} 
            sub="ตลอดการใช้งาน"
            icon={ShoppingBag}
            color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-6">ยอดขาย 7 วันย้อนหลัง</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                        <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `฿${value}`}/>
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: number) => [`฿${value.toLocaleString()}`, 'ยอดขาย']}
                        />
                        <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-6">กำไรสุทธิ (Profit Trend)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                        <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `฿${value}`}/>
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: number) => [`฿${value.toLocaleString()}`, 'กำไร']}
                        />
                        <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;