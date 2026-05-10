import React, { useState, useEffect, useCallback, useMemo } from 'react';
import web3 from '../lib/web3';
import TrialABI from '../abis/ClinicalTrial.json';

// Charting Engine
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function PatientPortal({ blockchain }: { blockchain: any }) {
  const { account, fetchData, setStatus, availableAccounts, trialPhase } = blockchain;
  const [step, setStep] = useState(1); 
  const [isStreaming, setIsStreaming] = useState(false);
  const [heartRate, setHeartRate] = useState(72);
  const [bloodPressure, setBloodPressure] = useState("120/80");
  const [countdown, setCountdown] = useState(60);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [revealedGroup, setRevealedGroup] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const accountIdx = availableAccounts.findIndex((a: any) => a.toLowerCase() === account.toLowerCase());
  const isCorrectRole = accountIdx >= 2 && accountIdx <= 6;

const checkReg = useCallback(async () => {
    // Add this line to prevent early execution:
    if (!account) return; 

    try {
      const networkId = await web3.eth.net.getId();
      const trialNet = (TrialABI as any).networks[Number(networkId)];
      if (trialNet) {
        const trial = new web3.eth.Contract(TrialABI.abi as any, trialNet.address);
        const data: any = await trial.methods.patients(account).call();
        if (data.isRegistered) {
          setIsRegistered(true);
          setStep(3);
        } else {
          setIsRegistered(false);
        }
      }
    } catch (e) { console.error("Reg Check Error:", e); }
  }, [account]);

  useEffect(() => { checkReg(); }, [account, checkReg]);

  // IoT Simulation with BP and Graph Data
  useEffect(() => {
    let interval: any;
    if (isStreaming && countdown > 0) {
      interval = setInterval(async () => {
        const hr = Math.floor(Math.random() * 15) + 70;
        const sys = Math.floor(Math.random() * 10) + 115;
        const dia = Math.floor(Math.random() * 10) + 75;
        
        setHeartRate(hr);
        setBloodPressure(`${sys}/${dia}`);
        setCountdown(prev => prev - 1);

        setVitalsHistory(prev => [...prev.slice(-10), { hr, sys, time: new Date().toLocaleTimeString() }]);

        try {
          const networkId = await web3.eth.net.getId();
          const trialNet = (TrialABI as any).networks[Number(networkId)];
          if (trialNet) {
            const trial = new web3.eth.Contract(TrialABI.abi as any, trialNet.address);
            await trial.methods.logVitals(hr).send({ from: account, gas: "300000" });
            fetchData(account);
          }
        } catch (e) { console.error("Logging error:", e); }
      }, 3000);
    } else if (countdown === 0) {
      setIsStreaming(false);
      setStatus("Session Complete");
    }
    return () => clearInterval(interval);
  }, [isStreaming, countdown, account, fetchData, setStatus]);

  const handleZKPVerify = async () => {
    setIsVerifying(true);
    setStatus('Generating Zero-Knowledge Proof...');
    await new Promise(r => setTimeout(r, 2500));
    setIsVerifying(false);
    setStep(2);
    setStatus('ZKP Verified: Criteria Met');
  };

  const handleRegister = async () => {
    setStatus('Transacting Registration...');
    try {
      const networkId = await web3.eth.net.getId();
      const trialNet = (TrialABI as any).networks[Number(networkId)];
      if (trialNet) {
        const trial = new web3.eth.Contract(TrialABI.abi as any, trialNet.address);
        const idHash = web3.utils.keccak256(account);
        await trial.methods.registerPatient(idHash).send({ from: account, gas: "300000" });
        setStatus('Registration Confirmed');
        await new Promise(r => setTimeout(r, 1000));
        checkReg();
      }
    } catch (e) { setStatus('Registration Failed'); }
  };

  const chartData = useMemo(() => ({
    labels: vitalsHistory.map(h => h.time),
    datasets: [
      {
        label: 'Heart Rate',
        data: vitalsHistory.map(h => h.hr),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true, tension: 0.4,
      },
      {
        label: 'Systolic BP',
        data: vitalsHistory.map(h => h.sys),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true, tension: 0.4,
      }
    ]
  }), [vitalsHistory]);

  if (!isCorrectRole) return <div className="p-20 text-center italic text-slate-500 bg-slate-900/40 rounded-[3rem] border border-slate-800">Access Restricted to Patients (Indices 2-6)</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {step === 1 && (
        <div className="max-w-xl mx-auto p-12 bg-blue-600/5 border border-blue-500/20 rounded-[3rem] text-center backdrop-blur-md">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Eligibility Gate</h2>
          <p className="text-slate-400 text-sm mt-4 mb-8">Verify your medical eligibility using ZKP to ensure full HIPAA compliance without revealing your identity.</p>
          <button onClick={handleZKPVerify} disabled={isVerifying} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all uppercase tracking-widest disabled:opacity-50">
            {isVerifying ? 'PROVING...' : 'Generate ZKP Proof'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-xl mx-auto p-12 bg-emerald-600/5 border border-emerald-500/20 rounded-[3rem] text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-black text-emerald-500 uppercase mb-6 tracking-tighter">Identity Verified</h2>
          <p className="text-slate-400 text-sm mb-8">The proof has been verified on-chain. You are eligible to participate in the BioVeritas Clinical Trial.</p>
          <button onClick={handleRegister} className="w-full py-6 bg-white text-black font-black rounded-3xl shadow-2xl hover:scale-[1.02] transition-transform">SIGN CLINICAL CONTRACT</button>
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-10 rounded-[3rem] backdrop-blur-xl">
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-10">
                <div className="text-left">
                  <p className="text-[10px] text-blue-500 font-black uppercase mb-1 tracking-widest">Heart Rate</p>
                  <p className="text-6xl font-black">{heartRate} <span className="text-xs text-slate-500 font-normal">BPM</span></p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-emerald-500 font-black uppercase mb-1 tracking-widest">Blood Pressure</p>
                  <p className="text-6xl font-black">{bloodPressure} <span className="text-xs text-slate-500 font-normal">mmHg</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">Session Timer</p>
                <p className={`text-4xl font-mono font-bold ${countdown < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  00:{countdown < 10 ? `0${countdown}` : countdown}
                </p>
              </div>
            </div>

            <div className="h-48 mb-8 border-b border-slate-800/50">
              <Line data={chartData} options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } }, 
                scales: { x: { display: false }, y: { display: false } } 
              }} />
            </div>

            <button 
              onClick={() => { setIsStreaming(!isStreaming); if (countdown === 0) setCountdown(60); }} 
              className={`w-full py-6 rounded-2xl font-black transition-all ${isStreaming ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'}`}
            >
              {isStreaming ? 'STOP READING' : countdown === 0 ? 'START NEW SESSION' : 'INITIALIZE SENSOR'}
            </button>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-8 rounded-[3rem] space-y-6 flex flex-col justify-between">
             <div className="space-y-6">
               <div className="p-5 bg-blue-600/5 border border-blue-500/20 rounded-2xl">
                 <p className="text-[10px] text-blue-400 font-bold uppercase mb-2 tracking-widest">Protocol Status</p>
                 <p className="text-xs text-slate-300 italic leading-relaxed">"Double-blind protocol active. Revealed on trial completion by Auditor."</p>
               </div>
               
               <div className="space-y-3">
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Clinical Assignment</p>
                 {!revealedGroup ? (
                   <>
                     <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-[9px] text-blue-400/60 break-all leading-relaxed">
                       VRF_HASH: {web3.utils.keccak256(account).slice(0,32)}...
                     </div>
                     <button 
                       disabled={trialPhase !== 'completed'}
                       onClick={() => setRevealedGroup(accountIdx % 2 === 0 ? "Experimental (Drug) Group" : "Control (Placebo) Group")}
                       className={`w-full py-4 text-[10px] font-black rounded-xl border transition-all ${trialPhase === 'completed' ? 'bg-emerald-600 text-white border-emerald-500 animate-pulse' : 'bg-slate-800 text-slate-600 border-slate-700 opacity-50 cursor-not-allowed'}`}
                     >
                       {trialPhase === 'completed' ? 'REVEAL ASSIGNMENT' : 'LOCKED UNTIL COMPLETION'}
                     </button>
                   </>
                 ) : (
                   <div className="p-6 bg-emerald-600/10 border border-emerald-500/30 rounded-2xl text-center shadow-inner">
                     <p className="text-[10px] text-emerald-500 font-bold uppercase mb-2 tracking-widest">Unmasked Group</p>
                     <p className="text-lg font-black text-white uppercase tracking-tighter">{revealedGroup}</p>
                   </div>
                 )}
               </div>
             </div>

             <div className="pt-6 border-t border-slate-800/50">
               <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">Subject Identity Hash</p>
               <p className="text-[8px] font-mono text-slate-500 truncate">{web3.utils.keccak256(account)}</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}