import React, { useState, useMemo, useEffect } from 'react';
import { 
  Heart, 
  CheckCircle2,
  X,
  QrCode,
  Copy,
  ShieldCheck,
  Check,
  Trophy,
  Vote,
  Banknote,
  Navigation,
  FileText,
  Mail
} from 'lucide-react';
import { INITIAL_CAMPAIGNS, IBAN_NUMBER, COMMUNITY_GOAL } from './constants';
import { Campaign, Donation } from './types';
import { generateThankYouMessage } from './services/geminiService';

const App: React.FC = () => {
  // Persistence logic: Using a clean V3 key to ensure data saves correctly
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem('st_chris_v3_campaigns');
      return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
    } catch (e) {
      return INITIAL_CAMPAIGNS;
    }
  });

  const [donations, setDonations] = useState<Donation[]>(() => {
    try {
      const saved = localStorage.getItem('st_chris_v3_donations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Effect to handle persistence automatically
  useEffect(() => {
    localStorage.setItem('st_chris_v3_campaigns', JSON.stringify(campaigns));
    localStorage.setItem('st_chris_v3_donations', JSON.stringify(donations));
  }, [campaigns, donations]);

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  const [donationStep, setDonationStep] = useState<'details' | 'method' | 'payment' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'benefit' | 'cash' | null>(null);
  const [donorData, setDonorData] = useState({ name: '', amount: 0, schoolId: '', gender: '' });
  const [aiThankYou, setAiThankYou] = useState<string>('');
  
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Derived Statistics
  const totalRaised = useMemo(() => campaigns.reduce((acc, c) => acc + c.raised, 0), [campaigns]);
  const progressPercent = Math.min(100, Math.round((totalRaised / COMMUNITY_GOAL) * 100));
  const leadingCause = useMemo(() => [...campaigns].sort((a, b) => b.raised - a.raised)[0], [campaigns]);

  const handleCopyIBAN = () => {
    navigator.clipboard.writeText(IBAN_NUMBER);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const getRefCode = () => {
    if (!selectedCampaign) return '';
    const prefix = selectedCampaign.id === 'cancer-research' ? 'CR' : 'MR';
    const cleanName = donorData.name.substring(0, 3).replace(/\s+/g, '').toUpperCase();
    const genderInit = donorData.gender.charAt(0).toUpperCase() || 'X';
    return `${prefix}-${genderInit}-${donorData.schoolId}-${cleanName}`;
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(getRefCode());
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const startDonationFlow = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    setDonorData({
      name: formData.get('name') as string,
      amount: Number(formData.get('amount')),
      schoolId: formData.get('schoolId') as string,
      gender: formData.get('gender') as string
    });
    setDonationStep('method');
  };

  const confirmDonation = async () => {
    if (!selectedCampaign) return;
    
    const newDonation: Donation = {
      id: Math.random().toString(36).substr(2, 9),
      campaignId: selectedCampaign.id,
      amount: donorData.amount,
      donorName: donorData.name,
      donorGender: donorData.gender,
      schoolId: donorData.schoolId,
      method: paymentMethod!,
      timestamp: Date.now()
    };

    // Update State (Persistence is handled by the useEffect watching these states)
    setDonations(prev => [newDonation, ...prev]);
    setCampaigns(prev => prev.map(c => 
      c.id === selectedCampaign.id 
        ? { ...c, raised: c.raised + donorData.amount, donorCount: c.donorCount + 1 }
        : c
    ));

    // Success Screen Handling
    setDonationStep('success');
    try {
      const msg = await generateThankYouMessage(donorData.name, donorData.amount, selectedCampaign.title);
      setAiThankYou(msg);
    } catch (e) {
      setAiThankYou(`Thank you, ${donorData.name}! Your BHD ${donorData.amount} donation to ${selectedCampaign.title} has been recorded.`);
    }
  };

  const generateGmailLink = () => {
    const to = "admin@stchris.edu.bh";
    const subject = `FINAL REPORT: ${totalRaised} BHD Raised for St Chris`;
    let body = `Official St Christopher's School Fundraiser Report\n`;
    body += `==============================================\n\n`;
    
    donations.forEach((d, i) => {
      const campaignTitle = campaigns.find(c => c.id === d.campaignId)?.title || "Unknown";
      body += `${i+1}. ${d.donorName} (${d.donorGender}) [ID: ${d.schoolId}]\n`;
      body += `   BHD ${d.amount} for ${campaignTitle}\n`;
      body += `   Method: ${d.method.toUpperCase()} | Date: ${new Date(d.timestamp).toLocaleString()}\n\n`;
    });
    
    body += `SUMMARY:\n`;
    body += `Total Collected: ${totalRaised} BHD\n`;
    body += `Community Goal: ${COMMUNITY_GOAL} BHD\n`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const closeDonateModal = () => {
    setIsDonateModalOpen(false);
    setTimeout(() => {
      setDonationStep('details');
      setPaymentMethod(null);
      setDonorData({ name: '', amount: 0, schoolId: '', gender: '' });
      setAiThankYou('');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 text-stone-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-stone-200 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-800 p-2.5 rounded-xl shadow-lg">
              <Vote className="text-white w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl md:text-2xl tracking-tighter text-stone-900 leading-none">
              St Christopher's<br/><span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Official Fundraiser</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="p-3 text-stone-900 bg-white border border-stone-200 rounded-full shadow-sm hover:border-amber-700 transition-all flex items-center gap-2 group"
              title="Admin Panel"
            >
              <FileText className="w-4 h-4 text-stone-600 group-hover:text-amber-800" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Admin Panel</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative py-20 px-6 overflow-hidden bg-white border-b border-stone-100">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-8xl font-black text-stone-900 mb-8 leading-[0.9] tracking-tighter">
            Every BHD <span className="gradient-text">Matters.</span>
          </h1>
          
          <div className="max-w-4xl mx-auto bg-stone-50 rounded-[40px] shadow-2xl warm-shadow p-8 md:p-12 mb-12 border border-stone-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-10">
              <div className="flex flex-col items-center p-8 bg-white rounded-3xl border border-stone-200 shadow-sm">
                <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Poll Leader</p>
                <div className="flex items-center gap-3 mb-1">
                  <Trophy className="w-6 h-6 text-amber-600" />
                  <span className="text-2xl font-black text-stone-900">{leadingCause.title}</span>
                </div>
                <p className="text-amber-800 font-bold">{leadingCause.raised} BHD Collected</p>
              </div>
              <div className="flex flex-col items-center p-8 bg-amber-800 text-white rounded-3xl shadow-xl">
                <p className="text-amber-200 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Community Goal</p>
                <span className="text-4xl font-black mb-1">{totalRaised} / {COMMUNITY_GOAL} BHD</span>
                <p className="text-amber-200 text-xs font-bold uppercase tracking-widest">{progressPercent}% Achieved</p>
              </div>
            </div>
            
            <div className="w-full h-8 bg-stone-200 rounded-full overflow-hidden border border-stone-300 flex p-1.5 shadow-inner">
              {campaigns.map((c, idx) => (
                <div 
                  key={c.id}
                  className={`h-full transition-all duration-1000 first:rounded-l-full last:rounded-r-full ${idx === 0 ? 'bg-rose-600' : 'bg-emerald-600'}`}
                  style={{ width: `${totalRaised > 0 ? (c.raised / totalRaised) * 100 : 0}%` }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between mt-6 px-6">
              {campaigns.map((c, idx) => (
                <div key={c.id} className="text-left">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${idx === 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{c.title}</p>
                  <p className="text-2xl font-black text-stone-900">{c.raised} BHD</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Campaigns (Images Removed for Clean UI) */}
      <main className="max-w-6xl mx-auto px-6 py-24 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {campaigns.map((campaign, idx) => (
            <div key={campaign.id} className="bg-white rounded-[48px] border border-stone-200 shadow-xl overflow-hidden flex flex-col group hover:border-amber-200 transition-colors">
              <div className="p-12 flex-grow flex flex-col">
                <div className="mb-6">
                  <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest mb-4 inline-block shadow-lg">Choice {idx + 1}</span>
                  <h3 className="text-4xl font-black tracking-tight leading-tight text-stone-900">{campaign.title}</h3>
                </div>
                <p className="text-stone-600 font-medium italic mb-10 text-lg leading-relaxed">"{campaign.description}"</p>
                <div className="mt-auto">
                   <button 
                    onClick={() => { setSelectedCampaign(campaign); setIsDonateModalOpen(true); }}
                    className="w-full bg-stone-900 text-white py-6 rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-amber-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-stone-900/20 active:scale-95"
                  >
                    <Vote className="w-5 h-5" />
                    Cast Vote Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="mt-24 bg-amber-900 text-white rounded-[56px] p-12 md:p-20 relative overflow-hidden shadow-2xl">
           <Navigation className="absolute -right-20 -top-20 w-96 h-96 opacity-10 rotate-12" />
           <div className="relative z-10 max-w-2xl">
              <h2 className="text-5xl font-black mb-12 tracking-tighter text-white">School Voting Guide</h2>
              <div className="space-y-12">
                <div className="flex gap-8">
                  <div className="w-16 h-16 bg-amber-800 rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl shrink-0 border border-amber-700 text-white">1</div>
                  <div>
                    <h4 className="text-2xl font-black mb-2 tracking-tight text-white">Vote With Value</h4>
                    <p className="text-amber-100 opacity-90 leading-relaxed text-lg font-medium">Every Bahraini Dinar equals one vote. Higher donations mean more influence on the final result.</p>
                  </div>
                </div>
                <div className="flex gap-8">
                  <div className="w-16 h-16 bg-amber-800 rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl shrink-0 border border-amber-700 text-white">2</div>
                  <div>
                    <h4 className="text-2xl font-black mb-2 tracking-tight text-white">Reliable Methods</h4>
                    <p className="text-amber-100 opacity-90 leading-relaxed text-lg font-medium">Digital transfers via <strong>Benefit Pay</strong> or bring physical cash to <strong>Room 8C</strong>.</p>
                  </div>
                </div>
                <div className="flex gap-8">
                  <div className="w-16 h-16 bg-amber-800 rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl shrink-0 border border-amber-700 text-white">3</div>
                  <div>
                    <h4 className="text-2xl font-black mb-2 tracking-tight text-white">Real-Time Sync</h4>
                    <p className="text-amber-100 opacity-90 leading-relaxed text-lg font-medium">Your vote is saved instantly! Persistence ensures that every contribution is counted accurately.</p>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 py-24 px-6 border-t border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="text-center md:text-left">
             <div className="flex items-center gap-4 justify-center md:justify-start mb-6">
                <Heart className="text-amber-500 w-8 h-8 fill-amber-500" />
                <span className="text-white font-black text-3xl tracking-tighter">St Chris Fundraiser</span>
             </div>
             <p className="text-stone-500 text-xs font-black tracking-[0.4em] uppercase opacity-60">Education for Global Impact</p>
          </div>
          <div className="text-center">
             <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Deposit Location</p>
             <p className="text-white font-black text-2xl tracking-tight mb-1">Form Room 8C</p>
             <p className="text-amber-700 text-xs font-bold">St Christopher's School, Bahrain</p>
          </div>
          <button onClick={() => setIsAdminOpen(true)} className="flex items-center gap-2 bg-stone-900 text-stone-300 hover:text-white px-6 py-3 rounded-2xl border border-stone-800 transition-all text-xs font-black uppercase tracking-widest shadow-lg">
              <FileText className="w-4 h-4" />
              Admin Panel
          </button>
        </div>
      </footer>

      {/* Donation Modal */}
      {isDonateModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-xl animate-in fade-in" onClick={closeDonateModal}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[56px] shadow-3xl overflow-hidden animate-in zoom-in slide-in-from-bottom-20 duration-500">
            <button onClick={closeDonateModal} className="absolute top-10 right-10 text-stone-300 hover:text-stone-900 p-2 z-10"><X className="w-8 h-8" /></button>
            
            {donationStep === 'details' && (
              <div className="p-12">
                <div className="text-center mb-10">
                  <div className="w-24 h-24 bg-amber-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner"><Vote className="w-12 h-12 text-amber-800" /></div>
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight mb-2 text-stone-900">Cast Your Vote</h2>
                  <p className="text-amber-800 font-black text-xs uppercase tracking-widest">{selectedCampaign.title}</p>
                </div>

                <form onSubmit={startDonationFlow} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 px-1">Student ID</label>
                      <input name="schoolId" required placeholder="e.g. 1234" className="w-full px-6 py-5 rounded-[24px] border-2 border-stone-100 focus:border-amber-700 outline-none font-black text-stone-900 bg-stone-50/50" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 px-1">Gender</label>
                      <select name="gender" required className="w-full px-6 py-5 rounded-[24px] border-2 border-stone-100 focus:border-amber-700 outline-none font-black text-stone-900 appearance-none bg-stone-50/50">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 px-1">Full Name</label>
                    <input name="name" required placeholder="Name" className="w-full px-6 py-5 rounded-[24px] border-2 border-stone-100 focus:border-amber-700 outline-none font-black text-stone-900 bg-stone-50/50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 px-1 text-stone-900">BHD Contribution</label>
                    <input name="amount" type="number" required min="1" placeholder="BHD" className="w-full px-8 py-6 rounded-[32px] border-2 border-stone-100 focus:border-amber-700 outline-none font-black text-center text-5xl text-stone-900 bg-white shadow-inner" />
                  </div>
                  <button type="submit" className="w-full bg-stone-900 text-white py-7 rounded-[32px] font-black text-xl uppercase tracking-[0.2em] hover:bg-amber-800 shadow-2xl transition-all mt-4">Continue</button>
                </form>
              </div>
            )}

            {donationStep === 'method' && (
              <div className="p-12">
                <h2 className="text-4xl font-black text-stone-900 mb-12 text-center tracking-tight leading-tight px-6 text-stone-900">Payment Route</h2>
                <div className="space-y-6">
                  <button onClick={() => { setPaymentMethod('benefit'); setDonationStep('payment'); }} className="w-full p-10 bg-white border-2 border-stone-100 rounded-[40px] hover:border-amber-800 hover:bg-amber-50 transition-all flex items-center gap-10 shadow-sm group">
                    <div className="p-5 bg-amber-100 rounded-[24px] group-hover:bg-amber-200 transition-colors shadow-inner">
                      <QrCode className="w-12 h-12 text-amber-900" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-stone-900 text-2xl leading-none mb-2 tracking-tight">Benefit Pay</p>
                      <p className="text-xs text-stone-500 font-black uppercase tracking-widest">Instant Transfer</p>
                    </div>
                  </button>
                  <button onClick={() => { setPaymentMethod('cash'); setDonationStep('payment'); }} className="w-full p-10 bg-white border-2 border-stone-100 rounded-[40px] hover:border-amber-800 hover:bg-amber-50 transition-all flex items-center gap-10 shadow-sm group">
                    <div className="p-5 bg-amber-100 rounded-[24px] group-hover:bg-amber-200 transition-colors shadow-inner">
                      <Banknote className="w-12 h-12 text-amber-900" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-stone-900 text-2xl leading-none mb-2 tracking-tight">Cash (Room 8C)</p>
                      <p className="text-xs text-stone-500 font-black uppercase tracking-widest">Hand in person</p>
                    </div>
                  </button>
                </div>
                <button onClick={() => setDonationStep('details')} className="w-full mt-12 text-stone-400 font-black text-[10px] uppercase tracking-[0.5em] py-2 hover:text-stone-900 transition-colors">Go Back</button>
              </div>
            )}

            {donationStep === 'payment' && paymentMethod === 'benefit' && (
              <div className="p-10">
                <div className="bg-stone-900 p-10 rounded-[48px] text-white mb-10 shadow-2xl relative overflow-hidden">
                   <ShieldCheck className="absolute -right-4 -top-4 w-24 h-24 opacity-10 text-white" />
                   <div className="space-y-10">
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-stone-500 mb-3">1. Recipient IBAN</p>
                        <div className="bg-white/10 p-5 rounded-2xl flex items-center justify-between border border-white/10">
                          <code className="text-base font-black truncate mr-4 tracking-tight text-white">{IBAN_NUMBER}</code>
                          <button onClick={handleCopyIBAN} className="p-3 bg-white text-stone-900 rounded-xl shrink-0 shadow-lg hover:scale-105 transition-transform">
                            {copiedIban ? <Check className="w-5 h-5 text-stone-900" /> : <Copy className="w-5 h-5 text-stone-900" />}
                          </button>
                        </div>
                      </div>
                      <div className="bg-amber-500/10 p-8 rounded-3xl border border-amber-500/20 shadow-inner">
                        <p className="text-[10px] uppercase font-black text-amber-500 mb-4 tracking-widest">2. Required Reference (Copy!)</p>
                        <div className="bg-white p-5 rounded-2xl flex items-center justify-between shadow-2xl">
                          <code className="text-2xl font-black text-stone-900 truncate mr-4 tracking-tighter">{getRefCode()}</code>
                          <button onClick={handleCopyRef} className="p-3 bg-stone-900 text-white rounded-xl shrink-0 shadow-lg hover:scale-105 transition-transform">
                            {copiedRef ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
                          </button>
                        </div>
                        <p className="mt-5 text-[11px] font-black text-amber-200/90 leading-relaxed uppercase tracking-wide">Paste this into the 'Description' field in Benefit Pay so we can log your vote.</p>
                      </div>
                   </div>
                </div>
                <button onClick={confirmDonation} className="w-full bg-stone-900 text-white py-7 rounded-[32px] font-black text-xl tracking-widest hover:bg-amber-800 shadow-2xl active:scale-95 transition-all">I Have Sent the BHD</button>
              </div>
            )}

            {donationStep === 'payment' && paymentMethod === 'cash' && (
              <div className="p-14 text-center">
                <Navigation className="w-20 h-20 text-amber-800 mx-auto mb-8 animate-bounce" />
                <h2 className="text-4xl font-black text-stone-900 mb-6 tracking-tight text-stone-900">Visit Room 8C</h2>
                <div className="bg-stone-50 p-10 rounded-[40px] border-2 border-stone-100 mb-12 shadow-inner">
                   <p className="text-stone-900 font-black text-4xl mb-3 tracking-tighter text-stone-900">{donorData.amount} BHD</p>
                   <p className="text-stone-600 font-bold text-lg px-4 text-stone-600">Please provide this amount to the teacher in Room 8C. Student ID: <span className="text-amber-800 font-black">{donorData.schoolId}</span>.</p>
                </div>
                <button onClick={confirmDonation} className="w-full bg-stone-900 text-white py-7 rounded-[32px] font-black text-xl shadow-2xl hover:bg-amber-800 transition-all">I'm on my way</button>
              </div>
            )}

            {donationStep === 'success' && (
              <div className="p-16 text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-4xl font-black text-stone-900 mb-6 tracking-tight text-stone-900">Vote Saved!</h2>
                <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100 mb-12 italic text-stone-700 font-medium leading-relaxed shadow-sm text-stone-700">
                  {aiThankYou || `Thank you, ${donorData.name}. Your BHD ${donorData.amount} contribution has been permanently logged.`}
                </div>
                <button onClick={closeDonateModal} className="w-full bg-stone-900 text-white py-7 rounded-[32px] font-black text-xl shadow-2xl hover:bg-amber-800 transition-all active:scale-95">Return to Poll</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-2xl" onClick={() => setIsAdminOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[56px] shadow-3xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-200">
             <div className="bg-stone-900 p-12 text-white flex justify-between items-center relative">
               <ShieldCheck className="absolute left-0 top-0 w-32 h-32 opacity-10 -ml-10 -mt-10 text-white" />
               <div className="relative z-10">
                 <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4 text-white">
                   <FileText className="text-amber-500 w-10 h-10" />
                   Admin Panel
                 </h2>
                 <p className="text-stone-400 text-xs font-black uppercase tracking-[0.3em] mt-2">Fundraiser Data Control</p>
               </div>
               <button onClick={() => setIsAdminOpen(false)} className="text-white/40 hover:text-white transition-colors p-2 relative z-10"><X className="w-10 h-10" /></button>
             </div>
             
             <div className="p-12 flex-grow overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                  <button onClick={generateGmailLink} className="bg-amber-800 text-white p-6 rounded-[32px] font-black text-base flex items-center justify-center gap-3 hover:bg-amber-700 transition-all shadow-xl hover:-translate-y-1">
                    <Mail className="w-6 h-6 text-white" />
                    Open Gmail Report
                  </button>
                  <button onClick={() => { if(confirm("This will permanently delete ALL fundraiser data and reset the poll. Proceed?")) { localStorage.clear(); window.location.reload(); } }} className="bg-white border-2 border-stone-200 text-stone-400 font-black text-[11px] uppercase tracking-widest rounded-[32px] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all px-8">
                    Wipe All Data
                  </button>
                </div>

                <div className="space-y-8">
                  <h3 className="text-stone-900 text-sm font-black uppercase tracking-widest px-2">Live Votes ({donations.length})</h3>
                  {donations.length === 0 ? (
                    <div className="text-center py-24 bg-stone-50 rounded-[40px] border-4 border-dashed border-stone-100 flex flex-col items-center">
                      <p className="text-stone-400 font-black uppercase tracking-widest text-sm">No Votes Recorded Yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {donations.map(d => (
                        <div key={d.id} className="bg-stone-50 p-8 rounded-[36px] border border-stone-100 flex justify-between items-center group hover:bg-white hover:border-amber-200 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border-2 border-stone-100 text-amber-800 font-black text-xl shadow-sm">
                               {d.donorName.charAt(0)}
                             </div>
                             <div>
                               <p className="font-black text-stone-900 text-xl tracking-tight leading-none mb-2">{d.donorName}</p>
                               <div className="flex items-center gap-3 text-[10px] font-black text-stone-500 uppercase tracking-widest">
                                  <span className="bg-stone-200 px-2 py-0.5 rounded-md">{d.donorGender}</span>
                                  <span>ID: {d.schoolId}</span>
                                  <span className="text-amber-700 font-black">{d.method}</span>
                               </div>
                             </div>
                          </div>
                          <div className="text-right">
                            <p className="text-stone-900 font-black text-2xl tracking-tighter mb-1 text-stone-900">+{d.amount} BHD</p>
                            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{new Date(d.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             </div>
             
             <div className="p-8 bg-stone-50 border-t border-stone-100 text-center">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Admin System • St Christopher's School</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;