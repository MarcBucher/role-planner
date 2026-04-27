import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseConfigured } from '../lib/supabase';

type Mode = 'login' | 'register' | 'forgot';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/', { replace: true });
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Bestätigungs-E-Mail wurde gesendet. Bitte prüfe deinen Posteingang.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setInfo('Passwort-Reset-Link wurde gesendet.');
        setMode('login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-[#e5e7eb] p-6">
          <div className="px-0 pb-4 mb-4 border-b border-[#e5e7eb]">
            <h2 className="font-semibold text-[#24303e] font-display">Supabase nicht konfiguriert</h2>
          </div>
          <p className="text-sm text-[#56606c] mb-3">
            Erstelle eine <code className="bg-[#f0f0f0] px-1">.env.local</code> Datei im Projekt-Root mit:
          </p>
          <pre className="bg-[#f0f0f0] p-3 text-xs font-mono text-[#24303e] mb-3 overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
          <p className="text-xs text-[#767676]">
            Dann führe das SQL-Schema aus <code className="bg-[#f0f0f0] px-1">supabase/migrations/0001_init.sql</code> in deinem Supabase SQL-Editor aus und starte den Dev-Server neu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-[#38b5aa] flex items-center justify-center shrink-0">
            <span className="text-[#24303e] font-bold text-sm font-display">SN</span>
          </div>
          <div>
            <p className="font-semibold text-[#24303e] font-display leading-tight">Role Planner</p>
            <p className="text-xs text-[#767676]">ServiceNow Rollenkonzept</p>
          </div>
        </div>

        <div className="bg-white border border-[#e5e7eb]">
          <div className="px-5 py-4 border-b border-[#e5e7eb]" style={{ backgroundColor: '#24303e' }}>
            <h2 className="font-semibold font-display" style={{ color: '#ffffff' }}>
              {mode === 'login' ? 'Anmelden' : mode === 'register' ? 'Registrieren' : 'Passwort zurücksetzen'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
            )}
            {info && (
              <div className="px-3 py-2 bg-[#38b5aa]/10 border border-[#38b5aa]/30 text-sm text-[#24303e]">{info}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#24303e] mb-1">E-Mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e5e7eb] focus:outline-none focus:border-[#38b5aa] bg-[#f0f0f0]"
                placeholder="name@beispiel.ch"
                autoComplete="email"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-[#24303e] mb-1">Passwort</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e5e7eb] focus:outline-none focus:border-[#38b5aa] bg-[#f0f0f0]"
                  placeholder="Mindestens 6 Zeichen"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 text-sm font-semibold bg-[#38b5aa] text-[#24303e] hover:bg-[#2ea095] transition-colors disabled:opacity-50"
            >
              {loading ? 'Bitte warten…' : mode === 'login' ? 'Anmelden' : mode === 'register' ? 'Konto erstellen' : 'Link senden'}
            </button>
          </form>

          <div className="px-5 pb-5 flex flex-col gap-2 text-center">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('register')} className="text-xs text-[#38b5aa] hover:underline">
                  Noch kein Konto? Registrieren
                </button>
                <button onClick={() => setMode('forgot')} className="text-xs text-[#767676] hover:underline">
                  Passwort vergessen
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => setMode('login')} className="text-xs text-[#767676] hover:underline">
                Zurück zur Anmeldung
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
