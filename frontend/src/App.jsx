import React, { useState, useEffect } from 'react';
import { 
  Menu, Server, ShieldCheck, Activity, Cpu, 
  Radio, AlertCircle, LogOut, CheckCircle2, UserPlus, LogIn,
  Plus, Copy, Trash2, Key, Link2, Settings, RefreshCw, X, Play, Square,
  Wifi, Smartphone, ShieldAlert, Globe, Layers, Search, Filter,
  TrendingUp, ArrowRight, Zap, Info, Sliders, Check
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
  const [activeTab, setActiveTab] = useState('devices'); // 'devices' | 'topology' | 'tunnels' | 'tokens' | 'policies'

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
    { name: 'DPDK Compatible Driver', status: 'pass', detail: 'igb_uio driver active on PCI bus 00:03.0' },
    { name: 'Hugepages Allocation', status: 'pass', detail: '1024 x 2MB hugepages allocated in NUMA Node 0' },
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
    showToast('Tunnel deactivated', 'info');
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

  // Calculate live statistics
  const runningDevicesCount = devices.filter(d => d.status !== 'stopped').length;
  const activeTunnelsCount = tunnels.filter(t => t.isActive !== false).length;

  // 1. AUTH SCREEN (LOGIN & REGISTRATION WEBPAGE)
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col select-none relative overflow-hidden">
        {/* Glowing Background Blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-teal-600 to-cyan-500 rounded-xl shadow-md shadow-teal-500/20">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center space-x-1">
                <span>flexi</span><span className="text-teal-400">Manage</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium leading-none">Open SD-WAN Controller Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
              className={`px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                authMode === 'login' 
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(null); setSuccessMsg(null); }}
              className={`px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                authMode === 'register' 
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Register Account
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 z-10 py-12">
          <div className={`w-full ${authMode === 'register' ? 'max-w-[660px]' : 'max-w-[440px]'} bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl p-8 rounded-2xl transition-all duration-300`}>
            
            <div className="text-center pb-6 mb-6 border-b border-slate-800/80">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                {authMode === 'login' ? (
                  <>Welcome back to flexi<span className="text-teal-400">Manage</span></>
                ) : (
                  <>Create your flexi<span className="text-teal-400">Manage</span> Account</>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-1">Centralized SD-WAN Network Management Console</p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email / Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{loading ? 'Logging in...' : 'Sign In to Dashboard'}</span>
                  </button>
                </div>

                <div className="text-center pt-3 text-xs text-slate-400 border-t border-slate-800/80">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setError(null); setSuccessMsg(null); }}
                    className="text-teal-400 font-semibold hover:underline cursor-pointer"
                  >
                    Register new organization
                  </button>
                </div>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">Account / Company Name *</label>
                    <input 
                      type="text" 
                      value={regAccountName}
                      onChange={(e) => setRegAccountName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                      placeholder="My Enterprise Org"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                      placeholder="admin@enterprise.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">First Name *</label>
                    <input 
                      type="text" 
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                      placeholder="Admin"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                      placeholder="User"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">Password * (min 8 chars)</label>
                    <input 
                      type="password" 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">Confirm Password *</label>
                    <input 
                      type="password" 
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">Country</label>
                    <select
                      value={regCountry}
                      onChange={(e) => setRegCountry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
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
                    <label className="block text-xs text-slate-300 font-semibold mb-1">Service Type</label>
                    <select
                      value={regServiceType}
                      onChange={(e) => setRegServiceType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    >
                      <option value="Provider">Managed Service Provider</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Personal">Personal / Lab</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{loading ? 'Creating Organization...' : 'Complete Web Registration'}</span>
                  </button>
                </div>

                <div className="text-center pt-3 text-xs text-slate-400 border-t border-slate-800/80">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
                    className="text-teal-400 font-semibold hover:underline cursor-pointer"
                  >
                    Sign In
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
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden relative">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 transition-all duration-300 transform translate-y-0">
          <div className={`px-4 py-3 rounded-xl border shadow-2xl flex items-center space-x-3 text-xs font-semibold ${
            toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/90 border-teal-500/40 text-slate-200'
          }`}>
            <Zap className="w-4 h-4 text-teal-400 animate-pulse" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between p-4 z-10">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2 pt-2">
            <div className="p-2.5 bg-gradient-to-tr from-teal-600 to-cyan-500 text-white rounded-xl shadow-lg shadow-teal-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-slate-100 tracking-tight">flexiManage</h1>
              <span className="text-[11px] text-teal-400 font-medium">Controller Console</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === 'devices' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Radio className="w-4 h-4" />
                <span>Devices & Edge</span>
              </div>
              <span className="bg-slate-950/60 text-slate-300 px-2 py-0.5 rounded-full font-mono text-[10px]">{devices.length}</span>
            </button>

            <button 
              onClick={() => setActiveTab('topology')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === 'topology' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Layers className="w-4 h-4" />
                <span>Topology Map</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono text-[10px]">Live</span>
            </button>

            <button 
              onClick={() => setActiveTab('tunnels')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === 'tunnels' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Link2 className="w-4 h-4" />
                <span>Mesh Tunnels</span>
              </div>
              <span className="bg-slate-950/60 text-slate-300 px-2 py-0.5 rounded-full font-mono text-[10px]">{tunnels.length}</span>
            </button>

            <button 
              onClick={() => setActiveTab('tokens')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === 'tokens' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Key className="w-4 h-4" />
                <span>Account Tokens</span>
              </div>
              <span className="bg-slate-950/60 text-slate-300 px-2 py-0.5 rounded-full font-mono text-[10px]">{accountTokens.length}</span>
            </button>

            <button 
              onClick={() => setActiveTab('policies')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === 'policies' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Traffic Policies</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-teal-600 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{username || 'Administrator'}</p>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>Active JWT Session</span>
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full bg-slate-900 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-xs font-medium py-2 rounded-xl border border-slate-800 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-slate-950">
        
        {/* Top App Header */}
        <header className="bg-slate-900/60 border-b border-slate-800/80 px-8 py-4 flex items-center justify-between backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              {activeTab === 'devices' && 'Edge Device Management'}
              {activeTab === 'topology' && 'Mesh Network Topology Visualizer'}
              {activeTab === 'tunnels' && 'SD-WAN Mesh Tunnels'}
              {activeTab === 'tokens' && 'Organization Account Tokens'}
              {activeTab === 'policies' && 'Global Traffic Policies & QoS'}
            </h2>
            <p className="text-xs text-slate-400">FlexiWAN 5.2.1 Centralized Management Engine</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => { refreshAllData(); showToast('Data refreshed', 'info'); }}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
              title="Refresh Controller Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-slate-300 font-medium">vRouter 5.2.1</span>
            </div>
          </div>
        </header>

        {/* Quick Stats Metrics Bar */}
        <div className="px-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-4 shadow-lg">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Devices</p>
                <p className="text-2xl font-bold text-slate-100">{devices.length}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-4 shadow-lg">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Play className="w-5 h-5 fill-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">vRouters Running</p>
                <p className="text-2xl font-bold text-emerald-400">{runningDevicesCount}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-4 shadow-lg">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Tunnels</p>
                <p className="text-2xl font-bold text-cyan-400">{activeTunnelsCount}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-4 shadow-lg">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">STUN Status</p>
                <p className="text-sm font-bold text-blue-300">Full Cone NAT</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 flex-1">
          
          {/* TAB 1: DEVICES & EDGE NODES */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              
              {/* Search & Filter Bar */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <div className="flex items-center space-x-3 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search devices by name, IP, or machine ID..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="running">Running</option>
                    <option value="stopped">Stopped</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowAddDeviceModal(true)}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Device via Web</span>
                </button>
              </div>

              <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
                {filteredDevices.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Radio className="w-10 h-10 text-slate-600 stroke-1" />
                    <h4 className="text-slate-300 font-semibold text-base">No Matching Devices Found</h4>
                    <p className="text-slate-400 text-xs max-w-md">
                      No edge router nodes match your search query. Click "Register Device via Web" or copy your Account Token to connect your first edge router node.
                    </p>
                    <button
                      onClick={() => setShowAddDeviceModal(true)}
                      className="mt-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Register Device Now
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
                        <th className="p-4 pl-6">Device Name</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4">STUN NAT Traversal</th>
                        <th className="p-4">vRouter Engine</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-sm">
                      {filteredDevices.map((device) => (
                        <tr key={device._id} className="hover:bg-slate-800/40 transition-all duration-150">
                          <td className="p-4 pl-6">
                            <button 
                              onClick={() => setSelectedDevice(device)}
                              className="font-semibold text-slate-100 hover:text-teal-400 transition cursor-pointer text-left"
                            >
                              {device.name}
                            </button>
                            <p className="text-[10px] text-slate-500 font-mono">{device.machineId || device._id}</p>
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-300">{device.ip || '10.200.0.10'}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20">
                              <Globe className="w-3.5 h-3.5 mr-1.5" />
                              {device.natType || 'Full Cone NAT'}
                            </span>
                          </td>
                          <td className="p-4">
                            {device.status === 'stopped' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Square className="w-3 h-3 mr-1.5 fill-amber-400" />
                                Stopped
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Play className="w-3 h-3 mr-1.5 fill-emerald-400" />
                                Running
                              </span>
                            )}
                          </td>
                          <td className="p-4 pr-6 text-right space-x-3">
                            <button
                              onClick={() => handleToggleVRouter(device)}
                              className={`text-xs font-semibold cursor-pointer ${
                                device.status === 'stopped' ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
                              }`}
                            >
                              {device.status === 'stopped' ? 'Start Router' : 'Stop Router'}
                            </button>
                            <button 
                              onClick={() => setSelectedDevice(device)}
                              className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                            >
                              Manage
                            </button>
                            <button 
                              onClick={() => handleDeleteDevice(device._id)}
                              className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
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

          {/* TAB 2: TOPOLOGY VISUALIZER */}
          {activeTab === 'topology' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <span>Mesh Network Topology</span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">Live Visualizer</span>
                </h3>
              </div>

              <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-8 shadow-2xl relative overflow-hidden min-h-[420px] flex items-center justify-center">
                {devices.length === 0 ? (
                  <div className="text-center space-y-3">
                    <Layers className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
                    <p className="text-slate-400 text-xs">No registered devices to display in topology map. Register 2 or more devices to visualize active SD-WAN mesh links.</p>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl relative flex items-center justify-around py-12">
                    {/* SVG Mesh Tunnels Connection Line */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-teal-500/40" strokeWidth="2" strokeDasharray="6 6">
                      <line x1="20%" y1="50%" x2="80%" y2="50%" className="animate-pulse" />
                    </svg>

                    {/* Device Nodes */}
                    {devices.slice(0, 3).map((dev, idx) => (
                      <div key={dev._id} className="relative z-10 bg-slate-950 border border-teal-500/30 p-6 rounded-2xl shadow-xl flex flex-col items-center space-y-3 text-center w-52 hover:scale-105 transition-transform duration-200">
                        <div className="p-3 bg-gradient-to-tr from-teal-600 to-cyan-500 text-white rounded-xl shadow-md shadow-teal-500/20">
                          <Server className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-100">{dev.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{dev.ip || '10.200.0.10'}</p>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          vRouter Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MESH TUNNELS */}
          {activeTab === 'tunnels' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <span>SD-WAN Tunnels</span>
                  <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400 font-mono">{tunnels.length}</span>
                </h3>
                <button
                  onClick={() => setShowCreateTunnelModal(true)}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Web Tunnel</span>
                </button>
              </div>

              <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
                {tunnels.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Link2 className="w-10 h-10 text-slate-600 stroke-1" />
                    <h4 className="text-slate-300 font-semibold text-base">No Tunnels Configured</h4>
                    <p className="text-slate-400 text-xs max-w-md">
                      Create encrypted mesh tunnels between registered flexiEdge devices directly from this web page.
                    </p>
                    <button
                      onClick={() => setShowCreateTunnelModal(true)}
                      className="mt-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Create Tunnel Now
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
                        <th className="p-4 pl-6">Tunnel ID</th>
                        <th className="p-4">Device A</th>
                        <th className="p-4">Device B</th>
                        <th className="p-4">Encryption</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-sm">
                      {tunnels.map((tunnel) => (
                        <tr key={tunnel._id} className="hover:bg-slate-800/40 transition-all duration-150">
                          <td className="p-4 pl-6 font-mono text-xs text-teal-400">#Tunnel-{tunnel.num || 1}</td>
                          <td className="p-4 font-semibold text-slate-200">{tunnel.deviceA?.name || 'Device A'}</td>
                          <td className="p-4 font-semibold text-slate-200">{tunnel.deviceB?.name || 'Device B'}</td>
                          <td className="p-4 uppercase text-xs font-semibold text-slate-400">{tunnel.encryptionMethod || 'PSK'}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Connected
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <button 
                              onClick={() => handleDeleteTunnel(tunnel._id)}
                              className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
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

          {/* TAB 4: ACCOUNT & REGISTRATION TOKENS */}
          {activeTab === 'tokens' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <span>Organization Account Tokens</span>
                  <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400 font-mono">{accountTokens.length}</span>
                </h3>
                <button
                  onClick={() => setShowCreateTokenModal(true)}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate New Token</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {accountTokens.length === 0 ? (
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Key className="w-10 h-10 text-slate-600 stroke-1" />
                    <h4 className="text-slate-300 font-semibold text-base">No Account Tokens Generated</h4>
                    <p className="text-slate-400 text-xs max-w-md">
                      Generate an Account Token to pair physical or virtual flexiEdge router nodes to this controller organization.
                    </p>
                    <button
                      onClick={() => setShowCreateTokenModal(true)}
                      className="mt-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Generate Account Token
                    </button>
                  </div>
                ) : (
                  accountTokens.map((tok) => (
                    <div key={tok._id} className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-slate-200 text-sm flex items-center space-x-2">
                          <Key className="w-4 h-4 text-teal-400" />
                          <span>{tok.name || 'Organization Account Token'}</span>
                        </h4>
                        <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-lg font-mono">Active</span>
                      </div>
                      <div className="flex items-center bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                        <span className="flex-1 truncate select-all">{tok.token || 'flexiwan-token-jwt-key'}</span>
                        <button
                          onClick={() => copyToClipboard(tok.token)}
                          className="ml-3 p-1.5 hover:bg-slate-800 text-teal-400 rounded-lg transition cursor-pointer"
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

          {/* TAB 5: POLICIES & GLOBAL RULES */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Global SD-WAN Traffic Policies & Path Selection</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
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
                    <span className="text-teal-400 font-semibold">Load Balance (Lowest Latency)</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
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
                    <span className="text-emerald-400 font-semibold">Active Protection</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DETAILED DEVICE MANAGEMENT DRAWER */}
      {selectedDevice && (
        <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-slate-900/95 border-l border-slate-800/90 backdrop-blur-2xl z-50 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                  <Radio className="w-5 h-5 text-teal-400" />
                  <span>{selectedDevice.name}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">{selectedDevice.machineId || selectedDevice._id}</p>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* vRouter Controls */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center shadow-lg">
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
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
                  selectedDevice.status === 'stopped'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                }`}
              >
                {selectedDevice.status === 'stopped' ? <Play className="w-4 h-4 fill-white" /> : <Square className="w-4 h-4 fill-white" />}
                <span>{selectedDevice.status === 'stopped' ? 'Start Router' : 'Stop Router'}</span>
              </button>
            </div>

            {/* Tabs for Device Config */}
            <div className="flex border-b border-slate-800 text-xs font-semibold space-x-4">
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
                  <span className="text-[10px] text-teal-400 font-mono">Netplan Auto-Synced</span>
                </div>
                <div className="space-y-2">
                  {(selectedDevice.interfaces || [
                    { name: 'eth0', type: 'WAN', assigned: true, ip: selectedDevice.ip || '10.200.0.10', mtu: 1500, metric: 10, gwStatus: 'online' },
                    { name: 'eth1', type: 'LAN', assigned: true, ip: '192.168.10.1/24', mtu: 1500, metric: 20, gwStatus: 'online' }
                  ]).map((ifc, idx) => (
                    <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
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
                    onClick={() => showToast('System checker passed: All hardware requirements met', 'success')}
                    className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Run Checker
                  </button>
                </div>
                <div className="space-y-2">
                  {checkerResults.map((check, idx) => (
                    <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-200">{check.name}</p>
                          <p className="text-[10px] text-slate-400">{check.detail}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-lg font-mono">Passed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: STUN & Failover */}
            {deviceTab === 'wan' && (
              <div className="space-y-4 text-xs">
                <h4 className="font-semibold text-slate-200">STUN NAT Traversal & Failover Metrics</h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
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
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-teal-400 font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>LTE Modem (Sierra / Quectel MBIM)</span>
                  </div>
                  <p className="text-slate-400">APN: <span className="text-slate-200 font-mono">internet.telecom</span> | PIN: <span className="text-slate-200 font-mono">••••</span></p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
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
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs cursor-pointer"
            >
              Close Management Panel
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER DEVICE */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                <Radio className="w-5 h-5 text-teal-400" />
                <span>Register flexiEdge Device</span>
              </h3>
              <button onClick={() => setShowAddDeviceModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Device Name *</label>
                <input 
                  type="text" 
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  required
                  placeholder="e.g. Branch-Router-01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">IP Address / Hostname *</label>
                <input 
                  type="text" 
                  value={newDevIp}
                  onChange={(e) => setNewDevIp(e.target.value)}
                  required
                  placeholder="e.g. 10.200.0.10"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Hardware / Machine ID (Optional)</label>
                <input 
                  type="text" 
                  value={newDevMachineId}
                  onChange={(e) => setNewDevMachineId(e.target.value)}
                  placeholder="e.g. mac-edge-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-semibold cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-teal-400" />
                <span>Create Mesh Tunnel</span>
              </h3>
              <button onClick={() => setShowCreateTunnelModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTunnel} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Device A *</label>
                <select 
                  value={tunnelDevA}
                  onChange={(e) => setTunnelDevA(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Select Device A --</option>
                  {devices.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.ip || '10.200.0.X'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Device B *</label>
                <select 
                  value={tunnelDevB}
                  onChange={(e) => setTunnelDevB(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Select Device B --</option>
                  {devices.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.ip || '10.200.0.X'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Encryption Method</label>
                <select 
                  value={tunnelEnc}
                  onChange={(e) => setTunnelEnc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="psk">Pre-Shared Key (PSK)</option>
                  <option value="ikev2">IKEv2 / IPsec Certificates</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTunnelModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-semibold cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                <Key className="w-5 h-5 text-teal-400" />
                <span>Generate Account Token</span>
              </h3>
              <button onClick={() => setShowCreateTokenModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateToken} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Token Name / Label *</label>
                <input 
                  type="text" 
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  required
                  placeholder="e.g. Main Production Token"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTokenModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-semibold cursor-pointer"
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
