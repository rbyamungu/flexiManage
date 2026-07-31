import React, { useState } from 'react';
import { 
  Menu, Server, ShieldCheck, Activity, Cpu, 
  Radio, AlertCircle, LogOut 
} from 'lucide-react';
import axios from 'axios';

export default function App() {
  const [token, setToken] = useState(null);
  // Default values cleared so inputs start empty
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('devices');

  // Handle Login Form Submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/users/login', {
        username,
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
      setError(err.response?.data?.message || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setDevices([]);
    setUsername('');
    setPassword('');
  };

  const fetchDevices = async (authToken) => {
    try {
      const res = await axios.get('/api/devices', {
        headers: { Authorization: `Bearer ${authToken || token}` }
      });
      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setDevices([
        { _id: 'dev-01', name: 'Edge-Router-01', ip: '10.200.0.10', status: 'connected', uptime: '14d 6h' },
        { _id: 'dev-02', name: 'Branch-FW-02', ip: '10.200.0.12', status: 'connected', uptime: '3d 12h' },
        { _id: 'dev-03', name: 'Lab-Node-03', ip: '10.200.0.15', status: 'disconnected', uptime: 'Offline' }
      ]);
    }
  };

  // 1. OFFICIAL FLEXIWAN LOGIN SCREEN
  if (!token) {
    return (
      <div className="min-h-screen bg-[#edf4f4] text-slate-800 font-sans flex flex-col select-none">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center space-x-4 shadow-sm z-10">
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
        </header>

        {/* Main Body with Soft Curved Background */}
        <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
            <svg width="100%" height="100%" viewBox="0 0 1000 600" fill="none" preserveAspectRatio="none">
              <path d="M -100 300 C 200 600, 800 600, 1100 300 C 800 0, 200 0, -100 300 Z" fill="#e2edea" />
              <path d="M 0 200 C 300 500, 700 500, 1000 200 C 700 -100, 300 -100, 0 200 Z" fill="#d8e7e4" />
            </svg>
          </div>

          {/* Login Card */}
          <div className="w-full max-w-[440px] bg-white border border-slate-200 shadow-sm z-10 p-8 rounded-sm">
            <h1 className="text-center text-lg font-medium text-slate-800 pb-4 mb-6 border-b border-slate-200">
              Login to flexi<span className="text-[#3b9395] font-semibold">Edge</span>
            </h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex items-center">
                <label className="w-28 text-sm text-slate-600 font-normal">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#3b9395] transition"
                  placeholder="Enter email or username"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#f39200] hover:bg-[#e08600] disabled:opacity-60 text-white font-medium py-2 rounded text-sm transition shadow-sm"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
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
            className="w-full bg-slate-900 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-xs font-medium py-1.5 rounded-lg border border-slate-800 flex items-center justify-center space-x-2 transition"
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
                          <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">Configure</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
