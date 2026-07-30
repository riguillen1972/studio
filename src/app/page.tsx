'use client';

import Link from 'next/link';
import { Bot, Sparkles, BookOpen, Brain, Zap, GraduationCap, Shield, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const features = [
  { icon: Brain, title: 'AI Tutor & Research Mode', desc: 'Get instant explanations with conversational AI, or toggle to Research Mode for direct, factual answers without educational fluff.' },
  { icon: BookOpen, title: 'Homework Help', desc: 'Scan your homework or type a question — get step-by-step hints, never just answers.' },
  { icon: Zap, title: '30+ AI Tools', desc: 'Summarizer, quiz generator, flashcards, essay helper, and more — all powered by AI.' },
  { icon: GraduationCap, title: 'Career-Optimized', desc: 'AI tailored to your major or career path for the most relevant study experience.' },
  { icon: Shield, title: 'Teacher Dashboard', desc: 'Teachers can monitor students, set AI limits, and manage class codes in real time.' },
  { icon: Sparkles, title: 'Mini-App Generator', desc: 'Describe any learning tool and AI builds it for you instantly — interactive and shareable.' },
];

const plans = [
  { name: 'Free', price: '$0', period: '/forever', desc: 'Get started with essential tools', features: ['Gemini 2.5 Flash-Lite model', '250k tokens/month', 'AI Tutor & Homework Help', 'Quiz & Flashcard Generator', 'Ad-supported'], cta: 'Get Started Free', highlighted: false },
  { name: 'Pro', price: '$15', period: '/month', desc: 'Unlock premium AI models', badge: 'POPULAR', features: ['Gemini 2.5 Flash & Pro', '1.5M tokens/month', 'All 30+ AI Tools', 'Ad-free experience', 'Priority support'], cta: 'Start Pro Trial', highlighted: true },
  { name: 'Max', price: '$25', period: '/month', desc: 'Maximum power for serious students', features: ['Gemini 2.5 Flash + Claude Haiku 4.5', '4M tokens/month', 'AI Mini-App Generator', 'Custom learning apps', 'Highest priority support'], cta: 'Go Max', highlighted: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden">
      {/* Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-pink-500/20 via-orange-400/10 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-500/15 to-transparent blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Study Buddy AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="/terms" className="hover:text-white transition-colors">Terms</a>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm text-white/80 hover:text-white transition-colors">Sign in</Link>
          <Link href="/login" className="px-5 py-2.5 text-sm font-medium bg-white text-[#0a0e1a] rounded-full hover:bg-white/90 transition-all hover:shadow-lg hover:shadow-white/10">
            Get started <ChevronRight className="inline h-4 w-4 ml-0.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <motion.section className="relative z-10 px-6 md:px-12 lg:px-20 pt-20 md:pt-32 pb-24" initial="hidden" animate="visible" variants={stagger}>
        <motion.p variants={fadeUp} transition={{ duration: 0.6 }} className="text-sm font-medium text-blue-400 mb-6 tracking-wide">
          POWERED BY GOOGLE GEMINI
        </motion.p>
        <motion.h1 variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] tracking-tight max-w-5xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <span className="text-white">AI-powered learning </span>
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">to accelerate </span>
          <span className="bg-gradient-to-r from-pink-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent">your education</span>
          <span className="text-white/40">—from homework help to exam prep.</span>
        </motion.h1>
        <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-wrap gap-4 mt-10">
          <Link href="/login" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-xl hover:shadow-blue-500/25 transition-all text-base">
            Get started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/20 text-white font-medium rounded-full hover:bg-white/5 transition-all text-base">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Sign up with Google
          </Link>
        </motion.div>
      </motion.section>

      {/* Stats Bar */}
      <motion.section className="relative z-10 border-t border-white/10 py-10 px-6 md:px-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }}>
        <div className="flex flex-wrap justify-center md:justify-start gap-12 md:gap-20 text-center md:text-left">
          {[['10K+', 'Active Students'], ['500K+', 'Questions Answered'], ['30+', 'AI-Powered Tools'], ['99.9%', 'Uptime']].map(([stat, label]) => (
            <div key={label}><p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{stat}</p><p className="text-sm text-white/50 mt-1">{label}</p></div>
          ))}
        </div>
      </motion.section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
          <motion.p variants={fadeUp} className="text-sm font-medium text-purple-400 mb-4 tracking-wide">FEATURES</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold max-w-2xl mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Everything you need to study smarter</motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-white/50 max-w-xl mb-16">A complete AI learning platform designed for students and teachers at every level.</motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} transition={{ delay: i * 0.05 }} className="group p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-5 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                  <f.icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
          <motion.p variants={fadeUp} className="text-sm font-medium text-pink-400 mb-4 tracking-wide">PRICING</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold max-w-2xl mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Simple, transparent pricing</motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-white/50 max-w-xl mb-16">Start free, upgrade when you need more power. No hidden fees.</motion.p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} variants={fadeUp} transition={{ delay: i * 0.1 }} className={`relative p-8 rounded-2xl border transition-all duration-300 ${plan.highlighted ? 'border-blue-500/50 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent shadow-xl shadow-blue-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}>
                {plan.badge && <span className="absolute -top-3 left-8 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-xs font-bold rounded-full tracking-wider">{plan.badge}</span>}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-white/50 mb-5">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>
                <Link href="/login" className={`block text-center py-3 rounded-full font-medium text-sm transition-all mb-8 ${plan.highlighted ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25' : 'border border-white/20 text-white hover:bg-white/5'}`}>
                  {plan.cta}
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Star className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 p-12 md:p-20 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"><div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-blue-500/20 to-transparent blur-3xl rounded-full" /></div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold max-w-2xl mx-auto mb-4 relative" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ready to transform your studying?</motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-white/50 max-w-lg mx-auto mb-8 relative">Join thousands of students using AI to learn faster, study smarter, and achieve more.</motion.p>
          <motion.div variants={fadeUp} className="relative">
            <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0a0e1a] font-semibold rounded-full hover:shadow-xl hover:shadow-white/10 transition-all text-base">
              Start learning for free <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 md:px-20 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><Bot className="h-4 w-4 text-white" /></div>
            <span className="font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Study Buddy AI</span>
          </div>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
          </div>
          <p className="text-sm text-white/30">© {new Date().getFullYear()} Study Buddy AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
