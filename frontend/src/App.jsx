import React, { useState } from 'react';
import { 
  Menu, Server, ShieldCheck, Activity, Cpu, 
  Radio, AlertCircle, LogOut, CheckCircle2, UserPlus, LogIn 
} from 'lucide-react';
import axios from 'axios';

export default function App() {
  const [token, setToken] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAccountName, setRegAccountName] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regJobTitle, setRegJobTitle] = useState('Administrator');
  const [regPhoneNumber, setRegPhoneNumber] = useState('');
  const [regCountry, setRegCountry] = useState('US');
  const [regCompanySize, setRegCompanySize] = useState('0-10');
  const [regServiceType, setRegServiceType] = useState('Provider');
  const [regNumberSites, setRegNumberSites] = useState('10');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('devices');

  // Handle Login Form Submission
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await axios.post('/api/users/login', {
        username: username.trim(),
        password
      });
      
      const jwtToken = res.headers['refresh-jwt'] || res.headers['refresh-token'];
      if (jwtToken) {
        setToken(jwtToken);
        await fetchDevices(jwtToken);
      } else {
        setError('Login succeeded, but no JWT header was returned.');
      }
    } catch (err) {
      console.error("Auth failed:", err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Web Registration Form Submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        accountName: regAccountName.trim() || 'My Organization',
        userFirstName: regFirstName.trim() || 'Admin',
        userLastName: regLastName.trim() || 'User',
        email: regEmail.trim(),
        password: regPassword,
        userJobTitle: regJobTitle.trim() || 'Administrator',
        userPhoneNumber: regPhoneNumber.trim(),
        country: regCountry,
        companySize: regCompanySize,
        serviceType: regServiceType,
        numberSites: regNumberSites,
        captcha: ''
      };

      const res = await axios.post('/api/users/register', payload);

      if (res.data && (res.data.status === 'user registered' || res.status === 200)) {
        setSuccessMsg('Account registered successfully! Logging you in...');
        
        // Auto-login after registration
        setTimeout(async () => {
          try {
            const loginRes = await axios.post('/api/users/login', {
              username: regEmail.trim(),
              password: regPassword
            });
            const jwtToken = loginRes.headers['refresh-jwt'] || loginRes.headers['refresh-token'];
            if (jwtToken) {
              setToken(jwtToken);
              setUsername(regEmail.trim());
              await fetchDevices(jwtToken);
            } else {
              setAuthMode('login');
              setUsername(regEmail.trim());
              setPassword(regPassword);
            }
          } catch (loginErr) {
            console.error('Auto login after registration failed:', loginErr);
            setAuthMode('login');
            setUsername(regEmail.trim());
            setPassword(regPassword);
          } finally {
            setLoading(false);
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please check your inputs.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setDevices([]);
    setUsername('');
    setPassword('');
    setError(null);
    setSuccessMsg(null);
  };

  const fetchDevices = async (authToken) => {
    try {
      const res = await axios.get('/api/devices', {
        headers: { Authorization: `Bearer ${authToken || token}` }
      });
      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch devices error:", err);
      setDevices([]);
    }
  };

  // 1. AUTH SCREEN (LOGIN & REGISTRATION WEBPAGE)
  if (!token) {
    return (
      <div className="min-h-screen bg-[#edf4f4] text-slate-800 font-sans flex flex-col select-none">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <Menu className="w-5 h-5 text-slate-700 cursor-pointer hover:text-slate-900" />
            <div className="flex items-center space-x-1.5">
              <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 30C20 30 35 70 50 70C65 70 80 30 80 30" stroke="#00797b" strokeWidth="18" strokeLinecap="round" />
                <path d="M35 30C35 30 45 55 50 55C55 55 65 30 65 30" stroke="#1f4e5b" strokeWidth="12" strokeLinecap="round" />
              </svg>
              <span className="text-xl font-semibold tracking-tight text-[#1f4e5b]">
                flexi<span className="font-bold text-[#00797b]">WAN</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
              className={`px-3 py-1.5 rounded transition ${
                authMode === 'login' 
                  ? 'bg-[#00797b] text-white' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(null); setSuccessMsg(null); }}
              className={`px-3 py-1.5 rounded transition ${
                authMode === 'register' 
                  ? 'bg-[#00797b] text-white' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Register
            </button>
          </div>
        </header>

        {/* Main Body with Soft Curved Background */}
        <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden py-10">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
            <svg width="100%" height="100%" viewBox="0 0 1000 600" fill="none" preserveAspectRatio="none">
              <path d="M -100 300 C 200 600, 800 600, 1100 300 C 800 0, 200 0, -100 300 Z" fill="#e2edea" />
              <path d="M 0 200 C 300 500, 700 500, 1000 200 C 700 -100, 300 -100, 0 200 Z" fill="#d8e7e4" />
            </svg>
          </div>

          {/* Auth Card Container */}
          <div className={`w-full ${authMode === 'register' ? 'max-w-[620px]' : 'max-w-[440px]'} bg-white border border-slate-200 shadow-sm z-10 p-8 rounded-sm transition-all duration-300`}>
            
            <div className="flex items-center justify-center space-x-2 pb-4 mb-6 border-b border-slate-200">
              <h1 className="text-center text-lg font-medium text-slate-800">
                {authMode === 'login' ? (
                  <>Login to flexi<span className="text-[#3b9395] font-semibold">Edge</span></>
                ) : (
                  <>Create your flexi<span className="text-[#3b9395] font-semibold">Manage</span> Account</>
                )}
              </h1>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="flex items-center">
                  <label className="w-28 text-sm text-slate-600 font-normal">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="flex items-center">
                  <label className="w-28 text-sm text-slate-600 font-normal">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#f39200] hover:bg-[#e08600] disabled:opacity-60 text-white font-medium py-2 rounded text-sm transition shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{loading ? 'Logging in...' : 'Login'}</span>
                  </button>
                </div>

                <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setError(null); setSuccessMsg(null); }}
                    className="text-[#00797b] font-medium hover:underline cursor-pointer"
                  >
                    Register new account
                  </button>
                </div>
              </form>
            )}

            {/* REGISTRATION FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1">Account / Company Name *</label>
                    <input 
                      type="text" 
                      value={regAccountName}
                      onChange={(e) => setRegAccountName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                      placeholder="My Organization"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                      placeholder="admin@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1">First Name *</label>
                    <input 
                      type="text" 
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                      placeholder="Admin"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                      placeholder="User"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1">Password * (min 8 chars)</label>
                    <input 
                      type="password" 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1">Confirm Password *</label>
                    <input 
                      type="password" 
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1">Country</label>
                    <select
                      value={regCountry}
                      onChange={(e) => setRegCountry(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="AU">Australia</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-medium mb-1">Service Type</label>
                    <select
                      value={regServiceType}
                      onChange={(e) => setRegServiceType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                    >
                      <option value="Provider">Managed Service Provider</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Personal">Personal / Lab</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#00797b] hover:bg-[#006062] disabled:opacity-60 text-white font-medium py-2 rounded text-sm transition shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{loading ? 'Registering Account...' : 'Complete Registration'}</span>
                  </button>
                </div>

                <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
                    className="text-[#00797b] font-medium hover:underline cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD VIEW
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">flexiManage</h1>
              <span className="text-xs text-slate-400">Controller Console</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'devices' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Devices & Edge</span>
            </button>
            <button 
              onClick={() => setActiveTab('policies')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'policies' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Policies & Tunnels</span>
            </button>
          </nav>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-400 border border-slate-700">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">{username || 'Admin'}</p>
              <span className="text-[10px] text-emerald-400 font-semibold">JWT Active</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full bg-slate-900 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-xs font-medium py-1.5 rounded-lg border border-slate-800 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="bg-slate-900/50 border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Network Infrastructure</h2>
            <p className="text-xs text-slate-400">Live controller status and registered edge nodes</p>
          </div>
          <div className="flex space-x-4">
            <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center space-x-3">
              <Cpu className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Backend Engine</p>
                <p className="text-xs font-medium text-slate-200">Node v22 (Express)</p>
              </div>
            </div>
            <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center space-x-3">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Core API</p>
                <p className="text-xs font-medium text-emerald-400">Connected (:3443)</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <span>Registered Devices</span>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{devices.length}</span>
                </h3>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                {devices.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Radio className="w-10 h-10 text-slate-600 stroke-1" />
                    <h4 className="text-slate-300 font-semibold text-base">No Devices Registered</h4>
                    <p className="text-slate-400 text-xs max-w-md">
                      You haven't registered any flexiEdge router devices yet. Install the flexiEdge software on your edge node and register it using your account token to see it here.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-400">
                        <th className="p-4">Device Name</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Uptime</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {devices.map((device) => (
                        <tr key={device._id} className="hover:bg-slate-800/30 transition">
                          <td className="p-4 font-medium text-slate-200">{device.name}</td>
                          <td className="p-4 font-mono text-xs text-slate-400">{device.ip}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              device.status === 'connected' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {device.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-400">{device.uptime}</td>
                          <td className="p-4 text-right">
                            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer">Configure</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-3">
              <ShieldCheck className="w-12 h-12 stroke-1" />
              <p className="text-sm">Policy & Tunnel management views are ready for integration.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
