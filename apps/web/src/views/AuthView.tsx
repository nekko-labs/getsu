import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CloudOff, Mail, Sparkles } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import { useCloud } from '../state/cloud';
import {
  isCloudConfigured,
  signInWithEmail,
  signInWithPassword,
  signUpWithPassword,
  sendPasswordReset,
} from '../lib/supabase';

type Mode = 'signin' | 'signup' | 'reset';

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  signin: {
    title: 'Welcome back',
    sub: 'Sign in to sync your journal across your devices.',
    cta: 'Sign in',
  },
  signup: {
    title: 'Begin your journal',
    sub: 'One account, and your months follow you everywhere.',
    cta: 'Create account',
  },
  reset: {
    title: 'Reset your password',
    sub: "We'll email you a link to choose a new one.",
    cta: 'Send reset link',
  },
};

/** Supabase error strings are technical; translate the common ones to calm,
 *  human sentences and keep the rest as-is. */
function humanizeError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return "That email and password don't match. Try again, or reset your password below.";
  if (m.includes('already registered')) return 'An account with this email already exists. Sign in instead.';
  if (m.includes('password should be')) return 'Passwords need at least 6 characters.';
  if (m.includes('rate limit')) return 'Too many tries for now. Wait a minute and try again.';
  if (m.includes('email not confirmed')) return 'This email is waiting on confirmation. Check your inbox for the link we sent.';
  return message;
}

/**
 * The account door: sign in / create account / reset password, plus the
 * passwordless magic-link path. Entirely optional; when Supabase isn't
 * configured this page simply explains that the app is local-only.
 */
export default function AuthView() {
  const navigate = useNavigate();
  const configured = isCloudConfigured();
  const session = useCloud((s) => s.session);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Already signed in (or the moment sign-in lands): go to Account & sync.
  useEffect(() => {
    if (session) navigate('/account', { replace: true });
  }, [session, navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);
    const addr = email.trim();
    if (!addr) { setError('Enter your email address first.'); return; }
    if (mode !== 'reset' && !password) { setError('Enter your password too.'); return; }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await signInWithPassword(addr, password);
        if (error) setError(humanizeError(error));
        // success: the auth listener updates the session and the effect redirects
      } else if (mode === 'signup') {
        const { error, confirmEmail } = await signUpWithPassword(addr, password);
        if (error) setError(humanizeError(error));
        else if (confirmEmail) setNotice('Almost there. We sent a confirmation link to your email; tap it and you’re in.');
      } else {
        const { error } = await sendPasswordReset(addr);
        if (error) setError(humanizeError(error));
        else setNotice('Reset link sent. Check your inbox.');
      }
    } finally {
      setBusy(false);
    }
  };

  const magicLink = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    const addr = email.trim();
    if (!addr) { setError('Enter your email above, then tap the magic link again.'); return; }
    setBusy(true);
    try {
      const { error } = await signInWithEmail(addr);
      if (error) setError(humanizeError(error));
      else setNotice('Magic link sent. Check your email and tap it to sign in, no password needed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandMark size={56} />
        <h1 className="serif mt-5 text-3xl font-semibold leading-tight">{configured ? COPY[mode].title : 'Local only'}</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
          {configured
            ? COPY[mode].sub
            : 'This build runs fully offline; every feature works and your journal lives on this device. There is nothing to sign in to.'}
        </p>
      </div>

      {!configured ? (
        <div className="card p-5 text-center">
          <CloudOff size={20} className="mx-auto mb-2" style={{ color: 'var(--text-faint)' }} />
          <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
            Accounts only exist for Premium cloud sync, and this build isn't connected to a cloud.
          </p>
          <Link to="/pricing" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--accent)' }}>
            <Sparkles size={14} /> See what Premium adds →
          </Link>
        </div>
      ) : notice ? (
        <div className="card flex items-start gap-3 p-5">
          <Check size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
          <div>
            <p className="text-sm leading-relaxed">{notice}</p>
            <button
              className="mt-2 text-sm font-medium"
              style={{ color: 'var(--accent)' }}
              onClick={() => setNotice(null)}
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <form className="card space-y-3 p-5" onSubmit={submit}>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {mode !== 'reset' && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Password</span>
              <input
                className="input"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}

          {error && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--error)' }}>{error}</p>
          )}

          <button className="btn btn-primary w-full justify-center" type="submit" disabled={busy}>
            {busy ? 'One moment…' : COPY[mode].cta}
          </button>

          {mode !== 'reset' && (
            <button
              type="button"
              className="btn w-full justify-center"
              onClick={magicLink}
              disabled={busy}
            >
              <Mail size={15} /> Email me a magic link instead
            </button>
          )}
        </form>
      )}

      {configured && (
        <div className="mt-5 space-y-1.5 text-center text-sm" style={{ color: 'var(--text-soft)' }}>
          {mode === 'signin' && (
            <>
              <p>
                New here?{' '}
                <button className="font-medium" style={{ color: 'var(--accent)' }} onClick={() => switchMode('signup')}>
                  Create an account
                </button>
              </p>
              <p>
                <button className="font-medium" style={{ color: 'var(--text-faint)' }} onClick={() => switchMode('reset')}>
                  Forgot your password?
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button className="font-medium" style={{ color: 'var(--accent)' }} onClick={() => switchMode('signin')}>
                Sign in
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <p>
              Remembered it?{' '}
              <button className="font-medium" style={{ color: 'var(--accent)' }} onClick={() => switchMode('signin')}>
                Back to sign in
              </button>
            </p>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/you" className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-faint)' }}>
          <ArrowLeft size={14} /> Back to your journal
        </Link>
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: 'var(--text-faint)' }}>
        No account is ever required to journal. Signing in only adds Premium cloud sync;
        your local months stay on this device and merge, never overwrite.
      </p>
    </div>
  );
}
