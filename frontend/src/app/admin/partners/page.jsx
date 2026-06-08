"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, CheckCircle, XCircle, Clock, Users, FileText } from "lucide-react";
import axios from "axios";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Partner Form State
  const [newPartner, setNewPartner] = useState({ email: "", partner_name: "", status: "PENDING" });

  // Safely get token to prevent Next.js SSR crashes
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  // 1. Fetch Partners
  const fetchPartners = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners`, {
        headers: {
          Authorization: `Bearer ${adminToken}` 
        }
      });
      
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
          Authorization: `Bearer ${adminToken}` 
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
      const errorMessage = err.response?.data?.message || "Error creating partner";
      alert(errorMessage);
    }
  };

  // 3. Update Status
  const handleStatusChange = async (partnerId, newStatus) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    try {
      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners/${partnerId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${adminToken}` 
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
      case "ACTIVE": return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle size={14} /> Active</span>;
      case "PENDING": return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={14} /> Pending</span>;
      case "SUSPENDED": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><XCircle size={14} /> Suspended</span>;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Partner Management</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#077770] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#065f59] transition-colors w-max">
          <Plus size={18} /> Add New Partner
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
              <tr>
                <th className="p-4 font-bold">ID</th>
                <th className="p-4 font-bold">Partner Name</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">Loading partners...</td></tr>
              ) : partners.map(p => (
                <tr key={p.partner_access_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 text-slate-500 font-mono">#{p.partner_access_id}</td>
                  <td className="p-4 font-extrabold text-slate-800">{p.partner_name}</td>

                  {/* 🌟 Removed the link from the email */}
                  <td className="p-4 text-slate-600 font-medium">{p.email}</td>
                  
                  <td className="p-4">{getStatusBadge(p.status)}</td>
                  
                  {/* 🌟 Added the new action buttons */}
                  <td className="p-4 flex gap-2 justify-end items-center flex-wrap">
                    
                    <select
                      value=""
                      onChange={(e) => handleStatusChange(p.partner_access_id, e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white text-slate-600 outline-none cursor-pointer hover:border-slate-300"
                    >
                      <option value="" disabled>Status...</option>
                      <option value="ACTIVE">Set Active</option>
                      <option value="PENDING">Set Pending</option>
                      <option value="SUSPENDED">Suspend</option>
                    </select>

                    <Link
                      href={`/admin/partners/${p.partner_access_id}/profile`}
                      className="bg-orange-50 text-[#ec5b13] border border-orange-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-orange-100 transition-colors"
                      title="View Partner Profile"
                    >
                      <FileText size={14} /> Profile
                    </Link>

                    <Link
                      href={`/admin/partners/${p.partner_access_id}/customers`}
                      className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
                      title="View End Customers"
                    >
                      <Users size={14} /> Customers
                    </Link>

                    <Link
                      href={`/admin/partners/${p.partner_access_id}`}
                      className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 transition-colors"
                      title="Manage Discount Plans"
                    >
                      <Edit size={14} /> Plans
                    </Link>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Invite New Partner</h2>
            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Company / Partner Name</label>
                <input required type="text" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-[#077770] focus:ring-2 focus:ring-[#077770]/20 font-medium" value={newPartner.partner_name} onChange={e => setNewPartner({ ...newPartner, partner_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Primary Email</label>
                <input required type="email" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-[#077770] focus:ring-2 focus:ring-[#077770]/20 font-medium" value={newPartner.email} onChange={e => setNewPartner({ ...newPartner, email: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#077770] text-white font-bold rounded-xl hover:bg-[#065f59] transition-colors shadow-sm">Create Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}