"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, CheckCircle, XCircle, Clock } from "lucide-react";
import axios from "axios";
 

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Partner Form State
  const [newPartner, setNewPartner] = useState({ email: "", partner_name: "", status: "PENDING" });
    
      const adminToken = localStorage.getItem("adminToken");
  // 1. Fetch Partners
  // 1. Fetch Partners
  const fetchPartners = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners`, {
        headers: {
          Authorization: `Bearer ${adminToken}` // 🌟 Pass the token to the backend
        }
      });
      console.log(res)
      // Axios automatically parses JSON into `res.data`
      if (res.data.status === 200) {
        setPartners(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch partners", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // 2. Create Partner
  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners`, newPartner, {
        headers: {
          Authorization: `Bearer ${adminToken}` // 🌟 Pass the token to the backend
        }
      });

      if (res.data.status === 201) {
        setIsModalOpen(false);
        setNewPartner({ email: "", partner_name: "", status: "PENDING" });
        fetchPartners(); // Refresh list
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      // Axios puts backend error responses inside err.response.data
      const errorMessage = err.response?.data?.message || "Error creating partner";
      alert(errorMessage);
    }
  };

  // 3. Update Status
  const handleStatusChange = async (partnerId, newStatus) => {
    if(!confirm(`Change status to ${newStatus}?`)) return;
    try {
      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners/${partnerId}/status`, 
        { status: newStatus }, 
        {
          headers: {
            Authorization: `Bearer ${adminToken}` // 🌟 Pass the token to the backend
          }
        }
      );
      
      if (res.data.status === 200) {
        fetchPartners(); // Refresh the list after successful update
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error updating status";
      alert(errorMessage);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE": return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle size={14}/> Active</span>;
      case "PENDING": return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={14}/> Pending</span>;
      case "SUSPENDED": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><XCircle size={14}/> Suspended</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Partner Management</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#077770] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#065f59]">
          <Plus size={18} /> Add New Partner
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
            <tr>
              <th className="p-4 font-bold">ID</th>
              <th className="p-4 font-bold">Partner Name</th>
              <th className="p-4 font-bold">Email</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : partners.map(p => (
              <tr key={p.partner_access_id} className="hover:bg-slate-50">
                <td className="p-4 text-slate-600">#{p.partner_access_id}</td>
                <td className="p-4 font-bold text-slate-800">{p.partner_name}</td>
                <td className="p-4 text-slate-600">{p.email}</td>
                <td className="p-4">{getStatusBadge(p.status)}</td>
                <td className="p-4 flex gap-2 justify-end">
                  <select 
                    value="" 
                    onChange={(e) => handleStatusChange(p.partner_access_id, e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 text-sm bg-white text-slate-600"
                  >
                    <option value="" disabled>Change Status...</option>
                    <option value="ACTIVE">Set Active</option>
                    <option value="PENDING">Set Pending</option>
                    <option value="SUSPENDED">Suspend</option>
                  </select>
                  <Link 
                    href={`/admin/partners/${p.partner_access_id}`}
                    className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 hover:bg-slate-200"
                  >
                    <Edit size={14}/> Manage Plans
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Invite New Partner</h2>
            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Company / Partner Name</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={newPartner.partner_name} onChange={e => setNewPartner({...newPartner, partner_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Primary Email</label>
                <input required type="email" className="w-full border rounded-lg p-2" value={newPartner.email} onChange={e => setNewPartner({...newPartner, email: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#077770] text-white font-bold rounded-lg">Create Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}