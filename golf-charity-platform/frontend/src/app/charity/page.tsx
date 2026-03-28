import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { Heart, Search, ExternalLink } from 'lucide-react';

// Server-side fetch for SEO
async function getCharities() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/charities`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return data.charities || [];
  } catch { return []; }
}

export default async function CharitiesPage() {
  const charities = await getCharities();
  const featured = charities.filter((c: any) => c.featured);

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <div className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="badge-green mx-auto mb-6 w-fit">💚 Making a difference</div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Charities We Support
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Every subscription, every score, every draw — a portion goes directly to these incredible organisations.
            </p>
          </div>

          {/* Featured */}
          {featured.length > 0 && (
            <div className="mb-16">
              <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-6">Featured Charities</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featured.map((c: any) => (
                  <div key={c._id} className="card border-brand-500/20 bg-brand-500/4">
                    <div className="flex items-start gap-4">
                      {c.logo && (
                        <img src={c.logo} alt={c.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{c.name}</h3>
                          <span className="badge-green">Featured</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-3 line-clamp-3">{c.description}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-brand-400 text-sm font-medium">
                            £{(c.totalReceived / 100).toLocaleString()} raised
                          </span>
                          <span className="text-slate-500 text-xs">{c.category}</span>
                        </div>
                        {c.events?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-slate-500 mb-1">Upcoming Events</p>
                            {c.events.slice(0, 1).map((ev: any, i: number) => (
                              <p key={i} className="text-xs text-slate-300">{ev.title} — {new Date(ev.date).toLocaleDateString()}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All charities */}
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-6">All Charities</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {charities.map((c: any) => (
              <div key={c._id} className="card-hover">
                <div className="flex items-center gap-3 mb-4">
                  {c.logo ? (
                    <img src={c.logo} alt={c.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-2xl flex-shrink-0">💚</div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{c.name}</h3>
                    <p className="text-xs text-slate-500">{c.category}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 line-clamp-3 mb-4">{c.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-brand-400 text-sm font-medium">
                    £{(c.totalReceived / 100).toLocaleString()} raised
                  </span>
                  <Heart className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            ))}
          </div>

          {charities.length === 0 && (
            <div className="card text-center py-16">
              <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Charities will appear here once they are added to the platform.</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-20 card text-center py-16 bg-brand-500/5 border-brand-500/10">
            <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to play for good?</h2>
            <p className="text-slate-400 mb-8">Join GolfGives and choose a charity to support with every subscription.</p>
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-4 glow">
              Start Your Subscription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
