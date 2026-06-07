"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
    ArrowLeft, Building2, User, MapPin, 
    Globe, AlertCircle, Loader2, Mail, Phone, Calendar, CheckCircle2, XCircle
} from "lucide-react";

// Helper to format dates
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });
};

export default function AdminPartnerProfileView() {
    const params = useParams();
    const router = useRouter();
    const partnerAccessId = params.id;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const [partnerInfo, setPartnerInfo] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [profileExists, setProfileExists] = useState(false);

    useEffect(() => {
        const fetchPartnerProfile = async () => {
            if (!partnerAccessId) return;

            setLoading(true);
            setError("");

            try {
                const adminToken = localStorage.getItem("adminToken");
                
                if (!adminToken) {
                    router.push("/admin/login");
                    return;
                }

                const res = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/admin/partners/${partnerAccessId}/profile`,
                    { headers: { Authorization: `Bearer ${adminToken}` } }
                );

                if (res.data.status === 200 || res.status === 200) {
                    setPartnerInfo(res.data.data.partner);
                    setProfileExists(res.data.data.profile_exists);
                    if (res.data.data.profile_exists) {
                        setProfileData(res.data.data.profile);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch partner profile:", err);
                setError(err.response?.data?.message || "Failed to load partner profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchPartnerProfile();
    }, [partnerAccessId, router]);

    const getStatusBadge = (status) => {
        if (status === "ACTIVE") return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider">ACTIVE</span>;
        if (status === "SUSPENDED") return <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider">SUSPENDED</span>;
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider">{status || "UNKNOWN"}</span>;
    };

    // Reusable Data Display Field
    const DataField = ({ label, value, fallback = "Not provided" }) => (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                {value || <span className="text-slate-400 italic font-normal">{fallback}</span>}
            </span>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#ec5b13] animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading partner profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] p-4 md:p-8 font-sans pb-20">
            <div className="max-w-5xl mx-auto">
                
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
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                                Partner Profile Review
                            </h1>
                            <p className="text-slate-500 mt-1">Review the business and contact details submitted by the partner.</p>
                        </div>

                        {/* Partner Context Badge */}
                        {partnerInfo && (
                            <div className="bg-white border border-slate-200 shadow-sm p-3 rounded-xl flex items-center gap-3 shrink-0">
                                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-[#ec5b13] shrink-0">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">System Account</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="font-extrabold text-slate-800">{partnerInfo.partner_name}</p>
                                        {getStatusBadge(partnerInfo.status)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{partnerInfo.email}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100 animate-in fade-in">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {!profileExists ? (
                    /* EMPTY STATE */
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-12 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Building2 size={32} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Profile Not Completed</h2>
                        <p className="text-slate-500 max-w-md mx-auto">
                            This partner has an active system account but has not yet filled out their business application profile.
                        </p>
                    </div>
                ) : (
                    /* PROFILE DATA STATE */
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        
                        {/* Profile Meta Header */}
                        <div className="bg-slate-50 border-b border-slate-100 p-6 md:px-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                <Calendar size={16} className="text-slate-400"/> 
                                Submitted: <span className="text-slate-800 font-bold">{formatDate(profileData.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                Last Updated: <span className="text-slate-800 font-bold">{formatDate(profileData.updated_at)}</span>
                            </div>
                        </div>

                        <div className="p-6 md:p-10 space-y-12">
                            
                            {/* SECTION A: Company Details */}
                            <section>
                                <div className="flex gap-3 mb-6 items-center border-b border-slate-100 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#ec5b13] flex items-center justify-center font-extrabold">A</div>
                                    <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Company Details</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 ml-0 md:ml-11">
                                    <DataField label="Legal Company Name" value={profileData.legal_company_name} />
                                    <DataField label="Trading Name" value={profileData.trading_name} />
                                    <DataField label="Business Type" value={profileData.business_type} />
                                    <DataField label="Industry Sector" value={profileData.industry_sector} />
                                    <DataField label="Company Registration No." value={profileData.company_registration_no} />
                                    <DataField label="VAT / Tax ID" value={profileData.vat_tax_id} />
                                    <DataField label="Year Established" value={profileData.year_established} />
                                    
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Website</span>
                                        <span className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                                            {profileData.company_website ? (
                                                <a href={profileData.company_website} target="_blank" rel="noreferrer" className="text-[#ec5b13] hover:underline">
                                                    {profileData.company_website}
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 italic font-normal">Not provided</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION B: Primary Contact */}
                            <section>
                                <div className="flex gap-3 mb-6 items-center border-b border-slate-100 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold">B</div>
                                    <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Primary Contact</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 ml-0 md:ml-11">
                                    <DataField label="Full Name" value={profileData.full_name} />
                                    
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone / WhatsApp</span>
                                        <span className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg flex items-center gap-2">
                                            <Phone size={14} className="text-slate-400" />
                                            {profileData.phone_number || <span className="text-slate-400 italic font-normal">Not provided</span>}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION C: Address */}
                            <section>
                                <div className="flex gap-3 mb-6 items-center border-b border-slate-100 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold">C</div>
                                    <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Registered Address</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 ml-0 md:ml-11">
                                    <div className="md:col-span-2">
                                        <DataField label="Address Line 1" value={profileData.address_line1} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <DataField label="Address Line 2" value={profileData.address_line2} />
                                    </div>
                                    <DataField label="City" value={profileData.city} />
                                    <DataField label="State / Province" value={profileData.state_province} />
                                    <DataField label="Postal / Zip Code" value={profileData.postal_code} />
                                    <DataField label="Country Code" value={profileData.country} />
                                </div>
                            </section>

                            {/* SECTION D: Market Info & Compliance */}
                            <section>
                                <div className="flex gap-3 mb-6 items-center border-b border-slate-100 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-extrabold">D</div>
                                    <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Market & Compliance</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 ml-0 md:ml-11">
                                    
                                    {/* Array Badges */}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Markets</span>
                                        <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg flex flex-wrap gap-1.5 min-h-[38px]">
                                            {profileData.target_markets && profileData.target_markets.length > 0 ? (
                                                profileData.target_markets.map((market, idx) => (
                                                    <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs px-2 py-1 rounded shadow-sm font-bold">
                                                        {market}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic font-normal text-sm">Not provided</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sales Channels</span>
                                        <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg flex flex-wrap gap-1.5 min-h-[38px]">
                                            {profileData.sales_channels && profileData.sales_channels.length > 0 ? (
                                                profileData.sales_channels.map((channel, idx) => (
                                                    <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs px-2 py-1 rounded shadow-sm font-bold">
                                                        {channel}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic font-normal text-sm">Not provided</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <DataField label="Additional Notes" value={profileData.notes} />
                                    </div>

                                    {/* Booleans / Compliance */}
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl">
                                            {profileData.esim_experience ? <CheckCircle2 className="text-emerald-500" size={18}/> : <XCircle className="text-slate-300" size={18}/>}
                                            <span className="text-sm font-bold text-slate-700">Has eSIM Experience</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl">
                                            {profileData.accepted_terms ? <CheckCircle2 className="text-emerald-500" size={18}/> : <XCircle className="text-rose-500" size={18}/>}
                                            <span className="text-sm font-bold text-slate-700">Accepted Terms</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl">
                                            {profileData.accepted_privacy ? <CheckCircle2 className="text-emerald-500" size={18}/> : <XCircle className="text-rose-500" size={18}/>}
                                            <span className="text-sm font-bold text-slate-700">Accepted Privacy Policy</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl">
                                            {profileData.marketing_opt_in ? <CheckCircle2 className="text-emerald-500" size={18}/> : <XCircle className="text-slate-300" size={18}/>}
                                            <span className="text-sm font-bold text-slate-700">Marketing Opt-In</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}