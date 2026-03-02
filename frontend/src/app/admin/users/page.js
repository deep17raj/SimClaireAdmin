"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, ShieldAlert, CheckCircle2, Clock, XCircle } from "lucide-react";
import axios from "axios";

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // --- Fetch Users and Orders ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // TODO: Replace with real backend API
        // const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders`);
        // setUsers(res.data);

        // --- MOCK DATA FOR UI TESTING ---
        setTimeout(() => {
          setUsers([
            { id: "ORD-987123", name: "Sarah Connor", email: "sarah@example.com", country: "Japan", flag: "🇯🇵", plan: "10GB - 30 Days", status: "ACTIVE", dataUsed: "2.4 GB", purchaseDate: "Feb 18, 2026" },
            { id: "ORD-456789", name: "John Smith", email: "john@example.com", country: "Europe Regional", flag: "🇪🇺", plan: "5GB - 15 Days", status: "EXPIRED", dataUsed: "5.0 GB", purchaseDate: "Jan 05, 2026" },
            { id: "ORD-112233", name: "Emily Chen", email: "emily.c@example.com", country: "United States", flag: "🇺🇸", plan: "Unlimited - 7 Days", status: "PENDING", dataUsed: "0 GB", purchaseDate: "Feb 21, 2026" },
            { id: "ORD-998877", name: "Michael Roe", email: "m.roe@example.com", country: "Thailand", flag: "🇹🇭", plan: "50GB - 30 Days", status: "ACTIVE", dataUsed: "41.2 GB", purchaseDate: "Feb 02, 2026" },
            { id: "ORD-334455", name: "Lisa Wong", email: "lisa.w@example.com", country: "Global", flag: "🌍", plan: "3GB - 7 Days", status: "PENDING", dataUsed: "0 GB", purchaseDate: "Feb 22, 2026" },
          ]);
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error("Failed to fetch users", err);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // --- Filtering Logic ---
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // --- Helper: Status Badges ---
  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
            <CheckCircle2 size={12} /> ACTIVE
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
            <Clock size={12} /> NOT INSTALLED
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
            <XCircle size={12} /> EXPIRED
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Users...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">User & Order Management</h1>
          <p className="text-slate-500 mt-1">Monitor active customer eSIMs, data usage, and purchase history.</p>
        </div>

        {/* Toolbar: Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#3a7d71] transition-all shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm w-full md:w-auto overflow-x-auto">
            {["ALL", "ACTIVE", "PENDING", "EXPIRED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  statusFilter === status ? "bg-[#3a7d71] text-white shadow" : "text-gray-500 hover:text-slate-800"
                }`}
              >
                {status === "PENDING" ? "NOT INSTALLED" : status}
              </button>
            ))}
          </div>

        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm uppercase tracking-wider">
                  <th className="p-5 font-semibold">Customer</th>
                  <th className="p-5 font-semibold">Order ID & Date</th>
                  <th className="p-5 font-semibold">Destination / Plan</th>
                  <th className="p-5 font-semibold">Status</th>
                  <th className="p-5 font-semibold">Data Used</th>
                  <th className="p-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-gray-500">
                      No users or orders match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Customer Info */}
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#e8f4f1] text-[#3a7d71] flex items-center justify-center font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Order Info */}
                      <td className="p-5">
                        <p className="font-mono text-sm font-semibold text-slate-700">{user.id}</p>
                        <p className="text-sm text-slate-500">{user.purchaseDate}</p>
                      </td>

                      {/* Destination & Plan */}
                      <td className="p-5">
                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{user.flag}</span> {user.country}
                        </p>
                        <p className="text-sm text-slate-500">{user.plan}</p>
                      </td>

                      {/* Status */}
                      <td className="p-5">
                        {getStatusBadge(user.status)}
                      </td>

                      {/* Data Used */}
                      <td className="p-5">
                        <p className={`font-semibold ${user.dataUsed === "0 GB" ? "text-gray-400" : "text-slate-900"}`}>
                          {user.dataUsed}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="text-sm font-semibold text-[#3a7d71] hover:text-[#2b6157] px-3 py-1.5 rounded-lg hover:bg-[#e8f4f1] transition-colors">
                            Details
                          </button>
                          <button className="text-gray-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="More options">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}