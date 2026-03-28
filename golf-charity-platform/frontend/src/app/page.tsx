import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Trophy, Heart, TrendingUp, Shield, ChevronRight, Star, Users, DollarSign } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8 animate-fade-up">
            <Heart className="w-3.5 h-3.5 fill-current" />
            Every round you play funds a cause you believe in
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6 animate-fade-up animate-delay-100">
            Play Golf.<br />
            <span className="gradient-text">Win Prizes.</span><br />
            Change Lives.
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up animate-delay-200">
            The subscription platform where your Stableford scores enter you into monthly prize draws — 
            while funding the charities that matter most to you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animate-delay-300">
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-4 glow">
              Start Playing for Good
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/charity" className="btn-secondary text-lg px-8 py-4">
              Explore Charities
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16 animate-fade-up animate-delay-400">
            {[
              { value: '£50K+', label: 'Raised for Charity' },
              { value: '2,400+', label: 'Active Players' },
              { value: '£12K', label: 'Monthly Prize Pool' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-2xl font-bold text-brand-400">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">How GolfGives Works</h2>
            <p className="section-subtitle max-w-xl mx-auto">
              Three simple steps. Real impact. Real prizes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: TrendingUp,
                title: 'Enter Your Scores',
                desc: 'Log your last 5 Stableford scores. Each score (1–45) becomes your entry numbers for the monthly draw.',
                color: 'brand',
              },
              {
                step: '02',
                icon: Trophy,
                title: 'Win Monthly Prizes',
                desc: 'Match 3, 4, or 5 numbers from the draw. 5-match jackpots roll over if unclaimed — pools can grow massive.',
                color: 'gold',
              },
              {
                step: '03',
                icon: Heart,
                title: 'Fund Your Charity',
                desc: 'A portion of every subscription goes directly to the charity you choose. Play more, give more.',
                color: 'brand',
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="card group hover:border-brand-500/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-4 right-4 font-display text-6xl font-bold text-white/3">{step}</div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  color === 'gold' ? 'bg-gold-500/10 text-gold-400' : 'bg-brand-500/10 text-brand-400'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Structure */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent to-dark-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">Prize Pool Structure</h2>
            <p className="section-subtitle">Every active subscriber contributes to the pool. More players = bigger prizes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { match: '5 Numbers', prize: '40% of Pool', badge: '🏆 Jackpot', rollover: 'Rolls over if unclaimed!', highlight: true },
              { match: '4 Numbers', prize: '35% of Pool', badge: '🥈 Second Tier', rollover: 'Split between winners' },
              { match: '3 Numbers', prize: '25% of Pool', badge: '🥉 Third Tier', rollover: 'Split between winners' },
            ].map(({ match, prize, badge, rollover, highlight }) => (
              <div key={match} className={`card text-center ${highlight ? 'border-gold-500/30 bg-gold-500/5' : ''}`}>
                <div className="text-2xl mb-3">{badge.split(' ')[0]}</div>
                <div className="text-sm font-medium text-slate-400 mb-1">{badge.split(' ').slice(1).join(' ')}</div>
                <div className="font-display text-3xl font-bold text-white my-3">{match}</div>
                <div className={`text-lg font-bold ${highlight ? 'text-gold-400' : 'text-brand-400'}`}>{prize}</div>
                <div className="text-xs text-slate-500 mt-2">{rollover}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charity Section */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="badge-green mb-6">💚 Charity First</div>
              <h2 className="section-title mb-6">
                Your game funds<br />
                <span className="gradient-text">causes you love</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Choose from our curated list of verified charities at signup. A minimum of 10% of your 
                subscription goes directly to your chosen charity — and you can increase that any time.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                From youth golf programs to medical research, environmental conservation to veteran support — 
                your membership creates real, tangible change.
              </p>
              <Link href="/charity" className="btn-primary">
                Browse Charities <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Golf for Good', cat: 'Youth Sports', raised: '£125K', emoji: '⛳' },
                { name: 'Fairway Hearts', cat: 'Medical Research', raised: '£89K', emoji: '❤️' },
                { name: 'Green Earth Golf', cat: 'Environment', raised: '£45K', emoji: '🌿' },
                { name: 'Veterans on the Fairway', cat: 'Veterans', raised: '£67K', emoji: '🎖️' },
              ].map((c) => (
                <div key={c.name} className="card-hover">
                  <div className="text-3xl mb-3">{c.emoji}</div>
                  <div className="font-semibold text-white text-sm mb-1">{c.name}</div>
                  <div className="text-xs text-slate-500 mb-2">{c.cat}</div>
                  <div className="text-brand-400 text-sm font-bold">{c.raised} raised</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4 border-t border-white/5" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-subtitle">Cancel any time. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              {
                plan: 'Monthly',
                price: '£19.99',
                period: '/month',
                features: ['Monthly prize draw entry', 'Score tracking (5 scores)', 'Charity contributions', 'Winner verification', 'Full dashboard access'],
                cta: 'Start Monthly',
                href: '/auth/register?plan=monthly',
              },
              {
                plan: 'Yearly',
                price: '£199.99',
                period: '/year',
                savings: 'Save £40/year',
                features: ['Everything in Monthly', '2 months free', 'Priority support', 'Early draw results', 'Exclusive yearly badge'],
                cta: 'Start Yearly',
                href: '/auth/register?plan=yearly',
                highlight: true,
              },
            ].map(({ plan, price, period, features, cta, href, highlight, savings }) => (
              <div key={plan} className={`card relative ${highlight ? 'border-brand-500/40 bg-brand-500/5' : ''}`}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-green px-4">
                    Most Popular
                  </div>
                )}
                {savings && (
                  <div className="badge-gold mb-4">{savings}</div>
                )}
                <div className="font-display text-xl font-bold text-white mb-2">{plan}</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl font-bold text-white">{price}</span>
                  <span className="text-slate-400">{period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={href} className={highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-white">
                Golf<span className="text-brand-400">Gives</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/charity" className="hover:text-slate-300 transition-colors">Charities</Link>
              <Link href="/draw" className="hover:text-slate-300 transition-colors">Monthly Draw</Link>
              <Link href="/auth/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
            </div>
            <p className="text-sm text-slate-600">© 2025 GolfGives. Play. Win. Give.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
