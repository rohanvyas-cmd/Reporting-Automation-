import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import logoImage from '../assets/image.png';

export default function LoginPage({ onSignIn }) {
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  async function handleGoogleSuccess(credentialResponse) {
    setError(null);
    setVerifying(true);
    try {
      await onSignIn(credentialResponse.credential);
    } catch (err) {
      setError(err.message ?? 'Sign-in failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-10 flex flex-col items-center gap-6">
          {/* Logo + title */}
          <div className="flex flex-col items-center gap-3">
            <img src={logoImage} alt="GTM Dashboard" className="h-12 w-12 object-contain" />
            <div className="text-center">
              <h1 className="text-xl font-bold text-blue-700 tracking-tight">GTM Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">Sign in to access your sales data</p>
            </div>
          </div>

          <div className="w-full border-t border-gray-100" />

          {/* Google sign-in */}
          <div className="flex flex-col items-center gap-3 w-full">
            {verifying ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Verifying…
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                theme="outline"
                size="large"
                width="280"
              />
            )}

            {error && (
              <p className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-lg px-4 py-2 w-full">
                {error}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Access is restricted to approved team members only.
          </p>
        </div>
      </div>
    </div>
  );
}
