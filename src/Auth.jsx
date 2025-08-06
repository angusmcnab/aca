import { useState } from 'react';
import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('sign_in');
  const [role, setRole] = useState('customer');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: userExists, error: checkError } = await supabase.rpc('user_exists', { p_email: email });

    if (checkError) {
      toast.error("Error checking email. Please try again.");
      setLoading(false);
      return;
    }

    if (userExists) {
      toast.error("This email address is already registered.");
      setLoading(false);
      return;
    }
    
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: role } },
    });

    if (signUpError) {
      toast.error(signUpError.message);
    } else {
      toast.success('Check your email for the confirmation link!');
      setView('sign_in');
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for the password reset link!');
      setView('sign_in');
    }
    setLoading(false);
  };

  const handleOAuthSignIn = async (provider) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  const renderForm = () => {
    if (view === 'forgot_password') {
      return (
        <form onSubmit={handlePasswordReset} className="space-y-6">
          <p className="text-sm text-gray-600">Enter your email address and we will send you a link to reset your password.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">Email</label>
            <input id="email" className="w-full p-2 border rounded mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <button className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-semibold disabled:opacity-75" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={view === 'sign_in' ? handleLogin : handleSignUp} className="space-y-6">
        {view === 'sign_up' && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sign up as a:</label>
                <div className="grid grid-cols-2 gap-4">
                    {/* --- UPDATED BUTTONS --- */}
                    <button 
                        type="button" 
                        onClick={() => setRole('customer')} 
                        className={`p-3 border rounded-md text-center text-sm font-semibold transition-colors ${role === 'customer' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        Customer <span className="block text-xs font-normal">I need a service</span>
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setRole('service_provider')} 
                        className={`p-3 border rounded-md text-center text-sm font-semibold transition-colors ${role === 'service_provider' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        Service Provider <span className="block text-xs font-normal">I provide a service</span>
                    </button>
                </div>
            </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="email">Email</label>
          <input id="email" className="w-full p-2 border rounded mt-1" type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">Password</label>
            {view === 'sign_in' && (
              <button type="button" onClick={() => setView('forgot_password')} className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </button>
            )}
          </div>
          <input id="password" className="w-full p-2 border rounded mt-1" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <button className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-semibold disabled:opacity-75" disabled={loading}>
            {loading ? 'Processing...' : view === 'sign_in' ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="flex justify-center items-center mt-12">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex border-b mb-6">
          <button onClick={() => setView('sign_in')} className={`flex-1 py-2 text-center font-semibold ${view === 'sign_in' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
            Sign In
          </button>
          <button onClick={() => setView('sign_up')} className={`flex-1 py-2 text-center font-semibold ${view === 'sign_up' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
            Sign Up
          </button>
        </div>
        {renderForm()}
        {view !== 'forgot_password' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">Or continue with</span></div>
            </div>
            <div>
              <button type="button" onClick={() => handleOAuthSignIn('google')} className="w-full flex justify-center items-center gap-2 bg-white border border-gray-300 text-gray-700 p-3 rounded hover:bg-gray-50 font-semibold disabled:opacity-75" disabled={loading}>
                  <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.596 44 30.134 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                  Google
              </button>
            </div>
          </>
        )}
        {view === 'forgot_password' && (
            <div className="mt-6 text-center">
                <button onClick={() => setView('sign_in')} className="text-sm text-blue-600 hover:underline">
                    Back to Sign In
                </button>
            </div>
        )}
      </div>
    </div>
  );
}