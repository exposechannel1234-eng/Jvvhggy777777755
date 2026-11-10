import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { CreditPackage } from '../types';
import confetti from 'canvas-confetti';
import {
  Zap,
  X,
  Sparkles,
  Gift,
  Check,
  Clock,
  ArrowUpRight,
  History,
  Coins,
  ShieldCheck,
  Music,
  FileText,
  Wand2,
  Download,
} from 'lucide-react';

const PACKAGES: CreditPackage[] = [
  {
    id: 'starter-pack',
    name: 'Starter Creator',
    credits: 250,
    priceEur: 4.99,
    perks: ['25 Dual Mixes of 50 Single Tracks', 'AI Lyrics Assistant access', 'High-res Album Artwork', 'Standard Synth Engine'],
  },
  {
    id: 'pro-studio',
    name: 'Pro Studio',
    credits: 1000,
    priceEur: 14.99,
    popular: true,
    perks: [
      '100 Dual Mixes of 200 Single Tracks',
      'Priority GPU Generation',
      'Unlimited Prompt Enhancer',
      'Full Stem Separation access',
      'Commercial License rights',
    ],
  },
  {
    id: 'studio-vip',
    name: 'Studio VIP Master',
    credits: 3000,
    priceEur: 29.99,
    perks: [
      '300 Dual Mixes of 600 Single Tracks',
      'Lossless Studio WAV downloads',
      'VIP Cloud Rendering Queue',
      'Custom Voice Cloning support',
      'Lifetime Stored Cloud Library',
    ],
  },
];

export const CreditsModal: React.FC = () => {
  const {
    credits,
    transactions,
    canClaimDaily,
    nextClaimMs,
    isCreditsModalOpen,
    closeCreditsModal,
    claimDailyBonus,
    purchaseCredits,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'packages' | 'history' | 'rates'>('packages');
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [purchasingPkgId, setPurchasingPkgId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isCreditsModalOpen) return null;

  const handleClaimBonus = async () => {
    setIsClaimingBonus(true);
    setFeedbackMessage(null);
    try {
      const res = await claimDailyBonus();
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#A855F7', '#EC4899', '#EAB308'],
        });
        setFeedbackMessage('🎉 +25 Gratis Credits succesvol toegevoegd aan je studio saldo!');
      } else {
        setFeedbackMessage(res.message);
      }
    } finally {
      setIsClaimingBonus(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchasingPkgId(pkg.id);
    setFeedbackMessage(null);
    try {
      await purchaseCredits(pkg);
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#A855F7', '#8B5CF6', '#10B981', '#F59E0B'],
      });
      setFeedbackMessage(`✨ Gefeliciteerd! +${pkg.credits} credits zijn direct geactiveerd!`);
    } catch {
      setFeedbackMessage('Opwaardering kon niet worden voltooid.');
    } finally {
      setPurchasingPkgId(null);
      setTimeout(() => setFeedbackMessage(null), 4500);
    }
  };

  const hoursRemaining = Math.max(1, Math.ceil(nextClaimMs / (1000 * 60 * 60)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-[#0D0B18] border border-purple-500/30 rounded-2xl md:rounded-3xl shadow-2xl shadow-purple-950/60 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Neon Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-5 py-4 md:px-6 md:py-5 border-b border-purple-900/30 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>SONIQ Studio Credits</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30 font-bold">
                  Systeem
                </span>
              </h2>
              <p className="text-xs text-slate-400">Beheer je generatie saldo, pakketten en dagelijkse beloningen</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Balance Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 shadow-inner">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-mono font-extrabold text-white text-sm">{credits}</span>
              <span className="text-xs text-slate-400">CR</span>
            </div>

            <button
              onClick={closeCreditsModal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Bar */}
        {feedbackMessage && (
          <div className="px-5 py-2.5 bg-gradient-to-r from-purple-950/90 to-violet-950/90 border-b border-purple-500/30 text-xs md:text-sm font-medium text-purple-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Daily Bonus Drop Banner */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-purple-950/40 via-violet-950/30 to-pink-950/30 border-b border-purple-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Dagelijkse Creator Bonus Drop</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/30">
                  +25 GRATIS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Claim elke 24 uur 25 gratis studio credits om non-stop muziek te blijven creëren.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {canClaimDaily ? (
              <button
                onClick={handleClaimBonus}
                disabled={isClaimingBonus}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-lg shadow-yellow-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-black" />
                <span>{isClaimingBonus ? 'Bezig met claimen...' : 'Claim +25 Credits Nu'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-400 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Klaar over ~{hoursRemaining}u</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 flex gap-2 border-b border-purple-900/20">
          <button
            onClick={() => setActiveTab('packages')}
            className={`pb-2 px-3 text-xs md:text-sm font-semibold transition-colors relative ${
              activeTab === 'packages'
                ? 'text-purple-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pakketten Opwaarderen
            {activeTab === 'packages' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`pb-2 px-3 text-xs md:text-sm font-semibold transition-colors relative ${
              activeTab === 'rates'
                ? 'text-purple-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tarieven & Verbruik
            {activeTab === 'rates' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-3 text-xs md:text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'text-purple-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Transactie Historie</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300 font-mono">
              {transactions.length}
            </span>
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {/* TAB 1: PACKAGES */}
          {activeTab === 'packages' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {PACKAGES.map((pkg) => {
                const isSelected = purchasingPkgId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-2xl p-4.5 flex flex-col justify-between transition-all border ${
                      pkg.popular
                        ? 'bg-gradient-to-b from-[#1C1236] to-[#120B24] border-purple-500/50 shadow-xl shadow-purple-950/40'
                        : 'bg-[#120F22]/70 border-purple-900/30 hover:border-purple-700/40'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md shadow-purple-900/50">
                        Populairste Keuze
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="font-extrabold text-white text-base">{pkg.name}</span>
                        <span className="text-xs text-slate-400">éénmalig</span>
                      </div>

                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300">
                          €{pkg.priceEur.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 mb-4 flex items-center justify-between">
                        <span className="text-xs text-slate-300">Credits Totaal:</span>
                        <span className="font-mono font-bold text-yellow-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 fill-yellow-400" />
                          +{pkg.credits}
                        </span>
                      </div>

                      <ul className="space-y-2 mb-5">
                        {pkg.perks.map((perk, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handlePurchase(pkg)}
                      disabled={isSelected}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        pkg.popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/40 active:scale-95'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1] active:scale-95'
                      }`}
                    >
                      {isSelected ? (
                        <span>Bezig met toevoegen...</span>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Waardeer +{pkg.credits} op</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: RATES & CONSUMPTION */}
          {activeTab === 'rates' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Eerlijk & Transparant Verbruiksmodel
                </h3>
                <p className="text-xs text-slate-400">
                  Bij SONIQ AI betaal je alleen voor creatieve generaties. Playback, streamen, aanmaken van afspeellijsten en downloads zijn altijd 100% gratis en onbeperkt.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Dual Mix Song Generatie</div>
                      <div className="text-[11px] text-slate-400">Origineel + Alternatieve Mix (A & B)</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-purple-300 px-2 py-1 bg-purple-950/60 rounded-lg border border-purple-500/30">
                    10 Credits
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Single Mix Song Generatie</div>
                      <div className="text-[11px] text-slate-400">1 Volledige studiotrack</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-purple-300 px-2 py-1 bg-purple-950/60 rounded-lg border border-purple-500/30">
                    5 Credits
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">AI Lyrics Assistant</div>
                      <div className="text-[11px] text-slate-400">Volledig gestructureerde songteksten</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-pink-300 px-2 py-1 bg-pink-950/60 rounded-lg border border-pink-500/30">
                    2 Credits
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">AI Prompt Enhancer</div>
                      <div className="text-[11px] text-slate-400">Automatische optimalisatie & titels</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-300 px-2 py-1 bg-blue-950/60 rounded-lg border border-blue-500/30">
                    1 Credit
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">WAV Audio Downloads</div>
                      <div className="text-[11px] text-emerald-400">Onbeperkt exporteren naar apparaat</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-300 px-2 py-1 bg-emerald-950/60 rounded-lg border border-emerald-500/30">
                    GRATIS
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Dagelijkse Creator Drop</div>
                      <div className="text-[11px] text-emerald-400">Elke 24 uur automatisch gratis claimen</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-300 px-2 py-1 bg-emerald-950/60 rounded-lg border border-emerald-500/30">
                    +25 GRATIS
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  Nog geen transacties geregistreerd.
                </div>
              ) : (
                transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isPositive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{tx.description}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString('nl-NL', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-slate-300'
                          }`}
                        >
                          {isPositive ? `+${tx.amount}` : tx.amount} CR
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Saldo: {tx.balanceAfter}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-purple-900/30 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Veilige SSL Studio Transacties
          </span>
          <button
            onClick={closeCreditsModal}
            className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-xs transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
