import { Check, ArrowRight, ChefHat, MessageCircle, Zap, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Heard</span>
          </div>
          <Link to="/dashboard">
            <Button size="sm" variant="outline">Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 lg:px-8 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          Stop Chasing Your Restaurant
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          A restaurant operations system built by restaurant people. Prep, side work, logs, vendors, cash, maintenance, and manager follow-up in one place.
        </p>
        <div className="flex flex-col lg:flex-row gap-4 justify-center">
          <Button size="lg" className="h-12 px-8">
            Request Demo <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8">
            See How It Works
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 lg:px-8 bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">The Problem Every Restaurant Faces</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="font-semibold mb-4">You're losing time on:</p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span> Answering the same prep questions over and over
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span> Chasing staff to verify completed checklists
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span> Tracking who did what and when
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span> Finding vendor numbers and delivery schedules
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span> Counting cash drawers manually
                </li>
              </ul>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="font-semibold mb-4">The cost:</p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span> Missed maintenance issues escalate
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span> No visibility into actual completion rates
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span> Inconsistent photo documentation
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span> Compliance gaps go unnoticed
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span> Staff spending shift time on admin work
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Built for Every Role</h2>
          <div className="grid lg:grid-cols-4 gap-6">
            {[
              { role: "GM", tasks: "Full visibility into all operations, compliance tracking, incident reports" },
              { role: "Chef", tasks: "Prep assignments, station management, side work oversight, team performance" },
              { role: "FOH Manager", tasks: "Side work tracking, bathroom checks, cash counts, pre-shift notes" },
              { role: "Owner", tasks: "Daily reports, vendor management, performance trends, compliance records" },
            ].map((item, idx) => (
              <div key={idx} className="bg-card border-2 border-border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-3 text-accent">{item.role}</h3>
                <p className="text-sm text-muted-foreground">{item.tasks}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-4 lg:px-8 bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Everything You Need</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {[
              { icon: Zap, title: "Prep Management", desc: "Assign, track, and verify prep with photo proof" },
              { icon: MessageCircle, title: "Side Work", desc: "One-touch assignments, approvals, and follow-ups" },
              { icon: BarChart3, title: "Daily Operations", desc: "Temperature logs, maintenance, cash counts, vendors" },
              { icon: ChefHat, title: "Built for Restaurants", desc: "By restaurant people who know your workflow" },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <item.icon className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After */}
      <section className="py-20 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Before and After</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8">
              <h3 className="text-lg font-bold mb-6 text-red-600">Before Heard</h3>
              <ul className="space-y-3 text-sm text-foreground">
                <li className="flex gap-3">
                  <span className="text-red-500">✗</span> Paper checklists lost or incomplete
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500">✗</span> No proof tasks were actually done
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500">✗</span> Managers spend 2+ hours on admin daily
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500">✗</span> Compliance issues discovered too late
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500">✗</span> No visibility until things go wrong
                </li>
              </ul>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8">
              <h3 className="text-lg font-bold mb-6 text-green-600">After Heard</h3>
              <ul className="space-y-3 text-sm text-foreground">
                <li className="flex gap-3">
                  <span className="text-green-500">✓</span> All tasks tracked with photo proof
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500">✓</span> Real-time completion visibility
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500">✓</span> Admin work cut by 70%
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500">✓</span> Issues flagged immediately
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500">✓</span> Manager reports generated daily
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 lg:px-8 bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">From Restaurant Teams</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { quote: "Finally, I know what's actually being done during service.", author: "Chef, 50-seat bistro" },
              { quote: "Cut our manager admin time in half. They're on the floor now.", author: "GM, Casual Dining Chain" },
              { quote: "Compliance issues we'd never catch are now flagged the same day.", author: "Owner, Multi-unit Operator" },
            ].map((item, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm mb-4 text-foreground italic">"{item.quote}"</p>
                <p className="text-xs text-muted-foreground font-semibold">— {item.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "How long does implementation take?", a: "Most restaurants are live in 1-2 weeks. We handle setup and basic training." },
              { q: "Can we customize it for our restaurant?", a: "Yes. Roles, task categories, and workflows are fully customizable." },
              { q: "Do you integrate with our POS?", a: "We integrate with major POS systems. Ask us about your system." },
              { q: "What if staff don't use it?", a: "We help you establish the habit. Most see adoption within days due to the ease of use." },
              { q: "Is there a mobile app?", a: "Full mobile-responsive design works on all phones. Native apps coming soon." },
            ].map((item, idx) => (
              <details key={idx} className="bg-card border border-border rounded-xl p-6 group">
                <summary className="font-semibold cursor-pointer flex items-center justify-between">
                  {item.q}
                  <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-4">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Placeholder */}
      <section className="py-20 px-4 lg:px-8 bg-secondary/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground mb-8">Pricing based on location count and features. No long-term contracts.</p>
          <Button size="lg" className="h-12 px-8">
            Get a Pricing Quote
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 lg:px-8">
        <div className="max-w-3xl mx-auto bg-primary/10 border-2 border-primary rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Reclaim Your Floor Time?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            See how Heard helps GMs, Chefs, and Owners manage operations efficiently.
          </p>
          <Button size="lg" className="h-12 px-8">
            Request a Demo <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 lg:px-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Heard. Built for restaurants by restaurant people.</p>
      </footer>
    </div>
  );
}