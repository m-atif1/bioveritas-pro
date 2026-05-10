// src/app/dashboard/page.tsx
"use client";
import { useState } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import Header from '@/components/Header';
import PatientPortal from '@/components/PatientPortal';
import InvestigatorTab from '@/components/InvestigatorTab';
import AdminTerminal from '@/components/AdminTerminal';

export default function BioVeritasDashboard() {
  const [activeTab, setActiveTab] = useState('patient');
  const blockchain = useBlockchain(); 

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 lg:p-10 font-sans relative overflow-hidden">
      {/* Visual background elements for premium UI feel */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:32px_32px]"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10">
        <Header blockchain={blockchain} />

        <nav className="flex bg-slate-900/60 p-2 rounded-2xl w-fit mb-12 mx-auto border border-slate-800/50 backdrop-blur-md shadow-2xl">
          {['patient', 'doctor', 'admin'].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)} 
              className={`px-12 py-3 rounded-xl capitalize font-black text-xs transition-all duration-300 ${
                activeTab === t 
                  ? 'bg-blue-600 text-white shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)]' 
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {t === 'doctor' ? 'Investigator' : t}
            </button>
          ))}
        </nav>

        <main className="max-w-[1200px] mx-auto bg-slate-900/30 border border-slate-800/60 rounded-[3.5rem] p-16 shadow-2xl backdrop-blur-md min-h-[600px]">
          {activeTab === 'patient' && <PatientPortal blockchain={blockchain} />}
          {activeTab === 'doctor' && <InvestigatorTab blockchain={blockchain} />}
          {activeTab === 'admin' && <AdminTerminal blockchain={blockchain} />}
        </main>
        
        <footer className="mt-10 text-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
            BioVeritas Protocol v2.0 • Decentralized Clinical Trial Infrastructure
          </p>
        </footer>
      </div>
    </div>
  );
}