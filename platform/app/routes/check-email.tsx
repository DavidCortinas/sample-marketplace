import { useNavigate } from "@remix-run/react";
import { useState } from "react";

export default function CheckEmail() {
  const navigate = useNavigate();
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleResendEmail = async () => {
    setResendStatus('sending');
    try {
      const response = await fetch('/api/resend-verification-email', {
        method: 'POST',
      });
      if (response.ok) {
        setResendStatus('sent');
      } else {
        setResendStatus('error');
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setResendStatus('error');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 overflow-x-hidden overflow-y-auto map-background map-overlay">
        <div className="container mx-auto px-6 py-8 h-screen flex items-center justify-center">
          <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="bg-white bg-opacity-90 p-6 rounded-md">
              <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">Check Your Email</h2>
              <p className="text-center text-gray-600 mb-6">
                We've sent a verification link to your email. Please check your inbox and click the link to verify your account.
              </p>
              <button 
                onClick={() => navigate('/login')} 
                className="btn-primary w-full mb-4"
              >
                Go to Login
              </button>
              <button 
                onClick={handleResendEmail} 
                className="btn-secondary w-full transition duration-300 ease-in-out transform hover:scale-105 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                disabled={resendStatus === 'sending' || resendStatus === 'sent'}
              >
                {resendStatus === 'sending' ? 'Sending...' : 
                 resendStatus === 'sent' ? 'Email Sent' : 
                 resendStatus === 'error' ? 'Failed to Send' : 
                 'Resend Verification Email'}
              </button>
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
