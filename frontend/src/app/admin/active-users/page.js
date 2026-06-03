"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
    Users, ShoppingCart, DollarSign, 
    Filter, Calendar, Activity,
    AlertCircle, ChevronLeft, ChevronRight, Clock
} from "lucide-react";

export default function AdminUserHistoryPage() {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // --- Filter States ---
    const [filterType, setFilterType] = useState("monthly"); // 'all', 'daily', 'weekly', 'monthly', 'custom'
    
    // Date Defaults
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentDate = today.toISOString().split('T')[0];
    
    const [month, setMonth] = useState(currentMonth);
    const [date, setDate] = useState(currentDate);
    const [startDate, setStartDate] = useState(currentDate);
    const [endDate, setEndDate] = useState(currentDate);
    
    // Pagination
    const [page, setPage] = useState(1);
    const limit = 50;

    // --- Formatters ---
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString; 
        return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString; 
        return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    // --- API Fetcher ---
    const fetchUserAnalytics = async () => {
        setLoading(true);
        setError("");
        try {
            const adminToken = localStorage.getItem("adminToken");
            
            // Build Query Parameters dynamically
            const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });

            if (filterType === "monthly") {
                params.append("month", month);
            } else if (filterType === "daily") {
                params.append("date", date);
            } else if (filterType === "weekly") {
                params.append("filter", "weekly");
            } else if (filterType === "custom") {
                params.append("start_date", startDate);
                params.append("end_date", endDate);
            }
            // If 'all', we just send page and limit

            const queryUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/active-users?${params.toString()}`;

            const res = await axios.get(queryUrl, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            if (res.data.success || res.data.status === 200 || res.status === 200) {
                setAnalyticsData(res.data.data);
            } else {
                setError(res.data.message || "Failed to load user history.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred while fetching user data.");
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when filters or page change
    useEffect(() => {
        fetchUserAnalytics();
    }, [filterType, month, date, startDate, endDate, page]);

    // Handle filter type change (reset page to 1)
    const handleFilterChange = (newType) => {
        setFilterType(newType);
        setPage(1);
    };

    return (
        <div className="p-4 md:p-8 font-sans bg-gray-50 min-h-screen">
            <div className="max-w-[1400px] mx-auto">
                
                {/* Header & Filters */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                            <Activity className="text-blue-600" size={28} /> User History & Analytics
                        </h1>
                        <p className="text-slate-500 mt-1">Track active customers, purchase history, and aggregate revenue.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                            <Filter size={18} className="text-slate-400 ml-2" />
                            <select 
                                value={filterType} 
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer pr-2"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="custom">Custom Date Range</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>

                        {/* Dynamic Input based on Filter Type */}
                        {filterType === "monthly" && (
                            <input 
                                type="month" 
                                value={month}
                                onChange={(e) => { setMonth(e.target.value); setPage(1); }}
                                className="bg-white border border-gray-200 text-sm font-bold text-blue-600 outline-none cursor-pointer p-2 rounded-xl shadow-sm"
                            />
                        )}

                        {filterType === "daily" && (
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => { setDate(e.target.value); setPage(1); }}
                                className="bg-white border border-gray-200 text-sm font-bold text-blue-600 outline-none cursor-pointer p-2 rounded-xl shadow-sm"
                            />
                        )}

                        {filterType === "custom" && (
                            <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                    className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer p-1"
                                />
                                <span className="text-slate-300 font-bold">to</span>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                    className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer p-1"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-semibold flex items-center gap-2 animate-in fade-in">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">Fetching user data...</p>
                    </div>
                ) : analyticsData ? (
                    <>
                        {/* TOP SUMMARY CARDS (Safely Chained) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                            
                            {/* Total Active Users */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Active Users</p>
                                    <h3 className="text-3xl font-extrabold text-slate-900">
                                        {analyticsData?.summary?.total_active_users || 0}
                                    </h3>
                                </div>
                                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <Users size={28} />
                                </div>
                            </div>

                            {/* Total Orders */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Orders</p>
                                    <h3 className="text-3xl font-extrabold text-slate-900">
                                        {analyticsData?.summary?.total_orders || 0}
                                    </h3>
                                </div>
                                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <ShoppingCart size={28} />
                                </div>
                            </div>

                            {/* Total Revenue */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                                    <h3 className="text-3xl font-extrabold text-emerald-600">
                                        {formatCurrency(analyticsData?.summary?.total_revenue || 0)}
                                    </h3>
                                </div>
                                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <DollarSign size={28} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            
                            {/* LEFT: USER LIST */}
                            <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Users className="text-blue-600" size={18} /> Customer Details
                                    </h3>
                                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                                        Total: {analyticsData?.pagination?.total || 0}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
                                        <thead className="text-xs uppercase text-slate-500 font-bold border-b border-gray-100">
                                            <tr>
                                                <th className="p-4 bg-gray-50/50">User Info</th>
                                                <th className="p-4 bg-gray-50/50 text-center">Orders</th>
                                                <th className="p-4 bg-gray-50/50 text-right">Total Spent</th>
                                                <th className="p-4 bg-gray-50/50 text-right">Joined</th>
                                                <th className="p-4 bg-gray-50/50 text-right">Last Purchase</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm">
                                            {!analyticsData?.users || analyticsData.users.length === 0 ? (
                                                <tr><td colSpan="5" className="py-12 text-center text-slate-400 font-medium">No users found for this period.</td></tr>
                                            ) : (
                                                analyticsData.users.map((user) => (
                                                    <tr key={user.user_id} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                                                                    {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900">{user.full_name || "Unknown User"}</p>
                                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                                    {user.phone && <p className="text-xs text-slate-400">{user.phone}</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="font-bold text-slate-700 bg-gray-100 px-3 py-1 rounded-lg">
                                                                {user.total_orders}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right font-extrabold text-emerald-600 text-base">
                                                            {formatCurrency(user.total_spent)}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <p className="font-medium text-slate-700">{formatDate(user.user_created_at)}</p>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            {user.last_purchase_at ? (
                                                                <>
                                                                    <p className="font-bold text-slate-800">{formatDate(user.last_purchase_at)}</p>
                                                                    <p className="text-xs text-slate-400 flex items-center justify-end gap-1"><Clock size={10}/> {new Date(user.last_purchase_at).toLocaleTimeString("en-US", {hour: '2-digit', minute:'2-digit'})}</p>
                                                                </>
                                                            ) : (
                                                                <span className="text-slate-400 italic">Never</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Pagination Controls */}
                                {analyticsData?.pagination && (
                                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                        <p className="text-sm font-medium text-slate-500">
                                            Page {analyticsData.pagination.page}
                                        </p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                            >
                                                <ChevronLeft size={16}/> Prev
                                            </button>
                                            <button 
                                                onClick={() => setPage(p => p + 1)}
                                                disabled={!analyticsData.pagination.has_more}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                            >
                                                Next <ChevronRight size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: BUCKETS / TIMELINE */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-max">
                                <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Calendar className="text-blue-600" size={18} /> Timeline Buckets
                                    </h3>
                                </div>
                                <div className="overflow-x-auto p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="text-xs uppercase text-slate-400 font-bold border-b border-gray-100">
                                            <tr>
                                                <th className="pb-3 pl-2">Period</th>
                                                <th className="pb-3 text-center" title="Active Users / Orders">Users/Ord.</th>
                                                <th className="pb-3 text-right pr-2">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {!analyticsData?.buckets || analyticsData.buckets.length === 0 ? (
                                                <tr><td colSpan="3" className="py-8 text-center text-slate-400 font-medium">No timeline data.</td></tr>
                                            ) : (
                                                analyticsData.buckets.map((bucket, idx) => (
                                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="py-3 pl-2 font-bold text-slate-700 text-sm whitespace-nowrap">
                                                            {bucket.bucket}
                                                        </td>
                                                        <td className="py-3 text-center text-xs font-semibold text-slate-600">
                                                            <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-1" title="Active Users"><Users size={10} className="inline mr-0.5"/>{bucket.active_users}</span>
                                                            <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded" title="Total Orders"><ShoppingCart size={10} className="inline mr-0.5"/>{bucket.total_orders}</span>
                                                        </td>
                                                        <td className="py-3 text-right pr-2 font-bold text-emerald-600 text-sm">
                                                            {formatCurrency(bucket.total_revenue)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </>
                ) : null}

            </div>
        </div>
    );
}