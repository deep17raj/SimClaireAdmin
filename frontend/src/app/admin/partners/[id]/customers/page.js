"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
    Search, Users, ArrowLeft, Building2, 
    ChevronDown, ChevronUp, AlertCircle, ShoppingCart, 
    Calendar, Phone, Mail, Smartphone, Download, CheckCircle2, XCircle, Clock, Edit2, CreditCard, Tag
} from "lucide-react";
import { jsPDF } from "jspdf";
import QRCodeUtil from "qrcode";

// --- Helper for PDF Image Fetching ---
const getBase64ImageFromUrl = async (imageUrl) => {
    try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Failed to load image for PDF", e);
        return null;
    }
};

export default function AdminPartnerCustomerSearch() {
    const params = useParams();
    const router = useRouter();
    const partnerAccessId = params.id; 

    // Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState([]);
    const [partnerInfo, setPartnerInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState("");
    
    // UI States
    const [expandedCustomerId, setExpandedCustomerId] = useState(null);
    const [isDownloading, setIsDownloading] = useState(null); // Track downloading order_id

    // Edit Failed Order States
    const [editingOrder, setEditingOrder] = useState(null);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [editFormData, setEditFormData] = useState({
        lpa: "", iccid: "", msisdn: "", provider_purchase_id: "", 
        provider_reference: "", provider_amount: "", provider_currency: "USD", provider_txn_time: "", notes: ""
    });

    // --- Helper Formatters ---
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        if (!status) return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">N/A</span>;
        const s = status.toUpperCase();
        if (s === "ACTIVE" || s === "PAID" || s === "COMPLETED" || s === "SUCCESS") return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider flex items-center gap-1 w-max"><CheckCircle2 size={12}/>{s}</span>;
        if (s === "SUSPENDED" || s === "FAILED" || s === "ERROR") return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider flex items-center gap-1 w-max"><XCircle size={12}/>{s}</span>;
        if (s === "INITIATED" || s === "PENDING") return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider flex items-center gap-1 w-max"><Clock size={12}/>{s}</span>;
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider">{s}</span>;
    };

    // --- API Fetchers ---
    const handleSearch = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        
        if (!searchQuery.trim()) {
            setError("Please enter a name, email, or phone number to search.");
            return;
        }

        setLoading(true);
        setError("");
        if (!editingOrder) setExpandedCustomerId(null); 

        try {
            const adminToken = localStorage.getItem("adminToken");
            if (!adminToken) {
                router.push("/admin/login");
                return;
            }

            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/partners/${partnerAccessId}/customers/search?q=${encodeURIComponent(searchQuery)}`, 
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            
            if (res.data.status === 200 || res.status === 200 || res.data.success) {
                setResults(res.data.data.results || []);
                setPartnerInfo(res.data.data.partner || null);
                setHasSearched(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to perform search. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (customerId) => {
        setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
    };

    // --- Edit Failed Order Handlers ---
    const openEditModal = (order) => {
        setEditingOrder(order);
        setEditFormData({
            lpa: order.activation_code || "",
            iccid: order.iccid || "",
            msisdn: order.msisdn || "",
            provider_purchase_id: order.provider_purchase_id || "",
            provider_reference: order.provider_reference || "",
            provider_amount: "",
            provider_currency: "USD",
            provider_txn_time: new Date().toISOString().slice(0, 16),
            notes: ""
        });
    };

    const handleUpdateFailedOrder = async (e) => {
        e.preventDefault();
        
        const enteredPassword = window.prompt("Enter admin PIN to update the order. This cannot be undone:");
        if (enteredPassword !== process.env.NEXT_PUBLIC_ADMIN_PIN) {
            alert("Incorrect PIN. Order update aborted.");
            return; 
        }

        setIsSubmittingEdit(true);
        const payload = {
            order_id: editingOrder.order_id,
            lpa: editFormData.lpa,
            iccid: editFormData.iccid,
            msisdn: editFormData.msisdn || null,
            provider_purchase_id: editFormData.provider_purchase_id,
            provider_reference: editFormData.provider_reference,
            provider_amount: parseFloat(editFormData.provider_amount),
            provider_currency: editFormData.provider_currency,
            provider_txn_time: editFormData.provider_txn_time ? new Date(editFormData.provider_txn_time).toISOString() : new Date().toISOString(),
            notes: editFormData.notes
        };

        try {
            const adminToken = localStorage.getItem("adminToken");
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/manual-provision`, payload, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            alert("Order updated successfully!");
            setEditingOrder(null);
            
            // Silent refresh to show updated data
            handleSearch({ preventDefault: () => {} }); 
        } catch (error) {
            console.error("Update failed:", error);
            alert(error.response?.data?.message || "Failed to update order. Check server logs.");
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    // --- PDF Download Handler ---
    const handleDownloadPDF = async (order) => {
        setIsDownloading(order.order_id);
        try {
            const qrDataUrl = await QRCodeUtil.toDataURL(order.activation_code || "INVALID", { 
                width: 400, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } 
            });
            const logoBase64 = await getBase64ImageFromUrl("https://res.cloudinary.com/dyalxye1e/image/upload/v1771692673/Logo_eqejec.png");
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            
            // Header
            doc.setFillColor(7, 119, 112); 
            doc.rect(0, 0, 210, 40, 'F');
            doc.setFont("helvetica", "bolditalic");
            doc.setFontSize(28);
            const simWidth = doc.getTextWidth("SiM");
            doc.setFont("helvetica", "normal"); 
            doc.setFont("helvetica", "italic");
            const claireWidth = doc.getTextWidth("Claire");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            const tmWidth = doc.getTextWidth("TM");

            const logoW = 16, logoH = 16, gap = -2, space1 = 1.5, space2 = 0.5;
            const totalGroupWidth = logoW + gap + simWidth + space1 + claireWidth + space2 + tmWidth;
            const startX = (210 - totalGroupWidth) / 2; 

            if (logoBase64) doc.addImage(logoBase64, "PNG", startX, 12, logoW, logoH); 

            let currentX = startX + logoW + gap;
            doc.setFont("helvetica", "bolditalic"); doc.setFontSize(28); doc.setTextColor(255, 255, 255); 
            doc.text("SiM", currentX, 24);
            currentX += simWidth + space1;
            doc.setFont("helvetica", "normal"); doc.setFont("helvetica", "italic"); doc.setTextColor(242, 134, 40); 
            doc.text("Claire", currentX, 24);
            currentX += claireWidth + space2;
            doc.setFont("helvetica", "bold"); doc.setFontSize(10);
            doc.text("TM", currentX, 18); 

            // Intro
            doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(15, 23, 42); 
            doc.text("Welcome to borderless connectivity.", 20, 60);
            doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(71, 85, 105); 
            doc.text("Your order has been processed. Below is your official eSIM receipt.", 20, 67);

            // Order Summary
            doc.setDrawColor(241, 245, 249); doc.setFillColor(255, 255, 255); doc.setLineWidth(0.5);
            doc.roundedRect(20, 72, 170, 58, 3, 3, 'FD');
            doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(148, 163, 184); 
            doc.text("ORDER SUMMARY", 25, 82);
            doc.line(25, 86, 185, 86); 

            doc.setFontSize(10); doc.setTextColor(100, 116, 139); 
            doc.text("Order Number:", 25, 96);
            doc.setTextColor(15, 23, 42); doc.text(`#${order.order_id || 'N/A'}`, 55, 96); 
            doc.setTextColor(100, 116, 139); doc.text("Destination:", 120, 96);
            doc.setTextColor(15, 23, 42); doc.text(order.purchasedforCountry || order.country_code || 'Global', 185, 96, { align: "right" });

            doc.setTextColor(100, 116, 139); doc.text("Sim Type:", 25, 106);
            doc.setTextColor(15, 23, 42); doc.text(order.sim_type?.toString() || "eSIM", 55, 106);
            doc.setTextColor(100, 116, 139); doc.text("Package ID:", 120, 106);
            doc.setTextColor(15, 23, 42); doc.text(order.sim_id?.toString() || "N/A", 185, 106, { align: "right" });

            doc.setTextColor(100, 116, 139); doc.text("Amount Paid:", 25, 116);
            doc.setTextColor(15, 23, 42); doc.text(`${formatCurrency(order.final_price, order.currency)}`, 55, 116);

            // Activation Details
            doc.setDrawColor(241, 245, 249); doc.setFillColor(255, 255, 255);
            doc.roundedRect(20, 135, 170, 80, 3, 3, 'FD');
            doc.setFontSize(9); doc.setTextColor(148, 163, 184);
            doc.text("ACTIVATION DETAILS", 25, 145);
            doc.line(25, 149, 185, 149);

            doc.setDrawColor(226, 232, 240); doc.roundedRect(135, 155, 45, 45, 2, 2, 'D');
            doc.addImage(qrDataUrl, "PNG", 137.5, 157.5, 40, 40);

            doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text("ICCID:", 25, 158);
            doc.setTextColor(15, 23, 42); doc.text(order.iccid || "Pending...", 25, 163);

            doc.setTextColor(100, 116, 139); doc.text("MSISDN (Phone Number):", 25, 173);
            doc.setTextColor(15, 23, 42); doc.text(order.msisdn || "N/A", 25, 178);

            doc.setTextColor(100, 116, 139); doc.text("Activation Code (LPA):", 25, 188);
            doc.setTextColor(15, 23, 42); doc.text(order.activation_code || "N/A", 25, 193, { maxWidth: 100 }); 

            // Guidelines
            doc.setDrawColor(255, 237, 213); doc.setFillColor(255, 247, 237); 
            doc.roundedRect(20, 220, 170, 42, 3, 3, 'FD');
            doc.setFontSize(9); doc.setTextColor(234, 88, 12); doc.text("INSTALLATION GUIDELINES", 25, 230);
            doc.setFontSize(10); doc.setTextColor(120, 53, 15); 
            doc.text("• Secure a stable Wi-Fi connection prior to attempting installation.", 25, 240);
            doc.text("• Go to your device Settings > Cellular/Mobile Data > Add eSIM.", 25, 247);
            doc.text("• Scan the QR code above and follow the on-screen prompts.", 25, 254);

            // Footer
            doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(100, 116, 139); 
            doc.text("Need help? Reach our support concierge:", 105, 272, { align: "center" });
            doc.setFontSize(11); doc.setTextColor(7, 119, 112); doc.text("care@simclaire.com   |   +1 (437) 605-6560", 105, 279, { align: "center" });
            doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(148, 163, 184); 
            doc.text("© 2026 SiM Claire. All rights reserved.", 105, 289, { align: "center" });

            doc.save(`SiM_Claire_${order.country_code || "eSIM"}_${order.order_id || "Receipt"}.pdf`);
            
        } catch (err) {
            console.error("Failed to generate PDF", err);
            alert("Failed to generate your PDF. Please ensure the activation code is valid.");
        } finally {
            setIsDownloading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                
                {/* --- HEADER --- */}
                <div className="mb-8">
                    <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-500 hover:text-[#ec5b13] font-bold mb-4 transition-colors">
                        <ArrowLeft size={16} /> Back to Partner Details
                    </button>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                                <Users className="text-[#ec5b13]" size={28} /> Customer Search
                            </h1>
                            <p className="text-slate-500 mt-1">Look up end-customers and manage their orders.</p>
                        </div>

                        {partnerInfo && (
                            <div className="bg-white border border-slate-200 shadow-sm p-3 rounded-xl flex items-center gap-3 animate-in fade-in">
                                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-[#ec5b13] shrink-0">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Partner Context</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-extrabold text-slate-800">{partnerInfo.partner_name}</p>
                                        {getStatusBadge(partnerInfo.status)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- SEARCH BAR --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text" placeholder="Search by name, email, or phone number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:bg-white focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20 transition-all"
                            />
                        </div>
                        <button type="submit" disabled={loading || !searchQuery.trim()} className="px-8 py-3.5 bg-[#ec5b13] text-white rounded-xl font-bold hover:bg-[#d94a0e] disabled:opacity-50 transition-colors shadow-sm shrink-0 flex items-center justify-center gap-2">
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Search Customers"}
                        </button>
                    </form>
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100 animate-in fade-in">
                            <AlertCircle size={16} className="shrink-0" /> {error}
                        </div>
                    )}
                </div>

                {/* --- RESULTS AREA --- */}
                {hasSearched && !loading && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Search Results</h3>
                            <span className="text-xs font-bold bg-orange-100 text-[#ec5b13] px-3 py-1 rounded-full">{results.length} found</span>
                        </div>

                        {results.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4"><Search size={24} /></div>
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
                                                    {/* CUSTOMER ROW */}
                                                    <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                                                        <td className="p-4 pl-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-[#ec5b13]/10 text-[#ec5b13] flex items-center justify-center font-bold shrink-0">
                                                                    {cust.full_name?.charAt(0)?.toUpperCase() || "?"}
                                                                </div>
                                                                <div>
                                                                    <p className="font-extrabold text-slate-900">{cust.full_name}</p>
                                                                    <p className="text-xs text-slate-400 font-mono">ID: {cust.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm">
                                                            <div className="flex flex-col gap-1.5 text-slate-700">
                                                                <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {cust.email}</div>
                                                                <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {cust.phone || "N/A"}</div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-slate-600 text-sm font-medium flex items-center gap-2 mt-2">
                                                            <Calendar size={14} className="text-slate-400" /> {formatDate(cust.created_at)}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">{orders.length}</span>
                                                        </td>
                                                        <td className="p-4 text-right pr-6">
                                                            <button 
                                                                onClick={() => toggleRow(cust.id)}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-sm text-sm"
                                                            >
                                                                {isExpanded ? "Hide Orders" : "View Orders"}
                                                                {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* EXPANDED ORDERS CARDS */}
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan="5" className="p-0 border-b border-slate-100 bg-slate-50/80">
                                                                <div className="px-6 py-8 pl-6 md:pl-20 animate-in slide-in-from-top-2 duration-200">
                                                                    
                                                                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                                        <ShoppingCart size={16} className="text-[#ec5b13]"/> Order History & Provisioning
                                                                    </h4>
                                                                    
                                                                    {orders.length === 0 ? (
                                                                        <p className="text-sm text-slate-500 italic">No orders found for this customer.</p>
                                                                    ) : (
                                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                                                            {orders.map(order => {
                                                                                const isFailed = order.provisioning_status === "FAILED" || order.provisioning_status === "ERROR";
                                                                                const canDownload = !!order.activation_code;

                                                                                return (
                                                                                <div key={order.order_id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                                                                    
                                                                                    {/* Card Header */}
                                                                                    <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-start gap-4">
                                                                                        <div>
                                                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order #{order.order_id}</p>
                                                                                            <p className="font-extrabold text-slate-900 text-2xl">{formatCurrency(order.final_price, order.currency)}</p>
                                                                                        </div>
                                                                                        <div className="flex flex-col items-end gap-2">
                                                                                            {getStatusBadge(order.order_status)}
                                                                                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                                                                                <Calendar size={12}/> {formatDate(order.created_at)}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Order Data Grid */}
                                                                                    <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 text-sm flex-1">
                                                                                        <div className="sm:col-span-2 border-r border-slate-100 pr-2">
                                                                                            <p className="text-xs font-semibold text-slate-400 mb-0.5">Package (SIM ID)</p>
                                                                                            <p className="font-bold text-slate-800">{order.sim_id} <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded ml-1 align-middle">Type {order.sim_type}</span></p>
                                                                                        </div>
                                                                                        <div className="sm:col-span-2">
                                                                                            <p className="text-xs font-semibold text-slate-400 mb-0.5">Destination</p>
                                                                                            <p className="font-bold text-slate-800">{order.country_code || order.purchasedforCountry}</p>
                                                                                        </div>
                                                                                        
                                                                                        <div className="sm:col-span-2 border-r border-slate-100 pr-2">
                                                                                            <p className="text-xs font-semibold text-slate-400 mb-0.5">Payment Details</p>
                                                                                            <p className="font-semibold text-slate-700 flex items-center gap-1">
                                                                                                <CreditCard size={14}/> {order.payment_status || "N/A"}
                                                                                            </p>
                                                                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5" title="Stripe Intent ID">{order.stripe_payment_intent_id}</p>
                                                                                        </div>
                                                                                        <div className="sm:col-span-2">
                                                                                            <p className="text-xs font-semibold text-slate-400 mb-0.5">Discounts & Promo</p>
                                                                                            {order.promo_code ? (
                                                                                                <p className="font-semibold text-emerald-600 flex items-center gap-1">
                                                                                                    <Tag size={14}/> {order.promo_code} (-{formatCurrency(order.discount_value, order.currency)})
                                                                                                </p>
                                                                                            ) : <p className="font-medium text-slate-400 italic">No Promo Code</p>}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Provisioning Box */}
                                                                                    <div className="m-5 mt-0 bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                                                                                        <div className="flex flex-wrap justify-between items-center gap-2 mb-3 pb-3 border-b border-slate-200/60">
                                                                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                                                                <Smartphone size={14} className="text-[#ec5b13]"/> Provisioning Data
                                                                                            </p>
                                                                                            <div className="flex items-center gap-2">
                                                                                                {getStatusBadge(order.provisioning_status)}
                                                                                                
                                                                                                {/* ACTION BUTTONS */}
                                                                                                {isFailed && (
                                                                                                    <button onClick={() => openEditModal(order)} className="p-1.5 bg-white border border-rose-200 text-rose-600 rounded-md hover:bg-rose-50 transition-colors shadow-sm" title="Manually Provision">
                                                                                                        <Edit2 size={14}/>
                                                                                                    </button>
                                                                                                )}
                                                                                                {canDownload && (
                                                                                                    <button 
                                                                                                        onClick={() => handleDownloadPDF(order)} 
                                                                                                        disabled={isDownloading === order.order_id}
                                                                                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm text-xs font-bold"
                                                                                                    >
                                                                                                        {isDownloading === order.order_id ? <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Download size={12}/>}
                                                                                                        PDF
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                                                                                            <div className="sm:col-span-2">
                                                                                                <p className="text-slate-400 text-xs font-semibold mb-0.5">Provider Status Msg</p>
                                                                                                <p className={`font-medium text-xs ${isFailed ? 'text-rose-600' : 'text-slate-700'}`}>{order.provider_status_msg || "N/A"}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-slate-400 text-xs font-semibold mb-0.5">Provider Purchase ID</p>
                                                                                                <p className="font-mono text-xs font-medium text-slate-800 bg-white border border-slate-200 px-2 py-1.5 rounded truncate" title={order.provider_purchase_id}>{order.provider_purchase_id || "N/A"}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-slate-400 text-xs font-semibold mb-0.5">Provider Reference</p>
                                                                                                <p className="font-mono text-xs font-medium text-slate-800 bg-white border border-slate-200 px-2 py-1.5 rounded truncate" title={order.provider_reference}>{order.provider_reference || "N/A"}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-slate-400 text-xs font-semibold mb-0.5">ICCID</p>
                                                                                                <p className="font-mono text-xs font-medium text-slate-800 bg-white border border-slate-200 px-2 py-1.5 rounded truncate" title={order.iccid}>{order.iccid || "Pending"}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-slate-400 text-xs font-semibold mb-0.5">Activation Code (LPA)</p>
                                                                                                <p className="font-mono text-xs font-medium text-slate-800 bg-white border border-slate-200 px-2 py-1.5 rounded truncate" title={order.activation_code}>{order.activation_code || "Pending"}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                </div>
                                                                            )})}
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

            {/* --- MANUAL PROVISIONING EDIT MODAL --- */}
            {editingOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900">Manual Provisioning</h2>
                                <p className="text-xs text-slate-500 mt-1 font-mono">Order ID: {editingOrder.order_id}</p>
                            </div>
                            <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-full shadow-sm border border-slate-200 transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="manual-provision-form" onSubmit={handleUpdateFailedOrder} className="space-y-5">
                                
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5"/>
                                    <p className="text-sm text-amber-800">You are manually updating a failed order. This will override the current provisioning details and mark the order as successfully provisioned.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">LPA (Activation Code) <span className="text-red-500">*</span></label>
                                        <input required type="text" value={editFormData.lpa} onChange={e => setEditFormData({...editFormData, lpa: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20 font-mono text-sm" placeholder="LPA:1$..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">ICCID <span className="text-red-500">*</span></label>
                                        <input required type="text" value={editFormData.iccid} onChange={e => setEditFormData({...editFormData, iccid: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20 font-mono text-sm" placeholder="89..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">MSISDN (Optional)</label>
                                        <input type="text" value={editFormData.msisdn} onChange={e => setEditFormData({...editFormData, msisdn: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20 font-mono text-sm" placeholder="Phone number if applicable" />
                                    </div>

                                    <div className="md:col-span-2 border-t border-slate-100 my-2"></div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Provider Purchase ID <span className="text-red-500">*</span></label>
                                        <input required type="text" value={editFormData.provider_purchase_id} onChange={e => setEditFormData({...editFormData, provider_purchase_id: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20 font-mono text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Provider Reference <span className="text-red-500">*</span></label>
                                        <input required type="text" value={editFormData.provider_reference} onChange={e => setEditFormData({...editFormData, provider_reference: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20 font-mono text-sm" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Provider Cost <span className="text-red-500">*</span></label>
                                        <input required type="number" step="0.01" value={editFormData.provider_amount} onChange={e => setEditFormData({...editFormData, provider_amount: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Provider Currency <span className="text-red-500">*</span></label>
                                        <input required type="text" value={editFormData.provider_currency} onChange={e => setEditFormData({...editFormData, provider_currency: e.target.value.toUpperCase()})} maxLength="3" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20 font-bold uppercase" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Admin Notes (Internal)</label>
                                        <textarea value={editFormData.notes} onChange={e => setEditFormData({...editFormData, notes: e.target.value})} rows="2" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/20 resize-none text-sm" placeholder="e.g., Manually purchased via portal because API failed."></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setEditingOrder(null)} type="button" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors">
                                Cancel
                            </button>
                            <button form="manual-provision-form" type="submit" disabled={isSubmittingEdit} className="px-6 py-2.5 bg-[#ec5b13] text-white rounded-xl font-bold hover:bg-[#d94a0e] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2">
                                {isSubmittingEdit ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle2 size={16}/>}
                                Save & Provision
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}