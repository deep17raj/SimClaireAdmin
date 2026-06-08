"use client";

import React, { useState } from "react";
import Link from "next/link"; 
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
    Search, Users, ArrowLeft, Building2, 
    ChevronDown, ChevronUp, AlertCircle, ShoppingCart, Calendar, Phone, Mail, Smartphone,FileText
} from "lucide-react";

export default function AdminPartnerCustomerSearch() {
    const params = useParams();
    const router = useRouter();
    const partnerAccessId = params.id; // Extract dynamic ID from the route

    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState([]);
    const [partnerInfo, setPartnerInfo] = useState(null);
    
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState("");
    
    // Tracks which customer row is expanded to show orders
    const [expandedCustomerId, setExpandedCustomerId] = useState(null);

    // --- Helper Formatters ---
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    const formatCurrency = (amount, currency = 'CAD') => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        if (!status) return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">N/A</span>;
        const s = status.toUpperCase();
        if (s === "ACTIVE" || s === "PAID" || s === "COMPLETED") return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider">{s}</span>;
        if (s === "SUSPENDED" || s === "FAILED" || s === "ERROR") return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider">{s}</span>;
        if (s === "INITIATED" || s === "PENDING") return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider">{s}</span>;
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider">{s}</span>;
    };

    // --- API Fetcher ---
    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!searchQuery.trim()) {
            setError("Please enter a name, email, or phone number to search.");
            return;
        }

        setLoading(true);
        setError("");
        setHasSearched(false);
        setExpandedCustomerId(null); // Reset expansions

        try {
            const adminToken = localStorage.getItem("adminToken");
            
            if (!adminToken) {
                router.push("/admin/login");
                return;
            }

            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/partners/${partnerAccessId}/customers/search?q=${encodeURIComponent(searchQuery)}`, 
                {
                    headers: { Authorization: `Bearer ${adminToken}` }
                }
            );
            console.log(res.data.data)
            if (res.data.status === 200 || res.status === 200) {
                setResults(res.data.data.results || []);
                setPartnerInfo(res.data.data.partner || null);
                setHasSearched(true);
            }
        } catch (err) {
            console.error("Search error:", err);
            setError(err.response?.data?.message || "Failed to perform search. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (customerId) => {
        setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
    };

    return (
        <div className="min-h-screen bg-[#fafafa] p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                
                {/* Header Section */}
                <div className="mb-8">
                    <button 
                        onClick={() => router.back()} 
                        className="flex items-center gap-1 text-slate-500 hover:text-[#ec5b13] font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Partner Details
                    </button>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
    <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Users className="text-[#ec5b13]" size={28} /> 
            Customer Search
        </h1>
        
        {/* 🌟 New Button to check profile details */}
        <Link 
            href={`/admin/partners/${partnerAccessId}/profile`}
            className="inline-flex items-center gap-1.5 bg-orange-50 text-[#ec5b13] px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors border border-orange-100 shadow-sm"
        >
            <FileText size={16} />
            Check Profile Details
        </Link>
    </div>
    <p className="text-slate-500 mt-1.5">Look up end-customers associated with this partner.</p>
</div>

                        {/* Partner Context Badge (Appears after first search) */}
                        {partnerInfo && (
                            <div className="bg-white border border-slate-200 shadow-sm p-3 rounded-xl flex items-center gap-3 animate-in fade-in">
                                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-[#ec5b13] shrink-0">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Partner Context</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="font-extrabold text-slate-800">{partnerInfo.partner_name}</p>
                                        {getStatusBadge(partnerInfo.status)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text"
                                placeholder="Search by name, email, or phone number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20 transition-all"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading || !searchQuery.trim()}
                            className="px-8 py-3.5 bg-[#ec5b13] text-white rounded-xl font-bold hover:bg-[#d94a0e] disabled:opacity-50 transition-colors shadow-sm shrink-0 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "Search Customers"
                            )}
                        </button>
                    </form>
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100 animate-in fade-in">
                            <AlertCircle size={16} className="shrink-0" /> {error}
                        </div>
                    )}
                </div>

                {/* Results Area */}
                {hasSearched && !loading && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Search Results</h3>
                            <span className="text-xs font-bold bg-orange-100 text-[#ec5b13] px-3 py-1 rounded-full">
                                {results.length} found
                            </span>
                        </div>

                        {results.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">No customers found</h3>
                                <p className="text-slate-500 text-sm">We couldn't find any matching customers for "{searchQuery}".</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                                    <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 pl-6">Customer Details</th>
                                            <th className="p-4">Contact Info</th>
                                            <th className="p-4">Joined Date</th>
                                            <th className="p-4 text-center">Total Orders</th>
                                            <th className="p-4 text-right pr-6">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {results.map((item) => {
                                            const cust = item.customer;
                                            const orders = item.orders || [];
                                            const isExpanded = expandedCustomerId === cust.id;

                                            return (
                                                <React.Fragment key={cust.id}>
                                                    {/* Main Row */}
                                                    <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                                                        <td className="p-4 pl-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-[#ec5b13]/10 text-[#ec5b13] flex items-center justify-center font-bold shrink-0">
                                                                    {cust.full_name?.charAt(0)?.toUpperCase() || "?"}
                                                                </div>
                                                                <div>
                                                                    <p className="font-extrabold text-slate-900">{cust.full_name}</p>
                                                                    <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {cust.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm">
                                                            <div className="flex flex-col gap-1.5">
                                                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                                    <Mail size={14} className="text-slate-400"/> {cust.email}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                                    <Phone size={14} className="text-slate-400"/> {cust.phone || "N/A"}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                                                <Calendar size={14} className="text-slate-400" />
                                                                {formatDate(cust.created_at)}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-700 font-bold text-sm">
                                                                {orders.length}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right pr-6">
                                                            <button 
                                                                onClick={() => toggleRow(cust.id)}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 hover:text-[#ec5b13] transition-colors shadow-sm text-sm"
                                                            >
                                                                {isExpanded ? "Hide Orders" : "View Orders"}
                                                                {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Orders Details (Cards Layout) */}
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan="5" className="p-0 border-b border-slate-100 bg-slate-50/50">
                                                                <div className="px-6 py-6 pl-6 md:pl-20 animate-in slide-in-from-top-2 duration-200 bg-gradient-to-b from-slate-50/80 to-transparent">
                                                                    
                                                                    <div className="flex items-center gap-2 mb-4">
                                                                        <ShoppingCart size={16} className="text-slate-400"/>
                                                                        <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                                                                            Order History
                                                                        </h4>
                                                                    </div>
                                                                    
                                                                    {orders.length === 0 ? (
                                                                        <p className="text-sm text-slate-500 italic bg-white p-4 rounded-xl border border-slate-200 inline-block">No orders found for this customer.</p>
                                                                    ) : (
                                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                                            {orders.map(order => (
                                                                                <div key={order.order_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                                                                    
                                                                                    {/* Card Header */}
                                                                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4 pb-4 border-b border-slate-100">
                                                                                        <div>
                                                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order #{order.order_id}</p>
                                                                                            <p className="font-extrabold text-slate-900 text-xl">{formatCurrency(order.final_price, order.currency)}</p>
                                                                                        </div>
                                                                                        <div className="flex flex-col items-end gap-2">
                                                                                            {getStatusBadge(order.order_status)}
                                                                                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                                                                <Calendar size={12}/> {formatDate(order.created_at)}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Order Details Grid */}
                                                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 text-sm mb-5">
                                                                                        <div className="sm:col-span-2 border-r border-slate-100 pr-2">
                                                                                            <p className="text-xs font-semibold text-slate-400 mb-0.5">Package (SIM ID)</p>
                                                                                            <p className="font-bold text-slate-800">{order.sim_id} <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded ml-1 align-middle">Type {order.sim_type}</span></p>
                                                                                        </div>
                                                                                        <div className="sm:col-span-2">
                                                                                            <p className="text-xs font-semibold text-slate-400 mb-0.5">Destination</p>
                                                                                            <p className="font-bold text-slate-800">{order.country_code}</p>
                                                                                        </div>
                                                                                        
                                                                                        <div className="sm:col-span-2 border-r border-slate-100 pr-2">
                                                                                            <p className="text-xs font-semibold text-slate-400 mb-0.5">Base Price</p>
                                                                                            <p className="font-semibold text-slate-700">{formatCurrency(order.base_price, order.currency)}</p>
                                                                                        </div>
                                                                                        <div className="sm:col-span-2">
                                                                                            <p className="text-xs font-semibold text-slate-400 mb-0.5">Multiplier Applied</p>
                                                                                            <p className="font-semibold text-slate-700">
                                                                                                x{order.applied_multiplier} 
                                                                                                <span className="text-xs text-slate-400 ml-1">({order.multiplier_source})</span>
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Provisioning Section Container */}
                                                                                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                                                                                        <div className="flex justify-between items-center mb-3">
                                                                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                                                                <Smartphone size={14} className="text-[#ec5b13]"/> Provisioning
                                                                                            </p>
                                                                                            {getStatusBadge(order.provisioning_status)}
                                                                                        </div>
                                                                                        
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                                                            <div>
                                                                                                <p className="text-slate-400 text-xs font-semibold mb-0.5">ICCID</p>
                                                                                                <p className="font-mono text-xs font-medium text-slate-800 bg-white border border-slate-200 px-2 py-1.5 rounded truncate" title={order.iccid || "Pending"}>
                                                                                                    {order.iccid || "Pending"}
                                                                                                </p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-slate-400 text-xs font-semibold mb-0.5">Activation Code (LPA)</p>
                                                                                                <p className="font-mono text-xs font-medium text-slate-800 bg-white border border-slate-200 px-2 py-1.5 rounded truncate" title={order.activation_code || "Pending"}>
                                                                                                    {order.activation_code || "Pending"}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}