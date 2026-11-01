'use client';
import { useRouter } from 'next/navigation';
import { Shield, GraduationCap, MessageSquare, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const portals = [
    {
      title: 'Staff & Admin Hub',
      description: 'Manage QA, CRM tickets, team tasks, and platform analytics.',
      icon: Shield,
      href: '/login',
      color: 'from-blue-600 to-cyan-500',
      shadow: 'shadow-blue-500/30'
    },
    {
      title: 'Student Portal',
      description: 'Take All-India mock tests with strict proctoring and offline caching.',
      icon: GraduationCap,
      href: '/student',
      color: 'from-purple-600 to-pink-500',
      shadow: 'shadow-purple-500/30'
    },
    {
      title: 'Doubt Engine',
      description: 'Ask doubts and watch mentors race to solve them for payouts.',
      icon: MessageSquare,
      href: '/doubts',
      color: 'from-orange-500 to-yellow-400',
      shadow: 'shadow-orange-500/30'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse delay-1000"></div>

      <div className="max-w-5xl w-full relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 opacity-0 animate-fade-up">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-4 rounded-3xl shadow-2xl shadow-blue-500/30">
              <Zap size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4">
            TryIT <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Ecosystem</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            The ultimate zero-cost EdTech platform for India. Select a portal to continue.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portals.map((portal, i) => (
            <div 
              key={portal.title}
              onClick={() => router.push(portal.href)}
              className={`bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl cursor-pointer group hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl ${portal.shadow} opacity-0 animate-fade-up delay-${i+1}`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${portal.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <portal.icon size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">{portal.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{portal.description}</p>
              
              <div className="flex items-center text-white font-bold text-sm group-hover:text-blue-400 transition-colors">
                Enter Portal <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-20 text-gray-600 text-sm font-medium">
          © 2026 TryIT Educations. Built for Bharat.
        </div>
      </div>
    </div>
  );
}
