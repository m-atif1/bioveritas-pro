import React from 'react';

export default function Header({ blockchain }: { blockchain: any }) {
  const { account, setAccount, availableAccounts, balance, tvl, status } = blockchain;

  const getRoleLabel = (address: string) => {
    const idx = availableAccounts.findIndex((a: string) => a.toLowerCase() === address.toLowerCase());
    if (idx === 0) return "Master Admin";
    if (idx === 1) return "Secondary Admin";
    if (idx >= 2 && idx <= 6) return `Patient ${idx - 1}`;
    if (idx >= 7 && idx <= 10) return `Investigator ${idx - 6}`;
    return "External Node";
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-4xl font-black text-white shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)] border border-blue-400/30">B</div>
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">BioVeritas <span className="text-blue-500">PRO</span></h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{status}</p>
        </div>
      </div>
      <div className="flex gap-6 items-center">
        <div className="bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all">
          <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Active Identity</p>
          <select 
            className="bg-transparent text-xs font-bold text-blue-400 outline-none cursor-pointer"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          >
            {availableAccounts.map((acc: string) => (
              <option key={acc} value={acc} className="bg-slate-900">
                {getRoleLabel(acc)} ({acc.slice(0, 8)}...)
              </option>
            ))}
          </select>
        </div>
        <div className="bg-slate-950/80 px-8 py-4 rounded-3xl border border-slate-800 text-center">
           <p className="text-[9px] text-slate-500 font-black mb-1 uppercase tracking-widest">Protocol TVL</p>
           <p className="text-xl font-black text-emerald-400">{tvl} <span className="text-xs text-slate-500 font-normal">BVT</span></p>
        </div>
        <div className="bg-slate-950/80 px-8 py-4 rounded-3xl border border-slate-800 text-center">
          <p className="text-[9px] text-slate-500 font-black mb-1 uppercase tracking-widest">Current Rewards</p>
          <p className="text-xl font-black text-blue-400">{balance}</p>
        </div>
      </div>
    </header>
  );
}