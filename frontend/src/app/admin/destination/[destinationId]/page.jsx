"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  Search, Download, Plus, Edit2, Trash2, 
  ChevronDown, ChevronUp, Check, X, ArrowLeft,
  Info
} from "lucide-react";

export default function AdminPlanControlPage() {
  const params = useParams();
  const router = useRouter();
  const destinationID = params.destinationId; // e.g., "CA-1"
console.log("Destination ID from URL:", params);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // UI States
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null); // Used for both Add and Edit
  
  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    multiplier: 1,
    isActive: true,
    priority: 10
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api";

  // --- 1. GET DATA ---
  const fetchPlans = async () => {
    try {
        console.log(`Fetching plans for destination: ${destinationID} from ${API_BASE}`);
      setLoading(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/plan-control?country_code=${destinationID}`);
      console.log("Fetched plans:", res.data);
      if (res.data?.data?.plans) {
        setPlans(res.data.data.plans);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      setError("Failed to load plans from the server.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (destinationID) fetchPlans();
  }, [destinationID]);

  // --- 2. EXPORT CSV ---
  const handleExportCSV = () => {
    if (plans.length === 0) return alert("No plans to export");

    // Extract headers based on non-array, non-object properties (plus specific control fields)
    const csvRows = [];
    const headers = [
      "productID", "productName", "productSku", "productBasePrice", "productCurrency", 
      "productValidityDays", "productDataAllowance", "productDataType", "productVoiceMinutes", 
      "productSmsCount", "operatorName", "is_configured", "custom_multiplier", "is_active", "final_price"
    ];
    csvRows.push(headers.join(","));

    plans.forEach(plan => {
      const multiplier = plan.control?.custom_multiplier || 1;
      const finalPrice = (parseFloat(plan.productBasePrice) * parseFloat(multiplier)).toFixed(2);
      
      const row = [
        `"${plan.productID || ""}"`,
        `"${plan.productName || ""}"`,
        `"${plan.productSku || ""}"`,
        `"${plan.productBasePrice || ""}"`,
        `"${plan.productCurrency || ""}"`,
        `"${plan.productValidityDays || ""}"`,
        `"${plan.productDataAllowance || ""}"`,
        `"${plan.productDataType || ""}"`,
        `"${plan.productVoiceMinutes || ""}"`,
        `"${plan.productSmsCount || ""}"`,
        `"${plan.operatorName || ""}"`,
        `"${plan.is_configured || false}"`,
        `"${multiplier}"`,
        `"${plan.control?.is_active ?? false}"`,
        `"${finalPrice}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `plans_${destinationID}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 3. INITIATE ADD/EDIT ---
  const startEditing = (plan) => {
    setEditingPlanId(plan.productID);
    setFormData({
      multiplier: plan.control?.custom_multiplier ? parseFloat(plan.control.custom_multiplier) : 1,
      isActive: plan.control?.is_active ?? true,
      priority: plan.control?.priority ?? 10
    });
  };

  const cancelEditing = () => {
    setEditingPlanId(null);
  };

  // --- 4. POST / PUT (Save Data) ---
  const handleSave = async (plan) => {
    try {
      const payload = {
        plan_id: plan.productID,
        country_code: destinationID,
        is_active: formData.isActive,
        custom_multiplier: parseFloat(formData.multiplier),
        priority: parseInt(formData.priority, 10)
      };

      if (plan.is_configured) {
        // PUT request
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/admin/plan-control/update`, payload);
      } else {
        // POST request
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/plan-control/add`, payload);
      }
      
      // Refresh UI
      setEditingPlanId(null);
      fetchPlans();
    } catch (err) {
      console.error("Failed to save plan:", err);
      alert("Failed to save plan. Check console for details.");
    }
  };

  // --- 5. DELETE ---
  const handleDelete = async (planID) => {
    if (!window.confirm(`Are you sure you want to remove plan ${planID}?`)) return;
    
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/plan-control/delete`, {
        data: {
          plan_id: planID,
          country_code: destinationID
        }
      });
      fetchPlans();
    } catch (err) {
      console.error("Failed to delete plan:", err);
      alert("Failed to delete plan.");
    }
  };

  // --- FILTERING ---
  const filteredPlans = plans.filter(p => 
    (p.productName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.productID || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-10 text-center text-gray-500 font-bold text-xl animate-pulse">Loading plans...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header & Controls */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <button onClick={() => router.back()} className="text-gray-400 hover:text-blue-600 flex items-center text-sm font-bold mb-2 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Countries
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Plan Management <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{destinationID}</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search plans..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button 
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors w-full sm:w-auto shrink-0"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-slate-50 border-b border-gray-200 text-slate-600 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-12"></th>
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Attributes</th>
                  <th className="px-6 py-4">Base Price</th>
                  <th className="px-6 py-4 text-center">Multiplier</th>
                  <th className="px-6 py-4 text-right">Final Price</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlans.map(plan => {
                  
                  const isEditing = editingPlanId === plan.productID;
                  const isExpanded = expandedPlanId === plan.productID;
                  const isConfigured = plan.is_configured;
                  
                  // Display Calculations
                  const displayMultiplier = isConfigured ? parseFloat(plan.control?.custom_multiplier || 1) : 1;
                  const basePrice = parseFloat(plan.productBasePrice);
                  const finalPrice = isEditing ? (basePrice * parseFloat(formData.multiplier || 0)) : (basePrice * displayMultiplier);
                  const isActiveStatus = isConfigured ? plan.control?.is_active : false;

                  return (
                    <React.Fragment key={plan.productID}>
                      {/* MAIN ROW */}
                      <tr className={`hover:bg-blue-50/30 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                        
                        {/* Expand Icon */}
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => setExpandedPlanId(isExpanded ? null : plan.productID)}
                            className="text-gray-400 hover:text-blue-600 bg-gray-100 hover:bg-blue-100 p-1.5 rounded-full transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                          </button>
                        </td>

                        {/* Product Info */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 mb-1">{plan.productName}</div>
                          <div className="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-2 py-0.5 rounded">{plan.productID}</div>
                        </td>

                        {/* Attributes */}
                        <td className="px-6 py-4 font-medium text-gray-700">
                          {plan.productDataType === "unlimited" ? "Unlimited" : `${plan.productDataAllowance}${plan.dataAllowanceUnit}`} / {plan.productValidityDays} Days
                        </td>

                        {/* Base Price */}
                        <td className="px-6 py-4 font-bold text-gray-500">
                          {plan.productCurrency} {basePrice.toFixed(2)}
                        </td>

                        {/* Multiplier Column (Input or Text) */}
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <input 
                              type="number"
                              step="0.1"
                              min="0"
                              value={formData.multiplier}
                              onChange={(e) => setFormData({...formData, multiplier: e.target.value})}
                              className="w-20 px-2 py-1.5 border border-blue-400 rounded-md text-center text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                            />
                          ) : (
                            <span className={`font-bold ${isConfigured ? 'text-gray-900' : 'text-gray-300'}`}>
                              x {displayMultiplier.toFixed(2)}
                            </span>
                          )}
                        </td>

                        {/* Final Price */}
                        <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">
                          CAD {finalPrice.toFixed(2)}
                        </td>

                        {/* Status Label (or Input) */}
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <select 
                              value={formData.isActive}
                              onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                              className="px-2 py-1.5 border border-blue-400 rounded-md text-xs font-bold text-gray-700 bg-white shadow-sm outline-none cursor-pointer"
                            >
                              <option value="true">Released</option>
                              <option value="false">Unreleased</option>
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block border ${
                              !isConfigured ? 'bg-gray-50 text-gray-400 border-gray-200' :
                              isActiveStatus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {!isConfigured ? 'Not Added' : isActiveStatus ? 'Released' : 'Unreleased'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right space-x-2">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleSave(plan)} className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors shadow-sm" title="Save">
                                <Check size={16} />
                              </button>
                              <button onClick={cancelEditing} className="bg-gray-200 text-gray-700 p-1.5 rounded hover:bg-gray-300 transition-colors shadow-sm" title="Cancel">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {!isConfigured ? (
                                <button 
                                  onClick={() => startEditing(plan)}
                                  className="flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm"
                                >
                                  <Plus size={14} /> Add Plan
                                </button>
                              ) : (
                                <>
                                  <button onClick={() => startEditing(plan)} className="text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 p-1.5 rounded-lg transition-colors" title="Edit">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => handleDelete(plan.productID)} className="text-gray-400 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 border border-gray-200 p-1.5 rounded-lg transition-colors" title="Delete">
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* EXPANDED DETAILS ROW */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="8" className="bg-slate-50 border-b border-gray-200 p-0">
                            <div className="px-10 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                              
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Info size={14}/> Network Specs</h4>
                                <ul className="space-y-1 text-sm text-gray-700 font-medium">
                                  <li><span className="text-gray-500">Operator:</span> {plan.operatorName || 'N/A'}</li>
                                  <li><span className="text-gray-500">Voice:</span> {plan.productVoice === 'YES' || plan.productVoice > 0 ? `${plan.productVoiceMinutes} Mins` : 'None'}</li>
                                  <li><span className="text-gray-500">SMS:</span> {plan.productSms === 'YES' || plan.productSms > 0 ? `${plan.productSmsCount} SMS` : 'None'}</li>
                                </ul>
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Plan Identifiers</h4>
                                <ul className="space-y-1 text-sm text-gray-700 font-medium">
                                  <li><span className="text-gray-500">SKU:</span> {plan.productSku}</li>
                                  <li><span className="text-gray-500">Type ID:</span> {plan.productType}</li>
                                  <li><span className="text-gray-500">Local SIM:</span> {plan.local === 'true' ? `Yes (${plan.localCountry})` : 'No'}</li>
                                </ul>
                              </div>

                              <div className="lg:col-span-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Supported Destinations ({plan.destinations?.length || 0})</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {plan.destinations && plan.destinations.map((dest, i) => (
                                    <span key={i} className="bg-white border border-gray-200 text-gray-600 text-xs px-2 py-1 rounded shadow-sm">
                                      {dest}
                                    </span>
                                  ))}
                                  {(!plan.destinations || plan.destinations.length === 0) && <span className="text-sm text-gray-500">No destinations listed.</span>}
                                </div>
                              </div>
                              
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredPlans.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500 font-medium">
                      No plans found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}