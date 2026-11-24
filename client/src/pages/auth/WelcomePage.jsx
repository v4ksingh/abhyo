import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, Sparkles, Building2,
  GraduationCap, ShieldCheck, Clock, BookOpen,
  Award, PlayCircle, PauseCircle, ChevronRight
} from 'lucide-react';

export default function WelcomePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract registration state
  const state = location.state || {};
  const {
    name = '',
    email = '',
    role = 'student',
    instituteName = '',
    trialInfo = null,
    pendingApproval = false,
    isOlympiad = false,
  } = state;

  const COUNTDOWN_SECONDS = 5;
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef(null);

  // Confetti / Celebration Particle Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#10b981', '#059669', '#34d399', '#6366f1', '#8b5cf6', '#f59e0b', '#3b82f6'];
    const particles = Array.from({ length: 70 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.4 - 50,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 4,
      speedY: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    let startTime = Date.now();
    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        // Fade out slightly over 4 seconds
        const opacity = Math.max(0, 1 - elapsed / 5000);
        ctx.globalAlpha = opacity;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (elapsed < 5000) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (isPaused) return;

    if (timeLeft <= 0) {
      handleRedirect();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPaused]);

  const handleRedirect = () => {
    navigate('/login', {
      replace: true,
      state: {
        email: email || '',
        fromWelcome: true,
        role: role,
        name: name,
      },
    });
  };

  const isInstitute = role === 'institute';
  const displayName = name ? name.split(' ')[0] : (isInstitute ? 'Institute Partner' : 'Aspirant');
  const fullOrgName = instituteName || (name ? `${name}'s Institute` : 'Your Institute');

  // Calculate circular progress percentage
  const progressPercent = ((COUNTDOWN_SECONDS - timeLeft) / COUNTDOWN_SECONDS) * 100;
  const strokeDashoffset = 100 - progressPercent;

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden select-none"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background celebration canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-20 w-full h-full"
      />

      {/* Decorative ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-emerald-100/60 via-teal-50/40 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Abhyo" className="h-10 md:h-12 w-auto object-contain" />
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Registration Completed
        </span>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-xl bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-10 text-center relative overflow-hidden">
          
          {/* Subtle top banner glow */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

          {/* Animated Success Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce duration-1000">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white stroke-[2.5]" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md animate-pulse">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Title & Personalized Greeting */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            Welcome to Abhyo{name ? `, ${displayName}!` : '! 🎉'}
          </h1>

          <p className="text-slate-600 text-sm sm:text-base font-medium max-w-md mx-auto mb-6">
            {isInstitute ? (
              <>
                Your institute registration for <strong className="text-slate-800">{fullOrgName}</strong> has been successfully submitted!
              </>
            ) : isOlympiad ? (
              <>
                Your Olympiad student account is set up and ready to empower your exam preparation.
              </>
            ) : (
              <>
                Your account is ready! Get ready to test your knowledge, track your growth, and ace your exams.
              </>
            )}
          </p>

          {/* Status or Trial Highlight */}
          {isInstitute && pendingApproval ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left mb-6 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Verification in Progress
                </p>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Your institute profile is under fast-track review by our administration. You can sign in anytime to manage your credentials and view updates.
                </p>
              </div>
            </div>
          ) : trialInfo?.trialActive ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left mb-6 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  🎁 Free Premium Trial Activated
                </p>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Enjoy complimentary access to tests and learning resources until{' '}
                  <span className="font-semibold">
                    {new Date(trialInfo.trialEndDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>.
                </p>
              </div>
            </div>
          ) : null}

          {/* Feature Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
            {isInstitute ? (
              <>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-0.5">Student Batches</h4>
                  <p className="text-[11px] text-slate-500">Organize and assign mock tests effortlessly.</p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-0.5">Auto-Grading</h4>
                  <p className="text-[11px] text-slate-500">Instant results, ranks & detailed analytics.</p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-0.5">Brand Identity</h4>
                  <p className="text-[11px] text-slate-500">Your coaching institute portal & reports.</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-0.5">500+ Mock Tests</h4>
                  <p className="text-[11px] text-slate-500">Subject-wise tests based on actual exam patterns.</p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-0.5">AI Insights</h4>
                  <p className="text-[11px] text-slate-500">Deep performance breakdown & speed analysis.</p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-0.5">Rank Tracking</h4>
                  <p className="text-[11px] text-slate-500">Compare ranks across India in real-time.</p>
                </div>
              </>
            )}
          </div>

          {/* Countdown & Auto-Redirect Box */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-xs font-semibold text-slate-700">
                  Redirecting to Login Page in{' '}
                  <span className="text-emerald-600 font-extrabold text-sm">{timeLeft}s</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                title={isPaused ? 'Resume countdown' : 'Pause countdown'}
              >
                {isPaused ? (
                  <>
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((COUNTDOWN_SECONDS - timeLeft) / COUNTDOWN_SECONDS) * 100}%` }}
              />
            </div>
          </div>

          {/* Call to Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              id="proceed-login-btn"
              onClick={handleRedirect}
              className="w-full flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Proceed to Login Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Subtle footer reminder */}
          <p className="text-[11px] text-slate-400 mt-4">
            A confirmation email has also been sent to{' '}
            <strong className="text-slate-600">{email || 'your registered email'}</strong>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-slate-400 relative z-10">
        © {new Date().getFullYear()} Abhyo Exam Assessment Platform. All rights reserved.
      </footer>
    </div>
  );
}
