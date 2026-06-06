"use client";

import { useState, useEffect,useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, Search, ChevronDown, Check } from "lucide-react";
import axios from "axios";

// 🌟 Import all destinations
import { allDestinations } from "@/data/destinationData";

export default function PartnerPlanManager() {
  const { id } = useParams();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const dropdownRef = useRef(null);
  // 🌟 Default to the first destination in the list
  const [countryCode, setCountryCode] = useState(allDestinations[0]?.destinationID || ""); 
  const [data, setData] = useState(null);
  const [editedPlans, setEditedPlans] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const adminToken = localStorage.getItem("adminToken");

  // 1. Fetch Plans for selected country
  const fetchCountryPlans = async () => {
    if (!countryCode) return;
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners/${id}/plans/${countryCode}`, {
        headers: { 
          Authorization: `Bearer ${adminToken}` // 🌟 Pass the token to the backend
        }
      });
      
      if (res.data.status === 200) {
        setData(res.data.data);
        
        // Pre-fill our editing state with the fetched data
        const initialEdits = {};
        res.data.data.plans.forEach(p => {
          initialEdits[p.plan_id] = {
            plan_id: p.plan_id,
            is_released: p.partner_release_status || false,
            partner_multiplier: p.partner_multiplier || "",
            // 🌟 Priority removed!
          };
        });
        setEditedPlans(initialEdits);
      }
    } catch (err) {
      console.error("Failed to fetch plans", err);
    }
  };
useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
  useEffect(() => {
    fetchCountryPlans();
  }, [countryCode]);

  // 2. Handle Input Changes
  const filteredDestinations = allDestinations.filter(dest =>
  dest.destinationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  dest.isoCode.toLowerCase().includes(searchQuery.toLowerCase())
);
const selectedDestination = allDestinations.find(d => d.destinationID === countryCode);
  const handleEdit = (planId, field, value) => {
    setEditedPlans(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value
      }
    }));
  };

  // 3. Save Bulk Updates
  const handleBulkSave = async () => {
    setIsSaving(true);
    
    // Convert object to array for API (Removed Priority)
    const plansArray = Object.values(editedPlans).map(p => ({
      plan_id: p.plan_id,
      is_released: p.is_released,
      partner_multiplier: p.is_released ? parseFloat(p.partner_multiplier) : null
    }));

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners/${id}/plans/${countryCode}`, 
        { plans: plansArray }, 
        {
          headers: {
            Authorization: `Bearer ${adminToken}` 
          }
        }
      );
      
      if (res.data.status === 200) {
        alert("Pricing updated successfully!");
        fetchCountryPlans(); // refresh
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to save updates.";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 font-sans">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-semibold transition-colors">
        <ArrowLeft size={16}/> Back to Partners
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Partner Pricing</h1>
          {data && <p className="text-slate-500">Editing catalog for: <strong className="text-[#077770] text-lg">{data.partner.partner_name}</strong></p>}
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative" ref={dropdownRef}>
  <Globe className="text-[#077770] ml-2" size={20}/>
  
  {/* The Trigger Button that looks like a select */}
  <button 
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    className="flex items-center justify-between gap-3 bg-transparent border-none font-bold text-slate-800 outline-none pr-2 cursor-pointer py-1 min-w-[200px]"
  >
    <span>
      {selectedDestination ? `${selectedDestination.destinationName} (${selectedDestination.isoCode})` : "Select Destination"}
    </span>
    <ChevronDown size={16} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
  </button>

  {/* The Searchable Dropdown Menu */}
  {isDropdownOpen && (
    <div className="absolute top-[110%] right-0 w-[280px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      
      {/* Search Input */}
      <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <Search size={16} className="text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Search country or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm p-1 text-slate-700 font-medium"
          autoFocus
        />
      </div>

      {/* Filtered List */}
      <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
        {filteredDestinations.length > 0 ? (
          filteredDestinations.map(dest => (
            <button
              key={dest.destinationID}
              onClick={() => {
                setCountryCode(dest.destinationID);
                setIsDropdownOpen(false);
                setSearchQuery(""); // Clear search when selected
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors cursor-pointer ${
                countryCode === dest.destinationID 
                ? "bg-teal-50 text-[#077770] font-bold" 
                : "text-slate-700 font-medium hover:bg-slate-100"
              }`}
            >
              <span>{dest.destinationName} <span className={countryCode === dest.destinationID ? "text-teal-600/70" : "text-slate-400"}>({dest.isoCode})</span></span>
              {countryCode === dest.destinationID && <Check size={16} />}
            </button>
          ))
        ) : (
          <div className="px-3 py-6 text-center text-sm text-slate-500 font-medium">
            No destinations found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  )}
</div>
      </div>

      {data && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600">Showing {data.total_provider_plans} plans for {countryCode}</span>
            <button 
              onClick={handleBulkSave} 
              disabled={isSaving}
              className="bg-[#077770] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#065f59] disabled:opacity-50 transition-all shadow-sm shadow-teal-500/20"
            >
              <Save size={18} /> {isSaving ? "Saving..." : "Save All Changes"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-white border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-4">Plan Name</th>
                  <th className="p-4">Data & Val.</th>
                  <th className="p-4 text-center">Public Status</th>
                  <th className="p-4 bg-gray-50 border-l border-gray-200">Base Price</th>
                  <th className="p-4 bg-orange-50 border-l border-orange-100 text-center">Released</th>
                  <th className="p-4 bg-orange-50 border-r border-orange-100">Multiplier</th>
                  <th className="p-4 bg-purple-50 text-purple-700">Delta Fee</th>
                  <th className="p-4 bg-blue-50 text-blue-700">Final Price</th>
                  <th className="p-4 bg-emerald-50 text-emerald-700">Your Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.plans.map(p => {
                  const editState = editedPlans[p.plan_id] || {};
                  
                  // 🌟 Real-time Calculations
                  const basePrice = parseFloat(p.base_price) || 0;
                  const multiplier = parseFloat(editState.partner_multiplier) || 0;
                  
                  const subtotal = basePrice * multiplier;
                  const calculatedDelta = Math.min(subtotal * 0.025, 4); // 2.5% capped at $4
                  
                  const finalPrice = subtotal > 0 ? (subtotal + calculatedDelta) : 0;
                  const profit = subtotal > 0 ? (subtotal - basePrice) : 0;

                  return (
                    <tr key={p.plan_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{p.plan_name}</td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{p.data} {p.data_unit} / {p.validity_days} Days</td>
                      <td className="p-4 text-center">
                        {p.public_release_status ? (
                          <span className="text-[11px] bg-green-100 text-green-700 px-2.5 py-1 rounded-md font-bold">Live (x{p.public_multiplier})</span>
                        ) : (
                          <span className="text-[11px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md font-bold">Hidden</span>
                        )}
                      </td>
                      
                      {/* Base Price (Gray) */}
                      <td className="p-4 text-sm font-bold text-slate-500 bg-gray-50/50 border-l border-gray-100">
                        ${basePrice.toFixed(2)}
                      </td>

                      {/* Partner Released Checkbox (Orange) */}
                      <td className="p-4 bg-orange-50/30 border-l border-orange-100 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={editState.is_released}
                            onChange={(e) => handleEdit(p.plan_id, "is_released", e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ec5b13]"></div>
                        </label>
                      </td>
                      
                      {/* Partner Multiplier Input (Orange) */}
                      <td className="p-4 bg-orange-50/30 border-r border-orange-100">
                        <input 
                          type="number" 
                          step="0.1" 
                          min="1" 
                          max="10"
                          required={editState.is_released}
                          disabled={!editState.is_released}
                          className="w-24 border border-orange-200 bg-white rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 focus:border-[#ec5b13] focus:ring-1 focus:ring-[#ec5b13] outline-none transition-all"
                          value={editState.partner_multiplier}
                          onChange={(e) => handleEdit(p.plan_id, "partner_multiplier", e.target.value)}
                           onBlur={(e) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val) || val < 1) {
      handleEdit(p.plan_id, "partner_multiplier", 1); // Force back to 1
    }
  }}
                          placeholder="e.g. 1.5"
                        />
                      </td>

                      {/* Calculated Delta (Purple) */}
                      <td className="p-4 text-sm font-bold text-purple-700 bg-purple-50/30">
                        ${calculatedDelta.toFixed(2)}
                      </td>

                      {/* Calculated Final Price (Blue) */}
                      <td className="p-4 text-sm font-extrabold text-blue-700 bg-blue-50/30">
                        ${finalPrice.toFixed(2)}
                      </td>

                      {/* Calculated Profit (Green) */}
                      <td className="p-4 text-sm font-extrabold text-emerald-600 bg-emerald-50/30">
                        ${profit.toFixed(2)}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}