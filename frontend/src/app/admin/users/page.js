"use client";

import { useState } from "react";
import axios from "axios";
import { 
  Search, CreditCard, Globe, Calendar, Hash, 
  CheckCircle2, XCircle, Clock, X, QrCode, ShieldAlert, 
  DollarSign, Tag, Smartphone, Database, Activity, User, FileCheck
} from "lucide-react";

// --- Helper for Date Formatting ---
const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
};

// --- Helper for Status Badges ---
const StatusBadge = ({ status, label = "" }) => {
  if (!status) return <span className="text-gray-400 text-xs">N/A</span>;
  const s = status.toString().toUpperCase();
  
  if (s === "COMPLETED" || s === "SUCCEEDED" || s === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
        <CheckCircle2 size={12} /> {label && <span className="text-green-600/80 mr-0.5">{label}:</span>} {s}
      </span>
    );
  }
  if (s === "PENDING" || s === "PROCESSING") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">
        <Clock size={12} /> {label && <span className="text-orange-600/80 mr-0.5">{label}:</span>} {s}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
      <XCircle size={12} /> {label && <span className="text-gray-500 mr-0.5">{label}:</span>} {s}
    </span>
  );
};

export default function AdminUsersPanel() {
  const [emailInput, setEmailInput] = useState("");
  
  // States for API 1 (User Sims)
  const [userSims, setUserSims] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // States for API 2 (Sim Details Modal)
  const [selectedSim, setSelectedSim] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // --- API 1: Fetch all SIMs for a user ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSearching(true);
    setSearchError("");
    setHasSearched(true);
    setUserSims([]);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/get/userdata`, { email: emailInput.trim() });
      console.log(res.data.data)
      if (res.data && res.data.data) {
        setUserSims(res.data.data);
      } else {
        setSearchError("No data returned from the server.");
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchError(err.response?.data?.message || "Failed to find user. Please check the email.");
    } finally {
      setIsSearching(false);
    }
  };

  // --- API 2: Fetch specific SIM details ---
  const handleCardClick = async (esim_history_id) => {
    setSelectedSim({ loading: true });
    setIsDetailsLoading(true);
    setDetailsError("");

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/get/user/esimHistorybyId/${esim_history_id}`, {
        withCredentials: true
      });
      console.log(res.data)
      
      if (res.data && res.data.data) {
        setSelectedSim(res.data.data);
      } else {
        throw new Error("No details found for this SIM.");
      }
    } catch (err) {
      console.error("Details fetch failed:", err);
      setDetailsError("Failed to load deep eSIM details.");
      setSelectedSim(null); 
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeModal = () => setSelectedSim(null);

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 lg:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User History Search</h1>
          <p className="text-slate-500 mt-1">Look up a user by email to view all their purchased eSIMs, pricing breakdowns, and technical details.</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-10">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                type="email"
                placeholder="Enter customer email address (e.g. name@domain.com)"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#077770]/20 focus:border-[#077770] transition-all text-gray-900 font-medium"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSearching}
              className="px-8 py-3.5 bg-[#077770] text-white font-bold rounded-xl hover:bg-[#06605a] transition-colors disabled:opacity-70 flex items-center justify-center min-w-[140px] cursor-pointer"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : "Search"}
            </button>
          </form>
          {searchError && <p className="text-red-500 text-sm font-semibold mt-3">{searchError}</p>}
        </div>

        {/* Results List (API 1 Data) */}
        {hasSearched && !isSearching && !searchError && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
              Found {userSims.length} Orders for <span className="text-[#077770]">{emailInput}</span>
            </h2>

            {userSims.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center">
                <p className="text-gray-500 font-medium">This user hasn't purchased any eSIMs yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {userSims.map((sim) => (
                  <div 
                    key={sim.esim_history_id} 
                    onClick={() => handleCardClick(sim.esim_history_id)}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#077770]/40 transition-all cursor-pointer group flex flex-col overflow-hidden"
                  >
                    {/* Top Bar: Core Identifiers */}
                    <div className="bg-gray-50/50 border-b border-gray-100 p-4 sm:px-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#077770]/10 flex items-center justify-center text-[#077770] shrink-0">
                          <Globe size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            {sim.country_code} <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Type {sim.sim_type}</span>
                          </p>
                          <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                            <Calendar size={14}/> {formatDate(sim.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={sim.order_status} label="Order" />
                        <StatusBadge status={sim.payment_status} label="Payment" />
                        <StatusBadge status={sim.provisioning_status} label="Provision" />
                      </div>
                    </div>

                    {/* Middle Section: Technical & Financials Split */}
                    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                      
                      {/* Left: Technical Identifiers */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Database size={14}/> Technical Details
                          </h4>
                          {/* 🌟 New Agreed to Terms tag in outer card */}
                          <span className={`text-[14px] font-bold px-4 py-1 rounded-full ${sim.terms_agreed === 1 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            Terms agreed: {sim.terms_agreed === 1 ? "Yes" : "No"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Order ID</p>
                            <p className="font-semibold text-gray-900">#{sim.order_id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment ID</p>
                            <p className="font-semibold text-gray-900">#{sim.payment_id}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-xs text-gray-500 mb-1">ICCID</p>
                            {/* 🌟 Updated ICCID Fallback Logic */}
                            <p className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block break-all">
                              {sim.iccid ? sim.iccid : "N/A"}
                            </p>
                          </div>
                          {sim.msisdn && (
                            <div className="sm:col-span-2">
                              <p className="text-xs text-gray-500 mb-1">MSISDN (Phone Number)</p>
                              <p className="font-mono text-sm font-semibold text-gray-900">{sim.msisdn}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Financial Breakdown */}
                      <div className="space-y-4 lg:border-l border-gray-100 lg:pl-10">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign size={14}/> Financial Breakdown
                        </h4>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          {/* 1. API Base Price */}
                          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                              <Database size={14} className="text-gray-400"/> API Cost (Base)
                            </span>
                            <span className="font-mono font-semibold text-gray-700">
                              {sim.currency} {sim.base_price}
                            </span>
                          </div>

                          {/* 2. Billed/Final Price */}
                          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-800 font-bold flex items-center gap-1.5">
                                <Tag size={14} className="text-brand"/> Billed to User
                              </span>
                              {(sim.discount_value > 0 || sim.promo_code) && (
                                <span className="text-[10px] text-brand font-medium mt-0.5">
                                  Discount: -{sim.currency} {sim.discount_value} {sim.promo_code && `(${sim.promo_code})`}
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-lg text-brand">
                              {sim.currency} {sim.final_price}
                            </span>
                          </div>

                          {/* 3. Actual Paid Amount */}
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                              <CreditCard size={14} className="text-green-600"/> Actual Amount Paid
                            </span>
                            <span className="font-mono font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                              {sim.payment_currency} {sim.payment_amount}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detailed Modal (API 2 Data) */}
        {selectedSim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Deep eSIM Record</h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium flex items-center gap-2">
                    History ID: #{selectedSim.esim_history_id || "Loading..."} | User ID: #{selectedSim.user_id}
                  </p>
                </div>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto">
                {isDetailsLoading || selectedSim.loading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-[#077770]">
                    <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold">Fetching deep telecom & stripe records...</p>
                  </div>
                ) : detailsError ? (
                  <div className="py-10 text-center text-red-500 font-bold">{detailsError}</div>
                ) : (
                  <div className="space-y-8">
                    
                    {/* Section 1: Network & Activation */}
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-bold text-[#077770] uppercase tracking-wider mb-4 border-b pb-2">
                        <QrCode size={16} /> Network Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">ICCID</p>
                          <p className="font-mono font-bold text-gray-900 break-all">{selectedSim.iccid ? selectedSim.iccid : "N/A"}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">Activation Code (LPA)</p>
                          <p className="font-mono text-sm font-semibold text-gray-900 break-all">{selectedSim.activation_code || "N/A"}</p>
                        </div>
                        
                        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500">SKU</p>
                            <p className="font-bold text-gray-900">{selectedSim.sku}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Product Type</p>
                            <p className="font-bold text-gray-900">{selectedSim.product_type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Quantity</p>
                            <p className="font-bold text-gray-900">{selectedSim.quantity}</p>
                          </div>
                        </div>

                        {/* 🌟 Fixed Provider Overlap: Changed grid-cols to 2 instead of 4 */}
                        <div className="md:col-span-2 bg-[#077770]/5 p-4 rounded-xl border border-[#077770]/10">
                           <p className="text-xs font-bold text-[#077770] uppercase tracking-wider mb-3 flex items-center gap-1.5"><Activity size={14}/> Provider Logs</p>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <p className="text-[10px] text-gray-500">Provider Purchase ID</p>
                                <p className="font-mono text-sm font-bold text-gray-800 break-all">{selectedSim.provider_purchase_id || "N/A"}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-gray-500">Provider Ref</p>
                                <p className="font-mono text-sm font-bold text-gray-800 break-all">{selectedSim.provider_reference || "N/A"}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-gray-500">Status Code/Msg</p>
                                <p className="font-mono text-sm font-bold text-gray-800">
                                  {selectedSim.provider_status_code || "N/A"} {selectedSim.provider_status_msg && `(${selectedSim.provider_status_msg})`}
                                </p>
                             </div>
                             <div>
                                <p className="text-[10px] text-gray-500">TXN Time</p>
                                <p className="font-mono text-sm font-bold text-gray-800">{selectedSim.provider_txn_time || "N/A"}</p>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Stripe & Financials */}
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 border-b pb-2">
                        <CreditCard size={16} /> Status & Gateway Records
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* 🌟 Updated Status Layout */}
                        <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Order Status</span>
                            <StatusBadge status={selectedSim.order_status} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Payment Status</span>
                            <StatusBadge status={selectedSim.payment_status} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Provisioning Status</span>
                            <StatusBadge status={selectedSim.provisioning_status} />
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm font-bold text-gray-900">Total Charged</span>
                            <span className="font-bold text-lg text-green-600">{userSims.find(s => s.esim_history_id === selectedSim.esim_history_id)?.payment_currency} {selectedSim.payment_amount}</span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 overflow-hidden">
                          <div>
                            <span className="text-xs text-gray-500 font-bold block mb-1">Stripe Payment Intent ID</span>
                            <span className="font-mono text-sm text-gray-800 bg-gray-200 px-3 py-1.5 rounded block truncate">{selectedSim.stripe_payment_intent_id || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 font-bold block mb-1">Stripe Session ID</span>
                            <span className="font-mono text-sm text-gray-800 bg-gray-200 px-3 py-1.5 rounded block truncate">{selectedSim.stripe_sessionId || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: User Details & eKYC (Shows if data exists) */}
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">
                        <User size={16} /> Customer Information
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3 sm:col-span-2">
                           <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><User size={14} className="text-slate-500"/></div>
                           <div>
                             <p className="text-xs text-gray-500">Email Address</p>
                             <p className="font-semibold text-gray-900">{selectedSim.email || "N/A"}</p>
                           </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><FileCheck size={14} className="text-slate-500"/></div>
                           <div>
                             <p className="text-xs text-gray-500">Terms Agreed?</p>
                             {/* 🌟 New terms agreed mapping based on API 1 data */}
                             <p className={`font-bold ${userSims.find(s => s.esim_history_id === selectedSim.esim_history_id)?.terms_agreed === 1 ? "text-green-600" : "text-gray-500"}`}>
                               {userSims.find(s => s.esim_history_id === selectedSim.esim_history_id)?.terms_agreed === 1 ? "Yes" : "No"}
                             </p>
                           </div>
                        </div>
                      </div>

                      {(selectedSim.customer_name || selectedSim.customer_document_number) && (
                        <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                          <div className="col-span-2 sm:col-span-4 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">
                              <ShieldAlert size={12}/> eKYC Verification Data
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Full Name</p>
                            <p className="font-semibold text-gray-900">{selectedSim.customer_name} {selectedSim.customer_surname1}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Document Number</p>
                            <p className="font-mono font-semibold text-gray-900">{selectedSim.customer_document_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Birthdate</p>
                            <p className="font-semibold text-gray-900">{selectedSim.customer_birthdate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Gender / Nat. ID</p>
                            <p className="font-semibold text-gray-900">{selectedSim.customer_sex} / {selectedSim.customer_nationality_id}</p>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}