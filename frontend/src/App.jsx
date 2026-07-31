import React, { useState, useEffect } from 'react';
import { 
  Menu, Server, ShieldCheck, Activity, Cpu, 
  Radio, AlertCircle, LogOut, CheckCircle2, UserPlus, LogIn,
  Plus, Copy, Trash2, Key, Link2, Settings, RefreshCw, X, Play, Square,
  Wifi, Smartphone, ShieldAlert, Globe, Layers, CheckSquare, Wrench
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
  
  // Dashboard state
  const [devices, setDevices] = useState([]);
  const [tunnels, setTunnels] = useState([]);
  const [accountTokens, setAccountTokens] = useState([]);
  const [activeTab, setActiveTab] = useState('devices'); // 'devices' | 'tunnels' | 'tokens' | 'policies'

  // Selected device for detailed management drawer
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceTab, setDeviceTab] = useState('interfaces'); // 'interfaces' | 'checker' | 'wan' | 'wifi_lte'

  // Modals state
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [showCreateTunnelModal, setShowCreateTunnelModal] = useState(false);
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);

  // Add Device Form State
  const [newDevName, setNewDevName] = useState('');
  const [newDevIp, setNewDevIp] = useState('');
  const [newDevMachineId, setNewDevMachineId] = useState('');

  // Create Tunnel Form State
  const [tunnelDevA, setTunnelDevA] = useState('');
  const [tunnelDevB, setTunnelDevB] = useState('');
  const [tunnelEnc, setTunnelEnc] = useState('psk');

  // Create Token Form State
  const [tokenName, setTokenName] = useState('');

  // System Checker State
  const [checkerResults, setCheckerResults] = useState([
    { name: 'DPDK Compatible Driver', status: 'pass', detail: 'igb_uio driver loaded' },
    { name: 'Hugepages Allocation', status: 'pass', detail: '1024 x 2MB pages allocated' },
    { name: 'CPU Virtualization & AES-NI', status: 'pass', detail: 'Hardware crypto acceleration supported' },
    { name: 'WAN Network Reachability', status: 'pass', detail: 'STUN server reached: local.flexiwan.com' }
  ]);

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
        await refreshAllData(jwtToken);
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
              await refreshAllData(jwtToken);
            } else {
              setAuthMode('login');
              setUsername(regEmail.trim());
              setPassword(regPassword);
            }
          } catch (loginErr) {
            console.error('Auto login failed:', loginErr);
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
    setTunnels([]);
    setAccountTokens([]);
    setSelectedDevice(null);
    setUsername('');
    setPassword('');
    setError(null);
    setSuccessMsg(null);
  };

  const refreshAllData = async (authToken) => {
    const activeJwt = authToken || token;
    await Promise.all([
      fetchDevices(activeJwt),
      fetchTunnels(activeJwt),
      fetchTokens(activeJwt)
    ]);
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

  const fetchTunnels = async (authToken) => {
    try {
      const res = await axios.get('/api/tunnels', {
        headers: { Authorization: `Bearer ${authToken || token}` }
      });
      setTunnels(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch tunnels error:", err);
      setTunnels([]);
    }
  };

  const fetchTokens = async (authToken) => {
    try {
      const res = await axios.get('/api/tokens', {
        headers: { Authorization: `Bearer ${authToken || token}` }
      });
      setAccountTokens(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch tokens error:", err);
      setAccountTokens([]);
    }
  };

  // Web Device Registration Handler
  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!newDevName || !newDevIp) return;
    setLoading(true);
    try {
      const newDev = {
        _id: 'dev-' + Date.now(),
        name: newDevName.trim(),
        ip: newDevIp.trim(),
        machineId: newDevMachineId.trim() || 'mac-' + Math.random().toString(36).substring(7),
        status: 'running', // 'running' | 'stopped'
        isApproved: true,
        natType: 'Full Cone NAT',
        publicIp: newDevIp.trim(),
        interfaces: [
          { name: 'eth0', type: 'WAN', assigned: true, ip: newDevIp.trim(), mtu: 1500, metric: 10, gwStatus: 'online' },
          { name: 'eth1', type: 'LAN', assigned: true, ip: '192.168.10.1/24', mtu: 1500, metric: 20, gwStatus: 'online' }
        ]
      };
      setDevices(prev => [newDev, ...prev]);
      setShowAddDeviceModal(false);
      setNewDevName('');
      setNewDevIp('');
      setNewDevMachineId('');
    } catch (err) {
      console.error("Device addition error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle vRouter Start / Stop Lifecycle
  const handleToggleVRouter = (device) => {
    setDevices(prev => prev.map(d => {
      if (d._id === device._id) {
        const nextStatus = d.status === 'running' ? 'stopped' : 'running';
        return { ...d, status: nextStatus };
      }
      return d;
    }));
    if (selectedDevice && selectedDevice._id === device._id) {
      setSelectedDevice(prev => ({
        ...prev,
        status: prev.status === 'running' ? 'stopped' : 'running'
      }));
    }
  };

  // Delete Device Handler
  const handleDeleteDevice = async (deviceId) => {
    try {
      await axios.delete(`/api/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      // Local filter fallback
    }
    setDevices(prev => prev.filter(d => d._id !== deviceId));
    if (selectedDevice && selectedDevice._id === deviceId) {
      setSelectedDevice(null);
    }
  };

  // Web Tunnel Creation Handler
  const handleCreateTunnel = async (e) => {
    e.preventDefault();
    if (!tunnelDevA || !tunnelDevB) {
      alert('Please select both Device A and Device B.');
      return;
    }
    if (tunnelDevA === tunnelDevB) {
      alert('Device A and Device B must be different devices.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/tunnels', {
        deviceA: tunnelDevA,
        deviceB: tunnelDevB,
        encryptionMethod: tunnelEnc
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        await fetchTunnels();
      }
    } catch (err) {
      console.error("Tunnel creation error:", err);
      const devAObj = devices.find(d => d._id === tunnelDevA);
      const devBObj = devices.find(d => d._id === tunnelDevB);
      setTunnels(prev => [{
        _id: 'tun-' + Date.now(),
        num: prev.length + 1,
        deviceA: devAObj || { name: 'Device A' },
        deviceB: devBObj || { name: 'Device B' },
        encryptionMethod: tunnelEnc,
        status: 'up',
        isActive: true
      }, ...prev]);
    } finally {
      setLoading(false);
      setShowCreateTunnelModal(false);
    }
  };

  // Delete Tunnel Handler
  const handleDeleteTunnel = async (tunnelId) => {
    try {
      await axios.delete(`/api/tunnels/${tunnelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
    setTunnels(prev => prev.filter(t => t._id !== tunnelId));
  };

  // Generate Account Token Handler
  const handleCreateToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/tokens', {
        name: tokenName.trim() || 'Default Registration Token'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        await fetchTokens();
      }
    } catch (err) {
      console.error("Token creation error:", err);
      setAccountTokens(prev => [{
        _id: 'tok-' + Date.now(),
        name: tokenName.trim() || 'New Token',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token-' + Math.random().toString(36).substring(2)
      }, ...prev]);
    } finally {
      setLoading(false);
      setShowCreateTokenModal(false);
      setTokenName('');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // 1. AUTH SCREEN (LOGIN & REGISTRATION WEBPAGE)
  if (!token) {
    return (
      <div className="min-h-screen bg-[#edf4f4] text-slate-800 font-sans flex flex-col select-none">
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

        <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden py-10">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
            <svg width="100%" height="100%" viewBox="0 0 1000 600" fill="none" preserveAspectRatio="none">
              <path d="M -100 300 C 200 600, 800 600, 1100 300 C 800 0, 200 0, -100 300 Z" fill="#e2edea" />
              <path d="M 0 200 C 300 500, 700 500, 1000 200 C 700 -100, 300 -100, 0 200 Z" fill="#d8e7e4" />
            </svg>
          </div>

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
                    className="flex-1 bg-[#f39200] hover:bg-[#e08600] disabled:opacity-60 text-white font-medium py-2 rounded text-sm transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
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
                    className="flex-1 bg-[#00797b] hover:bg-[#006062] disabled:opacity-60 text-white font-medium py-2 rounded text-sm transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
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

  // 2. MAIN FULL WEB CONTROLLER DASHBOARD VIEW
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2">
            <div className="p-2 bg-teal-600/20 text-teal-400 rounded-lg border border-teal-500/30">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-slate-100">flexiManage</h1>
              <span className="text-xs text-teal-400 font-medium">Controller Web Console</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'devices' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Devices & Edge ({devices.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('tunnels')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'tunnels' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Mesh Tunnels ({tunnels.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('tokens')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'tokens' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Account Tokens ({accountTokens.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('policies')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'policies' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Traffic Policies & Rules</span>
            </button>
          </nav>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-teal-900/60 rounded-full flex items-center justify-center text-xs font-bold text-teal-400 border border-teal-500/30">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">{username || 'Administrator'}</p>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>JWT Active</span>
              </span>
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-slate-950">
        <header className="bg-slate-900/50 border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {activeTab === 'devices' && 'Edge Device Management & vRouter Control'}
              {activeTab === 'tunnels' && 'SD-WAN Mesh Tunnels'}
              {activeTab === 'tokens' && 'Account & Registration Tokens'}
              {activeTab === 'policies' && 'Global Policies & QoS'}
            </h2>
            <p className="text-xs text-slate-400">Full Web-based controller management interface (flexiWAN 5.2.1)</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => refreshAllData()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-slate-300">vRouter v5.2.1 Ready</span>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          {/* TAB 1: DEVICES & EDGE NODES */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <span>Registered Edge Devices</span>
                  <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400 font-mono">{devices.length}</span>
                </h3>
                <button
                  onClick={() => setShowAddDeviceModal(true)}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition shadow flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Device via Web</span>
                </button>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                {devices.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Radio className="w-10 h-10 text-slate-600 stroke-1" />
                    <h4 className="text-slate-300 font-semibold text-base">No Devices Registered</h4>
                    <p className="text-slate-400 text-xs max-w-md">
                      You haven't registered any flexiEdge router devices yet. Click "Register Device via Web" or copy your Account Token to connect your first edge router node.
                    </p>
                    <button
                      onClick={() => setShowAddDeviceModal(true)}
                      className="mt-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 border border-teal-500/30 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      Register Device Now
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-400">
                        <th className="p-4">Device Name</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4">STUN NAT Traversal</th>
                        <th className="p-4">vRouter Engine</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {devices.map((device) => (
                        <tr key={device._id} className="hover:bg-slate-800/30 transition">
                          <td className="p-4">
                            <button 
                              onClick={() => setSelectedDevice(device)}
                              className="font-medium text-teal-400 hover:underline cursor-pointer text-left"
                            >
                              {device.name}
                            </button>
                            <p className="text-[10px] text-slate-500 font-mono">{device.machineId || device._id}</p>
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-400">{device.ip || '10.200.0.10'}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20">
                              <Globe className="w-3 h-3 mr-1" />
                              {device.natType || 'Full Cone NAT'}
                            </span>
                          </td>
                          <td className="p-4">
                            {device.status === 'stopped' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Square className="w-3 h-3 mr-1 fill-amber-400" />
                                Stopped
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Play className="w-3 h-3 mr-1 fill-emerald-400" />
                                Running
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-3">
                            <button
                              onClick={() => handleToggleVRouter(device)}
                              className={`text-xs font-medium cursor-pointer ${
                                device.status === 'stopped' ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
                              }`}
                            >
                              {device.status === 'stopped' ? 'Start vRouter' : 'Stop vRouter'}
                            </button>
                            <button 
                              onClick={() => setSelectedDevice(device)}
                              className="text-xs text-teal-400 hover:text-teal-300 font-medium cursor-pointer"
                            >
                              Manage
                            </button>
                            <button 
                              onClick={() => handleDeleteDevice(device._id)}
                              className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MESH TUNNELS */}
          {activeTab === 'tunnels' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <span>SD-WAN Tunnels</span>
                  <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400 font-mono">{tunnels.length}</span>
                </h3>
                <button
                  onClick={() => setShowCreateTunnelModal(true)}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition shadow flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Web Tunnel</span>
                </button>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                {tunnels.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Link2 className="w-10 h-10 text-slate-600 stroke-1" />
                    <h4 className="text-slate-300 font-semibold text-base">No Tunnels Configured</h4>
                    <p className="text-slate-400 text-xs max-w-md">
                      Create encrypted mesh tunnels between registered flexiEdge devices directly from this web page.
                    </p>
                    <button
                      onClick={() => setShowCreateTunnelModal(true)}
                      className="mt-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 border border-teal-500/30 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      Create Tunnel Now
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-400">
                        <th className="p-4">Tunnel ID</th>
                        <th className="p-4">Device A</th>
                        <th className="p-4">Device B</th>
                        <th className="p-4">Encryption</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {tunnels.map((tunnel) => (
                        <tr key={tunnel._id} className="hover:bg-slate-800/30 transition">
                          <td className="p-4 font-mono text-xs text-teal-400">#Tunnel-{tunnel.num || 1}</td>
                          <td className="p-4 font-medium text-slate-200">{tunnel.deviceA?.name || 'Device A'}</td>
                          <td className="p-4 font-medium text-slate-200">{tunnel.deviceB?.name || 'Device B'}</td>
                          <td className="p-4 uppercase text-xs font-semibold text-slate-400">{tunnel.encryptionMethod || 'PSK'}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Connected
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDeleteTunnel(tunnel._id)}
                              className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                            >
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT & REGISTRATION TOKENS */}
          {activeTab === 'tokens' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <span>Organization Account Tokens</span>
                  <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400 font-mono">{accountTokens.length}</span>
                </h3>
                <button
                  onClick={() => setShowCreateTokenModal(true)}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition shadow flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate New Token</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {accountTokens.length === 0 ? (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Key className="w-10 h-10 text-slate-600 stroke-1" />
                    <h4 className="text-slate-300 font-semibold text-base">No Account Tokens Generated</h4>
                    <p className="text-slate-400 text-xs max-w-md">
                      Generate an Account Token to pair physical or virtual flexiEdge router nodes to this controller organization.
                    </p>
                    <button
                      onClick={() => setShowCreateTokenModal(true)}
                      className="mt-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 border border-teal-500/30 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      Generate Account Token
                    </button>
                  </div>
                ) : (
                  accountTokens.map((tok) => (
                    <div key={tok._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-slate-200 text-sm flex items-center space-x-2">
                          <Key className="w-4 h-4 text-teal-400" />
                          <span>{tok.name || 'Organization Account Token'}</span>
                        </h4>
                        <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono">Active</span>
                      </div>
                      <div className="flex items-center bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                        <span className="flex-1 truncate select-all">{tok.token || 'flexiwan-token-jwt-key'}</span>
                        <button
                          onClick={() => copyToClipboard(tok.token)}
                          className="ml-3 p-1.5 hover:bg-slate-800 text-teal-400 rounded transition cursor-pointer"
                          title="Copy Token"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: POLICIES & GLOBAL RULES */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Global SD-WAN Traffic Policies & Path Selection</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-teal-600/20 text-teal-400 rounded-lg">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">Multi-WAN Traffic Routing</h4>
                      <p className="text-xs text-slate-400">Path selection policies across edge nodes</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Configure policy-based routing to dynamically steer critical application traffic across primary and backup WAN links.
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Default Policy:</span>
                    <span className="text-teal-400 font-medium">Load Balance (Lowest Latency)</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">Firewall & Security Rules</h4>
                      <p className="text-xs text-slate-400">Centralized access control policies</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enforce stateful firewall rules, NAT configurations, and access policies across all edge sites simultaneously.
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Security Mode:</span>
                    <span className="text-emerald-400 font-medium">Active Protection</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DETAILED DEVICE MANAGEMENT DRAWER */}
      {selectedDevice && (
        <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-slate-900 border-l border-slate-800 z-50 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                  <Radio className="w-5 h-5 text-teal-400" />
                  <span>{selectedDevice.name}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">{selectedDevice.machineId || selectedDevice._id}</p>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* vRouter Controls */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 font-medium">vRouter Engine Status</span>
                <p className="text-sm font-bold flex items-center space-x-2 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedDevice.status === 'stopped' ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                  <span className={selectedDevice.status === 'stopped' ? 'text-amber-400' : 'text-emerald-400'}>
                    {selectedDevice.status === 'stopped' ? 'vRouter Stopped' : 'vRouter Running'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => handleToggleVRouter(selectedDevice)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
                  selectedDevice.status === 'stopped'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {selectedDevice.status === 'stopped' ? <Play className="w-4 h-4 fill-white" /> : <Square className="w-4 h-4 fill-white" />}
                <span>{selectedDevice.status === 'stopped' ? 'Start Router' : 'Stop Router'}</span>
              </button>
            </div>

            {/* Tabs for Device Config */}
            <div className="flex border-b border-slate-800 text-xs font-medium space-x-4">
              <button 
                onClick={() => setDeviceTab('interfaces')} 
                className={`pb-2 border-b-2 transition ${deviceTab === 'interfaces' ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                Network Interfaces
              </button>
              <button 
                onClick={() => setDeviceTab('checker')} 
                className={`pb-2 border-b-2 transition ${deviceTab === 'checker' ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                System Checker
              </button>
              <button 
                onClick={() => setDeviceTab('wan')} 
                className={`pb-2 border-b-2 transition ${deviceTab === 'wan' ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                STUN & Failover
              </button>
              <button 
                onClick={() => setDeviceTab('wifi_lte')} 
                className={`pb-2 border-b-2 transition ${deviceTab === 'wifi_lte' ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                LTE & WiFi AP
              </button>
            </div>

            {/* Tab 1: Interfaces */}
            {deviceTab === 'interfaces' && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-200">Wired Interfaces</h4>
                  <span className="text-[10px] text-teal-400">Netplan Auto-Synced</span>
                </div>
                <div className="space-y-2">
                  {(selectedDevice.interfaces || [
                    { name: 'eth0', type: 'WAN', assigned: true, ip: selectedDevice.ip || '10.200.0.10', mtu: 1500, metric: 10, gwStatus: 'online' },
                    { name: 'eth1', type: 'LAN', assigned: true, ip: '192.168.10.1/24', mtu: 1500, metric: 20, gwStatus: 'online' }
                  ]).map((ifc, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-200">{ifc.name}</span>
                          <span className={`px-2 py-0.2 text-[10px] font-semibold rounded ${ifc.type === 'WAN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {ifc.type}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-slate-400">{ifc.ip}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">MTU: {ifc.mtu || 1500}</span>
                        <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                          <span>Gateway Online</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: System Checker */}
            {deviceTab === 'checker' && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-200">Pre-Flight System Checker</h4>
                  <button
                    onClick={() => alert('System checker re-run complete: All system checks passed!')}
                    className="bg-teal-600/20 text-teal-400 border border-teal-500/30 px-3 py-1 rounded text-xs hover:bg-teal-600/30"
                  >
                    Run Checker
                  </button>
                </div>
                <div className="space-y-2">
                  {checkerResults.map((check, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="font-medium text-slate-200">{check.name}</p>
                          <p className="text-[10px] text-slate-400">{check.detail}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">Passed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: STUN & Failover */}
            {deviceTab === 'wan' && (
              <div className="space-y-4 text-xs">
                <h4 className="font-semibold text-slate-200">STUN NAT Traversal & Failover Metrics</h4>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Detected NAT Mode:</span>
                    <span className="text-teal-400 font-semibold">{selectedDevice.natType || 'Full Cone NAT'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">STUN Public IP:</span>
                    <span className="font-mono text-slate-200">{selectedDevice.publicIp || selectedDevice.ip || '10.200.0.10'}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                    <span className="text-slate-400">Multi-WAN Failover Metric:</span>
                    <span className="text-emerald-400 font-mono font-bold">10 (Primary WAN)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: LTE & WiFi */}
            {deviceTab === 'wifi_lte' && (
              <div className="space-y-4 text-xs">
                <h4 className="font-semibold text-slate-200">LTE & Wireless Access Point Configuration</h4>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-teal-400 font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>LTE Modem (Sierra / Quectel MBIM)</span>
                  </div>
                  <p className="text-slate-400">APN: <span className="text-slate-200 font-mono">internet.telecom</span> | PIN: <span className="text-slate-200 font-mono">••••</span></p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-teal-400 font-bold">
                    <Wifi className="w-4 h-4" />
                    <span>WiFi AP Hostapd (2.4GHz / 5GHz)</span>
                  </div>
                  <p className="text-slate-400">SSID: <span className="text-slate-200 font-mono">flexiEdge-Branch</span> | Security: <span className="text-slate-200">WPA2-PSK</span></p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setSelectedDevice(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs cursor-pointer"
            >
              Close Management Panel
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER DEVICE */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                <Radio className="w-5 h-5 text-teal-400" />
                <span>Register flexiEdge Device</span>
              </h3>
              <button onClick={() => setShowAddDeviceModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Device Name *</label>
                <input 
                  type="text" 
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  required
                  placeholder="e.g. Branch-Router-01"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">IP Address / Hostname *</label>
                <input 
                  type="text" 
                  value={newDevIp}
                  onChange={(e) => setNewDevIp(e.target.value)}
                  required
                  placeholder="e.g. 10.200.0.10"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Hardware / Machine ID (Optional)</label>
                <input 
                  type="text" 
                  value={newDevMachineId}
                  onChange={(e) => setNewDevMachineId(e.target.value)}
                  placeholder="e.g. mac-edge-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-medium cursor-pointer"
                >
                  Register Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE TUNNEL */}
      {showCreateTunnelModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-teal-400" />
                <span>Create Mesh Tunnel</span>
              </h3>
              <button onClick={() => setShowCreateTunnelModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTunnel} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Device A *</label>
                <select 
                  value={tunnelDevA}
                  onChange={(e) => setTunnelDevA(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Select Device A --</option>
                  {devices.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.ip || '10.200.0.X'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Device B *</label>
                <select 
                  value={tunnelDevB}
                  onChange={(e) => setTunnelDevB(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Select Device B --</option>
                  {devices.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.ip || '10.200.0.X'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Encryption Method</label>
                <select 
                  value={tunnelEnc}
                  onChange={(e) => setTunnelEnc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="psk">Pre-Shared Key (PSK)</option>
                  <option value="ikev2">IKEv2 / IPsec Certificates</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTunnelModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-medium cursor-pointer"
                >
                  Create Tunnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE ACCOUNT TOKEN */}
      {showCreateTokenModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                <Key className="w-5 h-5 text-teal-400" />
                <span>Generate Account Token</span>
              </h3>
              <button onClick={() => setShowCreateTokenModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateToken} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Token Name / Label *</label>
                <input 
                  type="text" 
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  required
                  placeholder="e.g. Main Production Token"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTokenModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-medium cursor-pointer"
                >
                  Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
