import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { Trophy, Star } from 'lucide-react';

async function getDraws() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/draws`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return data.draws || [];
  } catch { return []; }
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default async function DrawPage() {
  const draws = await getDraws();

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-16">
            <div className="badge-gold mx-auto mb-6 w-fit">🏆 Monthly Draws</div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Prize Draw Results
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Draws happen every month. Match 3, 4, or all 5 numbers to win a share of the prize pool.
            </p>
          </div>

          {/* How the draw works */}
          <div className="card mb-16 bg-gold-500/5 border-gold-500/15">
            <h2 className="font-semibold text-white mb-6">How the Draw Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { num: '1', title: 'Your Scores = Your Numbers', desc: 'Your last 5 Stableford scores (1–45) are your draw numbers for the month.' },
                { num: '2', title: 'Monthly Draw', desc: '5 numbers are drawn each month — either randomly or via our weighted algorithmic system.' },
                { num: '3', title: 'Match & Win', desc: 'Match 3+ of the drawn numbers to win a share of that tier\'s prize pool.' },
              ].map(({ num, title, desc }) => (
                <div key={num}>
                  <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center font-bold text-gold-400 text-sm mb-3">{num}</div>
                  <h3 className="font-semibold text-white mb-2 text-sm">{title}</h3>
                  <p className="text-sm text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prize tiers */}
          <div className="grid md:grid-cols-3 gap-4 mb-16">
            {[
              { match: '5 Numbers', pct: '40%', label: 'Jackpot', rollover: '★ Rolls over if unclaimed', highlight: true },
              { match: '4 Numbers', pct: '35%', label: '2nd Tier', rollover: 'Split between winners' },
              { match: '3 Numbers', pct: '25%', label: '3rd Tier', rollover: 'Split between winners' },
            ].map(({ match, pct, label, rollover, highlight }) => (
              <div key={match} className={`card text-center ${highlight ? 'border-gold-500/30 bg-gold-500/5' : ''}`}>
                <div className="font-display text-2xl font-bold text-white mb-1">{match}</div>
                <div className={`text-3xl font-bold my-3 ${highlight ? 'text-gold-400' : 'text-brand-400'}`}>{pct}</div>
                <div className="text-sm text-slate-400 mb-1">{label}</div>
                <div className="text-xs text-slate-500">{rollover}</div>
              </div>
            ))}
          </div>

          {/* Draw results */}
          <h2 className="font-semibold text-white mb-6">Past Draw Results</h2>
          {draws.length === 0 ? (
            <div className="card text-center py-16">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">No draws published yet</h3>
              <p className="text-slate-400 text-sm">Results appear here after each monthly draw is published.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {draws.map((d: any) => (
                <div key={d._id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">{MONTHS[d.month - 1]} {d.year}</h3>
                    <span className="badge-green">Published</span>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {d.drawnNumbers.map((n: number) => (
                      <div key={n} className="w-10 h-10 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center font-bold text-brand-300 text-sm">
                        {n}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-slate-400">
                    {d.winners.length} winner{d.winners.length !== 1 ? 's' : ''} · 
                    Pool: £{(d.prizePool.total / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <p className="text-slate-400 mb-6">Subscribe to enter next month&apos;s draw</p>
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-4 glow">
              <Trophy className="w-5 h-5" /> Join & Enter the Draw
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
