import { Zap, Shield, Sparkles } from "lucide-react";
import Testimonials from "./components/Testimonials";

const features = [
  { icon: "⚡", title: "Lightning Fast", description: "Experience seamless performance that elevates your workflow to the next level." },
  { icon: "🔒", title: "Enterprise Security", description: "Robust, cutting-edge protection so you can focus on what matters most." },
  { icon: "🤖", title: "AI-Powered", description: "Harness the power of AI to unlock your team's full potential." },
  { icon: "📊", title: "Smart Analytics", description: "Transform raw data into actionable insights, empowering smarter decisions." },
];

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 text-center">
        <div className="absolute -top-40 left-1/2 h-96 w-96 rounded-full bg-purple-600 blur-3xl opacity-30" />
        <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-300">✨ New: AI Workflows</span>
        <h1 className="mt-6 text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
          Supercharge Your Productivity 🚀
        </h1>
        <p className="mt-6 text-xl text-gray-400">
          In today's fast-paced digital landscape, NovaFlow isn't just a tool — it's your all-in-one partner for seamless collaboration.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <a href="#" className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 shadow-lg shadow-purple-500/50">Get Started</a>
          <a href="#" className="rounded-full border border-white/20 px-8 py-4 backdrop-blur-md">Learn More</a>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <h2 className="text-center text-4xl font-bold">Why Choose Us?</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <div className="text-4xl">{f.icon}</div>
              <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-gray-400">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-3 gap-6 py-16 text-center">
        <div className="rounded-2xl bg-white/5 p-8"><h3 className="text-4xl font-bold">10,000+</h3><p>Happy Customers</p></div>
        <div className="rounded-2xl bg-white/5 p-8"><h3 className="text-4xl font-bold">99.9%</h3><p>Uptime</p></div>
        <div className="rounded-2xl bg-white/5 p-8"><h3 className="text-4xl font-bold">10x</h3><p>Faster Delivery</p></div>
      </section>

      <Testimonials />

      {/* CTA Section */}
      <section className="py-24 text-center">
        <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
        <p className="mt-4 text-gray-400">Join thousands of teams who trust NovaFlow to streamline their workflow and boost productivity.</p>
        <button className="mt-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-10 py-4">Start Your Free Trial!</button>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-gray-500">
        <p>© 2024 NovaFlow. All rights reserved.</p>
        <a href="https://twitter.com">Twitter</a> <a href="https://linkedin.com/">LinkedIn</a> <a href="#">Privacy</a>
      </footer>
    </div>
  );
}
