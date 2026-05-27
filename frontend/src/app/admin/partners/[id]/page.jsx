"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe } from "lucide-react";
import axios from "axios";


export default function PartnerPlanManager() {
  const { id } = useParams();
  const router = useRouter();
  
  const [countryCode, setCountryCode] = useState("AU-1"); // Default to US, or make it blank
  const [data, setData] = useState(null);
  const [editedPlans, setEditedPlans] = useState({});
  const [isSaving, setIsSaving] = useState(false);

      const adminToken = localStorage.getItem("adminToken");
  // 1. Fetch Plans for selected country
const fetchCountryPlans = async () => {
    if (!countryCode) return;
    try {
      console.log(countryCode)
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners/${id}/plans/${countryCode}`, {
        headers: { 
          Authorization: `Bearer ${adminToken}` // 🌟 Pass the token to the backend
        }
      });
      
      if (res.data.status === 200) {
        console.log(res.data.data)
        setData(res.data.data);
        
        // Pre-fill our editing state with the fetched data
        const initialEdits = {};
        res.data.data.plans.forEach(p => {
          initialEdits[p.plan_id] = {
            plan_id: p.plan_id,
            is_released: p.partner_release_status || false,
            partner_multiplier: p.partner_multiplier || "",
            priority: p.priority || 0
          };
        });
        setEditedPlans(initialEdits);
      }
    } catch (err) {
      console.error("Failed to fetch plans", err);
    }
  };

  useEffect(() => {
    fetchCountryPlans();
  }, [countryCode]);

  // 2. Handle Input Changes
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
    
    // Convert object to array for API
    const plansArray = Object.values(editedPlans).map(p => ({
      ...p,
      partner_multiplier: p.is_released ? parseFloat(p.partner_multiplier) : null,
      priority: parseInt(p.priority) || 0
    }));

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners/${id}/plans/${countryCode}`, 
        { plans: plansArray }, // Axios automatically stringifies this body
        {
          headers: {
            Authorization: `Bearer ${adminToken}` // 🌟 Pass the token to the backend
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
      // Axios puts backend error responses inside err.response.data
      const errorMessage = err.response?.data?.message || "Failed to save updates.";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-semibold">
        <ArrowLeft size={16}/> Back to Partners
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Pricing & Visibility</h1>
          {data && <p className="text-slate-500">Editing catalog for: <strong className="text-[#077770]">{data.partner.partner_name}</strong></p>}
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Globe className="text-slate-400 ml-2" size={18}/>
          <select 
            value={countryCode} 
            onChange={(e) => setCountryCode(e.target.value)}
            className="bg-transparent border-none font-bold text-slate-700 outline-none pr-4"
          >
            {/* Ideally map over your actual destination list here */}
            <option value="USA-1">United States (USA)</option>
            <option value="JP">Japan (JP)</option>
            <option value="IN">India (IN)</option>
            <option value="GB">United Kingdom (GB)</option>
            <option value="AE">United Arab Emirates (AE)</option>
          </select>
        </div>
      </div>

      {data && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-sm text-slate-600">Showing {data.total_provider_plans} plans for {countryCode}</span>
            <button 
              onClick={handleBulkSave} 
              disabled={isSaving}
              className="bg-[#077770] text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#065f59] disabled:opacity-50"
            >
              <Save size={16} /> {isSaving ? "Saving..." : "Save All Changes"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-white border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Plan Name</th>
                  <th className="p-4">Data & Validity</th>
                  <th className="p-4">Base Price</th>
                  <th className="p-4 text-center">Public Status</th>
                  <th className="p-4 bg-orange-50 border-l border-orange-100 text-center">Partner Released</th>
                  <th className="p-4 bg-orange-50">Partner Multiplier</th>
                  <th className="p-4 bg-orange-50 border-r border-orange-100">Sort Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.plans.map(p => {
                  const editState = editedPlans[p.plan_id] || {};
                  return (
                    <tr key={p.plan_id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{p.plan_name}</td>
                      <td className="p-4 text-sm text-slate-600">{p.data} {p.data_unit} / {p.validity_days} Days</td>
                      <td className="p-4 text-sm font-mono">${p.base_price}</td>
                      <td className="p-4 text-center">
                        {p.public_release_status ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Live (x{p.public_multiplier})</span>
                        ) : (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">Hidden</span>
                        )}
                      </td>
                      
                      {/* Partner Editable Fields */}
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
                      <td className="p-4 bg-orange-50/30">
                        <input 
                          type="number" 
                          step="0.1" 
                          min="0.5" 
                          max="10"
                          required={editState.is_released}
                          disabled={!editState.is_released}
                          className="w-24 border border-slate-200 rounded px-2 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#ec5b13] focus:outline-none"
                          value={editState.partner_multiplier}
                          onChange={(e) => handleEdit(p.plan_id, "partner_multiplier", e.target.value)}
                          placeholder="e.g. 1.5"
                        />
                      </td>
                      <td className="p-4 bg-orange-50/30 border-r border-orange-100">
                        <input 
                          type="number" 
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-sm focus:border-[#ec5b13] focus:outline-none"
                          value={editState.priority}
                          onChange={(e) => handleEdit(p.plan_id, "priority", e.target.value)}
                        />
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