import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckSquare, Thermometer, Wrench, Truck, DollarSign, AlertTriangle, TrendingUp, Book, Wine, Users } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: ClipboardList, label: "Prep Lists", description: "Photo-verified prep with station assignments" },
  { icon: CheckSquare, label: "FOH Side Work", description: "Task assignments with photo proof" },
  { icon: Thermometer, label: "Temperature Logs", description: "Health dept compliance tracking" },
  { icon: Wrench, label: "Maintenance", description: "Request and track facility repairs" },
  { icon: Truck, label: "Vendor Directory", description: "Contact info and order tracking" },
  { icon: DollarSign, label: "Cash Drawer", description: "Daily count and variance tracking" },
  { icon: AlertTriangle, label: "Incident Reports", description: "Document and follow up on issues" },
  { icon: TrendingUp, label: "Shift Handoff", description: "Pass critical info to next shift" },
  { icon: Book, label: "Build Book", description: "Recipe storage with photos" },
  { icon: Wine, label: "Bar Book", description: "Cocktail recipes and specs" },
];

const personas = [
  { title: "Restaurant Owners", description: "See operations at a glance, spot bottlenecks" },
  { title: "General Managers", description: "Track team performance and daily compliance" },
  { title: "Chefs", description: "Manage prep stations and prioritize tasks" },
  { title: "FOH Managers", description: "Coordinate side work and guest experiences" },
  { title: "Bar Managers", description: "Manage inventory, recipes, and staff" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">K</span>
            </div>
            <span className="font-bold text-lg">KitchenFlow</span>
          </div>
          <Link to="/profile">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 lg:py-32 text-center space-y-6">
        <motion.h1
          className="text-4xl lg:text-6xl font-bold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Run every restaurant shift<br />from one command center.
        </motion.h1>

        <motion.p
          className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          KitchenFlow keeps prep, side work, temp logs, maintenance, cash, vendors, incidents, and manager handoff organized in one place.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button size="lg" className="text-base">View Demo Restaurant</Button>
          <Button size="lg" variant="outline" className="text-base">Request a Demo</Button>
        </motion.div>
      </section>

      {/* Problem */}
      <section className="bg-card border-y border-border py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold">The Problem</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Managers are stuck chasing checklists, answering repeat questions, tracking repairs, checking side work, and trying to remember what happened last shift.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 pt-6">
            <div className="bg-background border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">Scattered Systems</h3>
              <p className="text-sm text-muted-foreground">Prep on paper, side work on clipboard, temps in a notebook.</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">No Accountability</h3>
              <p className="text-sm text-muted-foreground">Hard to prove tasks were done or remember why something failed.</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-2">Compliance Risk</h3>
              <p className="text-sm text-muted-foreground">Temperature logs missing. Incident reports incomplete. Health inspections stressful.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="max-w-6xl mx-auto px-4 py-16 lg:py-24 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl lg:text-4xl font-bold">The Solution</h2>
          <p className="text-lg text-muted-foreground">One dashboard for daily restaurant operations.</p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <feature.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{feature.label}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who It's For */}
      <section className="bg-card border-y border-border py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold">Who It's For</h2>
            <p className="text-lg text-muted-foreground">Built for every role in the restaurant.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {personas.map((persona, i) => (
              <motion.div
                key={persona.title}
                className="bg-background border border-border rounded-xl p-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Users className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold mb-2">{persona.title}</h3>
                <p className="text-sm text-muted-foreground">{persona.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Snapshot */}
      <section className="max-w-6xl mx-auto px-4 py-16 lg:py-24 space-y-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold">See It In Action</h2>
          <p className="text-lg text-muted-foreground">A real shift summary from a demo restaurant.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 lg:p-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Prep */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Prep Lists</span>
                <span className="text-2xl font-bold text-accent">82%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: "82%" }} />
              </div>
              <p className="text-xs text-muted-foreground">18 of 22 items complete</p>
            </motion.div>

            {/* Side Work */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Side Work</span>
                <span className="text-2xl font-bold text-accent">74%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: "74%" }} />
              </div>
              <p className="text-xs text-muted-foreground">14 of 19 tasks done</p>
            </motion.div>

            {/* Temp Logs */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Temp Logs</span>
                <span className="text-lg font-bold text-red-500">3 overdue</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-600 font-medium">Cooler #2 pending</p>
              </div>
              <p className="text-xs text-muted-foreground">Action needed</p>
            </motion.div>

            {/* Maintenance */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Maintenance</span>
                <span className="text-lg font-bold">2 open</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium">Ice machine leak</p>
                <p className="text-xs text-muted-foreground">Reported: 2 days ago</p>
              </div>
            </motion.div>

            {/* Photos */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Photo Review</span>
                <span className="text-lg font-bold">5 pending</span>
              </div>
              <p className="text-xs text-muted-foreground">Prep photos awaiting approval from sous chef</p>
            </motion.div>

            {/* Shift Handoff */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Handoff</span>
                <span className="text-lg font-bold text-orange-500">1 urgent</span>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <p className="text-xs font-medium text-orange-700">Vendor issue needs GM</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-primary text-primary-foreground py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold">Ready to simplify daily operations?</h2>
            <p className="text-lg opacity-90">Start running your restaurant like a command center.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-base">View Demo Restaurant</Button>
            <Button size="lg" variant="outline" className="text-base border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">Request a Demo</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 KitchenFlow. Built for restaurants, by restaurant people.</p>
        </div>
      </footer>
    </div>
  );
}