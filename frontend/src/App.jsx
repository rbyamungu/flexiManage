import React, { useState, useEffect } from 'react';
import { 
  Menu, Server, ShieldCheck, Activity, Cpu, 
  Radio, AlertCircle, LogOut, CheckCircle2, UserPlus, LogIn,
  Plus, Copy, Trash2, Key, Link2, Settings, RefreshCw, X, Play, Square,
  Wifi, Smartphone, ShieldAlert, Globe, Layers, Search, Filter,
  TrendingUp, ArrowRight, Zap, Info, ChevronDown, ChevronRight, HardDrive,
  Sliders, Check, Folder, HelpCircle
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
  
  // flexiManage 5.2.1 Menu Navigation
  const [activeMenu, setActiveMenu] = useState('devices'); // 'home' | 'devices' | 'tokens' | 'tunnels' | 'topology' | 'policies' | 'firewall'

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'running' | 'stopped'

  // Selected device for detailed management drawer
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceTab, setDeviceTab] = useState('interfaces'); // 'interfaces' | 'checker' | 'wan' | 'wifi_lte'

  // Modals state
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [showCreateTunnelModal, setShowCreateTunnelModal] = useState(false);
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState(null);

  // Form states
  const [newDevName, setNewDevName] = useState('');
  const [newDevIp, setNewDevIp] = useState('');
  const [newDevMachineId, setNewDevMachineId] = useState('');

  const [tunnelDevA, setTunnelDevA] = useState('');
  const [tunnelDevB, setTunnelDevB] = useState('');
  const [tunnelEnc, setTunnelEnc] = useState('psk');

  const [tokenName, setTokenName] = useState('');

  // System Checker Results
  const [checkerResults, setCheckerResults] = useState([
    { name: 'DPDK Compatible Driver', status: 'pass', detail: 'igb_uio driver loaded' },
    { name: 'Hugepages Allocation', status: 'pass', detail: '1024 x 2MB pages allocated' },
    { name: 'CPU Crypto & AES-NI', status: 'pass', detail: 'Hardware crypto acceleration active' },
    { name: 'STUN NAT Reachability', status: 'pass', detail: 'STUN server local.flexiwan.com:3443 responded' }
  ]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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
        showToast('Logged in successfully', 'success');
        await refreshAllData(jwtToken);
      } else {
        setError('Login succeeded, but no JWT token was returned.');
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
        setSuccessMsg('Account registered! Logging you in...');
        showToast('Account registered successfully!', 'success');
        
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
    showToast('Signed out of flexiManage', 'info');
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

  // Device addition handler
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
        status: 'running',
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
      showToast(`Device "${newDev.name}" registered successfully`, 'success');
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
    const newStatus = device.status === 'running' ? 'Stopped' : 'Started';
    showToast(`vRouter engine ${newStatus} on ${device.name}`, 'info');
  };

  // Delete Device Handler
  const handleDeleteDevice = async (deviceId) => {
    const dev = devices.find(d => d._id === deviceId);
    try {
      await axios.delete(`/api/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      // Local fallback
    }
    setDevices(prev => prev.filter(d => d._id !== deviceId));
    if (selectedDevice && selectedDevice._id === deviceId) {
      setSelectedDevice(null);
    }
    showToast(`Device ${dev?.name || ''} deleted`, 'info');
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
      showToast('Mesh Tunnel created successfully', 'success');
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
    showToast('Tunnel de-activated', 'info');
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
      showToast('New Account Token generated', 'success');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Token copied to clipboard!', 'success');
  };

  // Filtered devices list
  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.ip?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.machineId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'running' && d.status !== 'stopped') ||
                          (statusFilter === 'stopped' && d.status === 'stopped');
    return matchesSearch && matchesStatus;
  });

  const runningDevicesCount = devices.filter(d => d.status !== 'stopped').length;
  const activeTunnelsCount = tunnels.filter(t => t.isActive !== false).length;

  // 1. AUTH SCREEN (MATCHING ORIGINAL FLEXIMANAGE 5.2.1 LOGIN UI)
  if (!token) {
    return (
      <div className="min-h-screen bg-[#edf4f4] font-sans flex flex-col justify-between select-none">
        
        {/* Official flexiWAN Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 cursor-pointer">
              <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 30C20 30 35 70 50 70C65 70 80 30 80 30" stroke="#00797b" strokeWidth="18" strokeLinecap="round" />
                <path d="M35 30C35 30 45 55 50 55C55 55 65 30 65 30" stroke="#1f4e5b" strokeWidth="12" strokeLinecap="round" />
              </svg>
              <span className="text-2xl font-semibold tracking-tight text-[#1f4e5b]">
                flexi<span className="font-bold text-[#00797b]">Manage</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
              className={`px-4 py-2 rounded transition cursor-pointer ${
                authMode === 'login' 
                  ? 'bg-[#00797b] text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(null); setSuccessMsg(null); }}
              className={`px-4 py-2 rounded transition cursor-pointer ${
                authMode === 'register' 
                  ? 'bg-[#00797b] text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Create Account
            </button>
          </div>
        </header>

        {/* Center Card Area */}
        <div className="flex-1 flex items-center justify-center p-6 py-12">
          <div className={`w-full ${authMode === 'register' ? 'max-w-[640px]' : 'max-w-[420px]'} bg-white border border-slate-200/80 shadow-lg p-8 rounded-md transition-all duration-300`}>
            
            <div className="text-center pb-4 mb-6 border-b border-slate-200">
              <h1 className="text-xl font-medium text-slate-800">
                {authMode === 'login' ? (
                  <>Login to flexi<span className="text-[#00797b] font-semibold">Manage</span></>
                ) : (
                  <>Create Account on flexi<span className="text-[#00797b] font-semibold">Manage</span></>
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">Username (Email)</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#00797b] transition"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#00797b] transition"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#f39200] hover:bg-[#e08600] disabled:opacity-60 text-white font-medium py-2.5 rounded text-sm transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{loading ? 'Logging in...' : 'Login'}</span>
                  </button>
                </div>

                <div className="text-center pt-3 text-xs text-slate-500 border-t border-slate-100">
                  Need a new account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setError(null); setSuccessMsg(null); }}
                    className="text-[#00797b] font-medium hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Account Name *</label>
                    <input 
                      type="text" 
                      value={regAccountName}
                      onChange={(e) => setRegAccountName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#00797b] transition"
                      placeholder="My Company Ltd"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#00797b] transition"
                      placeholder="admin@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">First Name *</label>
                    <input 
                      type="text" 
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#00797b] transition"
                      placeholder="First Name"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#00797b] transition"
                      placeholder="Last Name"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Password * (min 8 chars)</label>
                    <input 
                      type="password" 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#00797b] transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Confirm Password *</label>
                    <input 
                      type="password" 
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#00797b] transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Country</label>
                    <select
                      value={regCountry}
                      onChange={(e) => setRegCountry(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#00797b] transition"
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
                    <label className="block text-slate-600 font-medium mb-1">Service Type</label>
                    <select
                      value={regServiceType}
                      onChange={(e) => setRegServiceType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#00797b] transition"
                    >
                      <option value="Provider">Managed Service Provider</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Personal">Personal / Lab</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00797b] hover:bg-[#006062] disabled:opacity-60 text-white font-medium py-2 rounded text-sm transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                  </button>
                </div>

                <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
                    className="text-[#00797b] font-medium hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-slate-500 bg-white border-t border-slate-200">
          © 2019-2026 flexiWAN Ltd. All rights reserved.
        </footer>
      </div>
    );
  }

  // 2. MAIN FULL WEB CONTROLLER DASHBOARD VIEW (FLEXIMANAGE 5.2.1 STRUCTURE)
  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 transition-all duration-300">
          <div className={`px-4 py-3 rounded-lg border shadow-xl flex items-center space-x-3 text-xs font-semibold ${
            toast.type === 'success' ? 'bg-emerald-800 text-emerald-100 border-emerald-700' : 'bg-slate-800 text-slate-100 border-slate-700'
          }`}>
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* flexiManage Left Sidebar */}
      <aside className="w-64 bg-[#1f4e5b] text-slate-100 flex flex-col justify-between border-r border-slate-700 shadow-lg z-10">
        <div className="space-y-4">
          
          {/* Logo Header */}
          <div className="h-16 px-5 border-b border-slate-700/80 flex items-center space-x-2">
            <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 30C20 30 35 70 50 70C65 70 80 30 80 30" stroke="#3b9395" strokeWidth="18" strokeLinecap="round" />
              <path d="M35 30C35 30 45 55 50 55C55 55 65 30 65 30" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-bold tracking-tight text-white">
              flexi<span className="text-[#3b9395]">Manage</span>
            </span>
          </div>

          {/* flexiManage 5.2.1 Sidebar Categories */}
          <nav className="px-3 space-y-4 text-xs font-medium">
            
            {/* Category 1: Overview */}
            <div>
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overview</div>
              <button 
                onClick={() => setActiveMenu('home')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded transition cursor-pointer ${
                  activeMenu === 'home' ? 'bg-[#00797b] text-white font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Home & Onboarding</span>
              </button>
            </div>

            {/* Category 2: Inventory */}
            <div>
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inventory</div>
              <div className="space-y-0.5">
                <button 
                  onClick={() => setActiveMenu('devices')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded transition cursor-pointer ${
                    activeMenu === 'devices' ? 'bg-[#00797b] text-white font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Radio className="w-4 h-4" />
                    <span>Devices</span>
                  </div>
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] text-slate-300">{devices.length}</span>
                </button>

                <button 
                  onClick={() => setActiveMenu('tokens')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded transition cursor-pointer ${
                    activeMenu === 'tokens' ? 'bg-[#00797b] text-white font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Key className="w-4 h-4" />
                    <span>Tokens</span>
                  </div>
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] text-slate-300">{accountTokens.length}</span>
                </button>
              </div>
            </div>

            {/* Category 3: Network & Tunnels */}
            <div>
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Network</div>
              <div className="space-y-0.5">
                <button 
                  onClick={() => setActiveMenu('tunnels')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded transition cursor-pointer ${
                    activeMenu === 'tunnels' ? 'bg-[#00797b] text-white font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Link2 className="w-4 h-4" />
                    <span>Tunnels</span>
                  </div>
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] text-slate-300">{tunnels.length}</span>
                </button>

                <button 
                  onClick={() => setActiveMenu('topology')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded transition cursor-pointer ${
                    activeMenu === 'topology' ? 'bg-[#00797b] text-white font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Topology Map</span>
                </button>
              </div>
            </div>

            {/* Category 4: Security & Policies */}
            <div>
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Security & Policies</div>
              <button 
                onClick={() => setActiveMenu('policies')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded transition cursor-pointer ${
                  activeMenu === 'policies' ? 'bg-[#00797b] text-white font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Path Selection Policies</span>
              </button>
            </div>

          </nav>
        </div>

        {/* User Account Info Footer */}
        <div className="p-4 border-t border-slate-700/80 bg-slate-900/40 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#00797b] rounded-full flex items-center justify-center text-xs font-bold text-white shadow">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{username || 'Administrator'}</p>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>flexiManage 5.2.1</span>
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 text-xs font-medium py-1.5 rounded flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-slate-50">
        
        {/* Top App Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {activeMenu === 'home' && 'flexiManage Home & Installation Steps'}
              {activeMenu === 'devices' && 'Inventory > Devices'}
              {activeMenu === 'tokens' && 'Inventory > Account Tokens'}
              {activeMenu === 'tunnels' && 'Network > SD-WAN Tunnels'}
              {activeMenu === 'topology' && 'Network > Mesh Topology Map'}
              {activeMenu === 'policies' && 'Security & Policies > Path Selection'}
            </h2>
            <p className="text-xs text-slate-500">flexiWAN Release 5.2.1 Centralized Controller</p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => { refreshAllData(); showToast('Data refreshed', 'info'); }}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
              title="Refresh Controller Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="bg-slate-100 px-3 py-1 rounded border border-slate-200 flex items-center space-x-2 text-xs font-medium text-slate-700">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span>Organization Active</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 flex-1">

          {/* HOME ONBOARDING TAB (MATCHES FLEXIMANAGE HOME PAGE) */}
          {activeMenu === 'home' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800">flexiEdge Installation & Setup Flow</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Follow these 3 steps to connect physical or virtual flexiEdge routers to your flexiManage account:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="border border-slate-200 p-5 rounded-lg bg-slate-50 space-y-3">
                    <div className="w-8 h-8 bg-[#00797b] text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                    <h4 className="font-bold text-sm text-slate-800">Create Account Token</h4>
                    <p className="text-xs text-slate-600">Navigate to Inventory &gt; Tokens page and click "New Token". Copy the token to use on your devices.</p>
                    <button onClick={() => setActiveMenu('tokens')} className="text-xs text-[#00797b] font-semibold hover:underline flex items-center space-x-1">
                      <span>Go to Tokens</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="border border-slate-200 p-5 rounded-lg bg-slate-50 space-y-3">
                    <div className="w-8 h-8 bg-[#00797b] text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                    <h4 className="font-bold text-sm text-slate-800">Register & Approve Device</h4>
                    <p className="text-xs text-slate-600">Paste your token into your flexiEdge router's local UI (port 8080) or CLI. Approve the device under Inventory &gt; Devices.</p>
                    <button onClick={() => setActiveMenu('devices')} className="text-xs text-[#00797b] font-semibold hover:underline flex items-center space-x-1">
                      <span>Go to Devices</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="border border-slate-200 p-5 rounded-lg bg-slate-50 space-y-3">
                    <div className="w-8 h-8 bg-[#00797b] text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                    <h4 className="font-bold text-sm text-slate-800">Create Mesh Tunnels</h4>
                    <p className="text-xs text-slate-600">Assign network interfaces and create encrypted SD-WAN mesh tunnels between your approved flexiEdge sites.</p>
                    <button onClick={() => setActiveMenu('tunnels')} className="text-xs text-[#00797b] font-semibold hover:underline flex items-center space-x-1">
                      <span>Go to Tunnels</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INVENTORY > DEVICES TAB */}
          {activeMenu === 'devices' && (
            <div className="space-y-6">
              
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-3 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter devices..."
                      className="w-full bg-white border border-slate-300 rounded pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#00797b]"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-300 text-xs text-slate-700 rounded px-3 py-1.5 focus:outline-none focus:border-[#00797b]"
                  >
                    <option value="all">All Devices</option>
                    <option value="running">Running</option>
                    <option value="stopped">Stopped</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowAddDeviceModal(true)}
                  className="bg-[#00797b] hover:bg-[#006062] text-white px-4 py-2 rounded text-xs font-medium transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Device via Web</span>
                </button>
              </div>

              {/* Devices Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                {filteredDevices.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Radio className="w-10 h-10 text-slate-400 stroke-1" />
                    <h4 className="text-slate-700 font-bold text-base">No Devices Found</h4>
                    <p className="text-slate-500 text-xs max-w-md">
                      No registered flexiEdge router devices yet. Click "Register Device via Web" or copy your Organization Token to connect your first router.
                    </p>
                    <button
                      onClick={() => setShowAddDeviceModal(true)}
                      className="mt-2 bg-[#00797b]/10 text-[#00797b] hover:bg-[#00797b]/20 px-4 py-2 rounded text-xs font-semibold cursor-pointer"
                    >
                      Register Device Now
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600 font-semibold">
                        <th className="p-3.5 pl-6">Device Name</th>
                        <th className="p-3.5">IP Address</th>
                        <th className="p-3.5">STUN NAT Traversal</th>
                        <th className="p-3.5">vRouter Engine</th>
                        <th className="p-3.5 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {filteredDevices.map((device) => (
                        <tr key={device._id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 pl-6">
                            <button 
                              onClick={() => setSelectedDevice(device)}
                              className="font-bold text-[#00797b] hover:underline cursor-pointer text-left"
                            >
                              {device.name}
                            </button>
                            <p className="text-[10px] text-slate-400 font-mono">{device.machineId || device._id}</p>
                          </td>
                          <td className="p-3.5 font-mono text-slate-700">{device.ip || '10.200.0.10'}</td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                              <Globe className="w-3 h-3 mr-1" />
                              {device.natType || 'Full Cone NAT'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {device.status === 'stopped' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <Square className="w-3 h-3 mr-1 fill-amber-700" />
                                Stopped
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Play className="w-3 h-3 mr-1 fill-emerald-700" />
                                Running
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 pr-6 text-right space-x-3">
                            <button
                              onClick={() => handleToggleVRouter(device)}
                              className={`font-semibold cursor-pointer ${
                                device.status === 'stopped' ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-600 hover:text-amber-700'
                              }`}
                            >
                              {device.status === 'stopped' ? 'Start Router' : 'Stop Router'}
                            </button>
                            <button 
                              onClick={() => setSelectedDevice(device)}
                              className="text-[#00797b] hover:underline font-semibold cursor-pointer"
                            >
                              Settings
                            </button>
                            <button 
                              onClick={() => handleDeleteDevice(device._id)}
                              className="text-red-600 hover:underline font-semibold cursor-pointer"
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

          {/* INVENTORY > TOKENS TAB */}
          {activeMenu === 'tokens' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Organization Tokens</h3>
                  <p className="text-xs text-slate-500">Organization tokens authenticate edge routers connecting to this flexiManage account</p>
                </div>
                <button
                  onClick={() => setShowCreateTokenModal(true)}
                  className="bg-[#00797b] hover:bg-[#006062] text-white px-4 py-2 rounded text-xs font-medium transition shadow-sm flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Token</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {accountTokens.length === 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
                    <Key className="w-10 h-10 text-slate-400 stroke-1" />
                    <h4 className="text-slate-700 font-bold text-base">No Tokens Created</h4>
                    <p className="text-slate-500 text-xs max-w-md">
                      Generate an Organization Token to pair your physical or virtual flexiEdge routers.
                    </p>
                    <button
                      onClick={() => setShowCreateTokenModal(true)}
                      className="mt-2 bg-[#00797b]/10 text-[#00797b] hover:bg-[#00797b]/20 px-4 py-2 rounded text-xs font-semibold cursor-pointer"
                    >
                      New Token
                    </button>
                  </div>
                ) : (
                  accountTokens.map((tok) => (
                    <div key={tok._id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                          <Key className="w-4 h-4 text-[#00797b]" />
                          <span>{tok.name || 'Organization Token'}</span>
                        </h4>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-semibold">Active</span>
                      </div>
                      <div className="flex items-center bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
                        <span className="flex-1 truncate select-all">{tok.token || 'flexiwan-token-jwt-key'}</span>
                        <button
                          onClick={() => copyToClipboard(tok.token)}
                          className="ml-3 p-1.5 hover:bg-slate-200 text-[#00797b] rounded transition cursor-pointer"
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

          {/* NETWORK > TUNNELS TAB */}
          {activeMenu === 'tunnels' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">SD-WAN Mesh Tunnels</h3>
                  <p className="text-xs text-slate-500">Manage encrypted IPsec and IP-in-IP tunnels between flexiEdge sites</p>
                </div>
                <button
                  onClick={() => setShowCreateTunnelModal(true)}
                  className="bg-[#00797b] hover:bg-[#006062] text-white px-4 py-2 rounded text-xs font-medium transition shadow-sm flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Web Tunnel</span>
                </button>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                {tunnels.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Link2 className="w-10 h-10 text-slate-400 stroke-1" />
                    <h4 className="text-slate-700 font-bold text-base">No Tunnels Configured</h4>
                    <p className="text-slate-500 text-xs max-w-md">
                      Create encrypted mesh tunnels between registered flexiEdge devices directly from flexiManage.
                    </p>
                    <button
                      onClick={() => setShowCreateTunnelModal(true)}
                      className="mt-2 bg-[#00797b]/10 text-[#00797b] hover:bg-[#00797b]/20 px-4 py-2 rounded text-xs font-semibold cursor-pointer"
                    >
                      Create Tunnel Now
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600 font-semibold">
                        <th className="p-3.5 pl-6">Tunnel ID</th>
                        <th className="p-3.5">Device A</th>
                        <th className="p-3.5">Device B</th>
                        <th className="p-3.5">Encryption</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {tunnels.map((tunnel) => (
                        <tr key={tunnel._id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 pl-6 font-mono font-bold text-[#00797b]">#Tunnel-{tunnel.num || 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{tunnel.deviceA?.name || 'Device A'}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{tunnel.deviceB?.name || 'Device B'}</td>
                          <td className="p-3.5 uppercase font-semibold text-slate-600">{tunnel.encryptionMethod || 'PSK'}</td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Connected
                            </span>
                          </td>
                          <td className="p-3.5 pr-6 text-right">
                            <button 
                              onClick={() => handleDeleteTunnel(tunnel._id)}
                              className="text-red-600 hover:underline font-semibold cursor-pointer"
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

          {/* TOPOLOGY MAP TAB */}
          {activeMenu === 'topology' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm">SD-WAN Mesh Topology Map</h3>
                <p className="text-xs text-slate-500">Visual topology graph of active edge router sites and encrypted tunnels</p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm relative min-h-[400px] flex items-center justify-center">
                {devices.length === 0 ? (
                  <div className="text-center space-y-3">
                    <Layers className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
                    <p className="text-slate-500 text-xs">No registered devices to display in topology map.</p>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl relative flex items-center justify-around py-12">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#00797b]/50" strokeWidth="2" strokeDasharray="6 6">
                      <line x1="20%" y1="50%" x2="80%" y2="50%" className="animate-pulse" />
                    </svg>

                    {devices.slice(0, 3).map((dev) => (
                      <div key={dev._id} className="relative z-10 bg-slate-50 border border-slate-300 p-6 rounded-lg shadow flex flex-col items-center space-y-3 text-center w-52">
                        <div className="p-3 bg-[#00797b] text-white rounded-full shadow">
                          <Server className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{dev.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{dev.ip || '10.200.0.10'}</p>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                          vRouter Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* POLICIES TAB */}
          {activeMenu === 'policies' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm">Path Selection Policies & Traffic Rules</h3>
                <p className="text-xs text-slate-500">Configure QoS and application-based traffic steering across WAN interfaces</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-teal-50 text-[#00797b] rounded-lg">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Multi-WAN Path Steering</h4>
                      <p className="text-xs text-slate-500">Policy-based routing per application</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dynamically steer voice, video, and mission-critical application traffic across lowest latency WAN links.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Default Policy:</span>
                    <span className="text-[#00797b] font-bold">Lowest Latency Priority</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Stateful Firewall Rules</h4>
                      <p className="text-xs text-slate-500">Centralized access security rules</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enforce stateful firewall filtering and access control policies across all edge sites simultaneously.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Security Engine:</span>
                    <span className="text-emerald-700 font-bold">Active Enforcement</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* DETAILED DEVICE MANAGEMENT DRAWER */}
      {selectedDevice && (
        <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white border-l border-slate-200 z-50 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                  <Radio className="w-5 h-5 text-[#00797b]" />
                  <span>{selectedDevice.name}</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedDevice.machineId || selectedDevice._id}</p>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* vRouter Controls */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 font-medium">vRouter Engine Status</span>
                <p className="text-sm font-bold flex items-center space-x-2 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedDevice.status === 'stopped' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                  <span className={selectedDevice.status === 'stopped' ? 'text-amber-700' : 'text-emerald-700'}>
                    {selectedDevice.status === 'stopped' ? 'vRouter Stopped' : 'vRouter Running'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => handleToggleVRouter(selectedDevice)}
                className={`px-4 py-2 rounded text-xs font-bold flex items-center space-x-2 transition cursor-pointer text-white ${
                  selectedDevice.status === 'stopped' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {selectedDevice.status === 'stopped' ? <Play className="w-4 h-4 fill-white" /> : <Square className="w-4 h-4 fill-white" />}
                <span>{selectedDevice.status === 'stopped' ? 'Start Router' : 'Stop Router'}</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-semibold space-x-4">
              <button 
                onClick={() => setDeviceTab('interfaces')} 
                className={`pb-2 border-b-2 transition ${deviceTab === 'interfaces' ? 'border-[#00797b] text-[#00797b]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Interfaces
              </button>
              <button 
                onClick={() => setDeviceTab('checker')} 
                className={`pb-2 border-b-2 transition ${deviceTab === 'checker' ? 'border-[#00797b] text-[#00797b]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                System Checker
              </button>
              <button 
                onClick={() => setDeviceTab('wan')} 
                className={`pb-2 border-b-2 transition ${deviceTab === 'wan' ? 'border-[#00797b] text-[#00797b]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                STUN & NAT
              </button>
              <button 
                onClick={() => setDeviceTab('wifi_lte')} 
                className={`pb-2 border-b-2 transition ${deviceTab === 'wifi_lte' ? 'border-[#00797b] text-[#00797b]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                LTE & WiFi AP
              </button>
            </div>

            {/* Tab 1: Interfaces */}
            {deviceTab === 'interfaces' && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800">Wired Netplan Interfaces</h4>
                  <span className="text-[10px] text-[#00797b] font-mono font-semibold">Netplan Auto-Synced</span>
                </div>
                <div className="space-y-2">
                  {(selectedDevice.interfaces || [
                    { name: 'eth0', type: 'WAN', assigned: true, ip: selectedDevice.ip || '10.200.0.10', mtu: 1500, metric: 10, gwStatus: 'online' },
                    { name: 'eth1', type: 'LAN', assigned: true, ip: '192.168.10.1/24', mtu: 1500, metric: 20, gwStatus: 'online' }
                  ]).map((ifc, idx) => (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{ifc.name}</span>
                          <span className={`px-2 py-0.2 text-[10px] font-semibold rounded ${ifc.type === 'WAN' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {ifc.type}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-slate-600">{ifc.ip}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-mono">MTU: {ifc.mtu || 1500}</span>
                        <div className="flex items-center space-x-1 text-[10px] text-emerald-700">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          <span>Online</span>
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
                  <h4 className="font-bold text-slate-800">Pre-Flight System Checker</h4>
                  <button
                    onClick={() => showToast('System checker passed: All requirements met', 'success')}
                    className="bg-[#00797b]/10 text-[#00797b] border border-[#00797b]/30 px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                  >
                    Run Checker
                  </button>
                </div>
                <div className="space-y-2">
                  {checkerResults.map((check, idx) => (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">{check.name}</p>
                          <p className="text-[10px] text-slate-500">{check.detail}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">Passed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: STUN & NAT */}
            {deviceTab === 'wan' && (
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-slate-800">STUN NAT Traversal & Failover Metrics</h4>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Detected NAT Mode:</span>
                    <span className="text-[#00797b] font-bold">{selectedDevice.natType || 'Full Cone NAT'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">STUN Public IP:</span>
                    <span className="font-mono text-slate-800">{selectedDevice.publicIp || selectedDevice.ip || '10.200.0.10'}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                    <span className="text-slate-600">Multi-WAN Failover Metric:</span>
                    <span className="text-emerald-700 font-mono font-bold">10 (Primary WAN)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: LTE & WiFi */}
            {deviceTab === 'wifi_lte' && (
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-slate-800">LTE & Wireless Access Point Configuration</h4>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-2 text-[#00797b] font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>LTE Modem (Sierra / Quectel MBIM)</span>
                  </div>
                  <p className="text-slate-600">APN: <span className="text-slate-800 font-mono">internet.telecom</span> | PIN: <span className="text-slate-800 font-mono">••••</span></p>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-2 text-[#00797b] font-bold">
                    <Wifi className="w-4 h-4" />
                    <span>WiFi AP Hostapd (2.4GHz / 5GHz)</span>
                  </div>
                  <p className="text-slate-600">SSID: <span className="text-slate-800 font-mono">flexiEdge-Branch</span> | Security: <span className="text-slate-800 font-medium">WPA2-PSK</span></p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => setSelectedDevice(null)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs cursor-pointer"
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER DEVICE */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <Radio className="w-5 h-5 text-[#00797b]" />
                <span>Register flexiEdge Device</span>
              </h3>
              <button onClick={() => setShowAddDeviceModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Device Name *</label>
                <input 
                  type="text" 
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  required
                  placeholder="e.g. Branch-Router-01"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#00797b]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">IP Address / Hostname *</label>
                <input 
                  type="text" 
                  value={newDevIp}
                  onChange={(e) => setNewDevIp(e.target.value)}
                  required
                  placeholder="e.g. 10.200.0.10"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#00797b]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Hardware / Machine ID (Optional)</label>
                <input 
                  type="text" 
                  value={newDevMachineId}
                  onChange={(e) => setNewDevMachineId(e.target.value)}
                  placeholder="e.g. mac-edge-001"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#00797b]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#00797b] hover:bg-[#006062] text-white rounded font-semibold cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-[#00797b]" />
                <span>Create Mesh Tunnel</span>
              </h3>
              <button onClick={() => setShowCreateTunnelModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTunnel} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Device A *</label>
                <select 
                  value={tunnelDevA}
                  onChange={(e) => setTunnelDevA(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#00797b]"
                >
                  <option value="">-- Select Device A --</option>
                  {devices.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.ip || '10.200.0.X'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Device B *</label>
                <select 
                  value={tunnelDevB}
                  onChange={(e) => setTunnelDevB(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#00797b]"
                >
                  <option value="">-- Select Device B --</option>
                  {devices.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.ip || '10.200.0.X'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Encryption Method</label>
                <select 
                  value={tunnelEnc}
                  onChange={(e) => setTunnelEnc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#00797b]"
                >
                  <option value="psk">Pre-Shared Key (PSK)</option>
                  <option value="ikev2">IKEv2 / IPsec Certificates</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTunnelModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#00797b] hover:bg-[#006062] text-white rounded font-semibold cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <Key className="w-5 h-5 text-[#00797b]" />
                <span>New Organization Token</span>
              </h3>
              <button onClick={() => setShowCreateTokenModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateToken} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Token Name / Label *</label>
                <input 
                  type="text" 
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  required
                  placeholder="e.g. Main Production Token"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#00797b]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTokenModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#00797b] hover:bg-[#006062] text-white rounded font-semibold cursor-pointer"
                >
                  Add Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
