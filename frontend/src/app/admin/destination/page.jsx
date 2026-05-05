"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Globe, ArrowRight, MapPin } from "lucide-react";
import { allDestinations } from "@/data/destinationData";

const AdminDestinationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter countries based on search
  const filteredCountries = allDestinations.filter((country) =>
    country.destinationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.destinationID.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFlagUrl = (isoCode) => {
    if (!isoCode) return "https://flagcdn.com/w80/un.png";
    // Handle special cases if necessary, otherwise standard ISO
    return `https://flagcdn.com/w80/${isoCode.toLowerCase()}.png`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Destinations</h1>
          <p className="text-gray-500 mt-2">Select a country to manage its active eSIM plans.</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by country name, ISO code, or region..."
            className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-4 flex items-center">
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
              {filteredCountries.length} Results
            </span>
          </div>
        </div>

        {/* Countries Grid */}
        {filteredCountries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCountries.map((country) => (
              <Link
                key={country.destinationID}
                href={`/admin/destination/${country.destinationID}`}
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col relative overflow-hidden"
              >
                {/* Subtle Background Icon */}
                <Globe className="absolute -right-4 -bottom-4 h-24 w-24 text-gray-50 opacity-5 group-hover:scale-110 transition-transform" />

                <div className="flex items-center gap-4 mb-4">
                  {/* Flag Container */}
                  <div className="w-16 h-12 relative rounded-lg overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                    <img
                      src={getFlagUrl(country.isoCode)}
                      alt={country.destinationName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                      {country.destinationName}
                    </h2>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                      {country.destinationID}
                    </span>
                  </div>
                </div>

                <div className="mt-auto space-y-2">
                  <div className="flex items-center text-gray-500 text-sm">
                    <Globe className="h-4 w-4 mr-2 text-gray-400" />
                    {country.continent}
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {country.region}
                  </div>
                </div>

                {/* Hover Action indicator */}
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-sm font-semibold text-gray-400 group-hover:text-blue-600 transition-colors">
                    Manage Plans
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Globe className="h-16 w-16 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium text-lg">No countries found matching "{searchQuery}"</p>
            <button 
              onClick={() => setSearchQuery("")}
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDestinationsPage;
