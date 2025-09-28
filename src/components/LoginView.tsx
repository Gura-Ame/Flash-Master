import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export function LoginView() {
  const { t } = useTranslation();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm bg-base-100 rounded-xl shadow border border-base-300 p-6 space-y-4">
        <h2 className="text-xl font-bold text-base-content">
          {mode === 'signin' ? t('Sign In') : t('Sign Up')}
        </h2>
        {error && (
          <div className="alert alert-error text-sm">
            {error}
          </div>
        )}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="form-control">
            <span className="label-text">{t('Email')}</span>
            <input
              type="email"
              className="input input-bordered"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="form-control">
            <span className="label-text">{t('Password')}</span>
            <input
              type="password"
              className="input input-bordered"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? t('Loading') : mode === 'signin' ? t('Sign In') : t('Sign Up')}
          </button>
        </form>
        <div className="divider">{t('OR')}</div>
        <button className="btn btn-outline w-full" onClick={() => signInWithGoogle()}>
          {t('Continue with Google')}
        </button>
        <div className="text-sm text-base-content/70 text-center">
          {mode === 'signin' ? (
            <button className="link" onClick={() => setMode('signup')}>{t("Don't have an account? Sign up")}</button>
          ) : (
            <button className="link" onClick={() => setMode('signin')}>{t('Already have an account? Sign in')}</button>
          )}
        </div>
      </div>
    </div>
  );
}


