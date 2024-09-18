import { useNavigate, useSearchParams } from "@remix-run/react";
import { useEffect, useState } from "react";

export default function EmailVerified() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'success' || statusParam === 'error') {
      setStatus(statusParam);
    }
  }, [searchParams]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleResendVerification = async () => {
    setResendStatus('sending');
    try {
      const response = await fetch('/api/resend-verification-email', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        setResendStatus('sent');
      } else {
        throw new Error('Failed to resend verification email');
      }
    } catch (error) {
      console.error('Error:', error);
      setResendStatus('error');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 overflow-x-hidden overflow-y-auto map-background map-overlay">
        <div className="container mx-auto px-6 py-8 h-screen flex items-center justify-center">
          <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="bg-white bg-opacity-90 p-6 rounded-md">
              <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
                {status === 'success' ? 'Email Verified' : 'Verification Failed'}
              </h2>
              <p className="text-center text-gray-600 mb-6">
                {status === 'success' 
                  ? 'Your email has been successfully verified. You can now log in to your account.'
                  : 'We were unable to verify your email. Please try again or request a new verification email.'}
              </p>
              {status === 'success' ? (
                <button 
                  onClick={handleLogin} 
                  className="btn-primary w-full mb-4"
                >
                  Go to Login
                </button>
              ) : (
                <button 
                  onClick={handleResendVerification} 
                  className="btn-secondary w-full transition duration-300 ease-in-out transform hover:scale-105 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                  disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                >
                  {resendStatus === 'sending' ? 'Sending...' : 
                   resendStatus === 'sent' ? 'Email Sent' : 
                   resendStatus === 'error' ? 'Failed to Send' : 
                   'Resend Verification Email'}
                </button>
              )}
              {resendStatus === 'sent' && (
                <p className="text-green-600 text-sm text-center mt-2">
                  Verification email has been resent. Please check your inbox.
                </p>
              )}
              {resendStatus === 'error' && (
                <p className="text-red-600 text-sm text-center mt-2">
                  Failed to resend email. Please try again later.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
