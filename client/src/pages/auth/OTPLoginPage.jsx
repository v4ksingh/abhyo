import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

export default function OTPLoginPage() {
  const [step, setStep] = useState(1); // 1: enter mobile/email, 2: enter OTP
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contactType, setContactType] = useState('mobile');
  const { verifyOTP } = useAuthStore();
  const navigate = useNavigate();

  const sendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/send-otp', {
        [contactType]: contact,
      });
      toast.success(`OTP sent to ${contact}`);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = { otp, [contactType]: contact };
      if (name) data.name = name;
      const { user } = await verifyOTP(data);
      toast.success(`Welcome, ${user.name}!`);
      const redirectMap = {
        superadmin: '/admin/dashboard',
        admin: '/admin/dashboard',
        accountant: '/admin/revenue',
        content_manager: '/admin/questions',
        teacher: '/admin/questions',
        institute: '/institute/dashboard',
        student: '/student/dashboard',
        instructor: '/instructor/courses',
      };
      navigate(redirectMap[user.role] || '/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center mt-4 mb-8">
          <img src="/logo.png" alt="Abhyo" className="h-14 w-auto" />
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {step === 1 ? 'Login with OTP' : 'Enter OTP'}
          </h2>
          <p className="text-slate-500 mb-6 text-sm">
            {step === 1 ? 'We\'ll send a 6-digit code to your mobile/email' : `Enter the OTP sent to ${contact}`}
          </p>

          {step === 1 ? (
            <form onSubmit={sendOTP} className="space-y-4">
              <div className="flex bg-slate-100 rounded-xl p-1 mb-2">
                {['mobile', 'email'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContactType(type)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${contactType === type ? 'bg-primary-600 text-white' : 'text-slate-500'
                      }`}
                  >
                    {type === 'mobile' ? '📱 Mobile' : '📧 Email'}
                  </button>
                ))}
              </div>

              <div>
                <label className="label">{contactType === 'mobile' ? 'Mobile Number' : 'Email Address'}</label>
                <input
                  type={contactType === 'mobile' ? 'tel' : 'email'}
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="input-field"
                  placeholder={contactType === 'mobile' ? '9999999999' : 'you@example.com'}
                  required
                />
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Send OTP</span><ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-300">
                <CheckCircle size={16} />
                OTP sent to {contact}
              </div>

              <div>
                <label className="label">Enter Your Name (if new user)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="label">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="input-field text-2xl tracking-widest font-mono text-center"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Verify OTP</span><ArrowRight size={16} /></>}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); }}
                className="text-primary-400 hover:text-primary-300 text-sm w-full text-center"
              >
                ← Back / Resend OTP
              </button>
            </form>
          )}
        </div>

        <p className="text-slate-500 text-sm text-center mt-6">
          Have a password?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
