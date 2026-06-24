import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('api')
  const [simulatorStatus, setSimulatorStatus] = useState('idle') // idle, running, finished
  const [pingResults, setPingResults] = useState([])

  // Global nodes configuration for simulator
  const nodes = [
    { id: 'us', name: 'US East (New York)', flag: '🇺🇸', delay: 800 },
    { id: 'eu', name: 'EU West (London)', flag: '🇬🇧', delay: 1400 },
    { id: 'asia', name: 'Asia East (Tokyo)', flag: '🇯🇵', delay: 2000 },
    { id: 'sa', name: 'SA East (São Paulo)', flag: '🇧🇷', delay: 2600 },
    { id: 'au', name: 'AU East (Sydney)', flag: '🇦🇺', delay: 3200 },
  ]

  const targets = {
    api: 'https://api.production.app/v1/health',
    db: 'postgresql://db-primary.internal:5432',
    cdn: 'https://cdn.assets-cache.net/logo.png',
  }

  // Handle global ping simulation
  const startSimulation = () => {
    setSimulatorStatus('running')
    setPingResults(nodes.map(node => ({ ...node, status: 'pending', ping: null })))

    nodes.forEach((node, index) => {
      setTimeout(() => {
        setPingResults(prev => prev.map(item => {
          if (item.id === node.id) {
            // Generate realistic response times based on region
            const randomPing = Math.floor(Math.random() * 80) + (index === 0 ? 12 : index * 65 + 40)
            return {
              ...item,
              status: 'success',
              ping: randomPing,
              statusCode: 200
            }
          }
          return item
        }))
        if (index === nodes.length - 1) {
          setSimulatorStatus('finished')
        }
      }, node.delay)
    })
  }

  // Pre-fill results on page load
  useEffect(() => {
    startSimulation()
  }, [activeTab])

  return (
    <div className="min-height-screen bg-[#0a0f1e] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden font-sans relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none z-0" />
      <div className="absolute top-[800px] -left-[200px] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[1400px] -right-[200px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 w-full z-50 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-100 to-slate-200 bg-clip-text text-transparent tracking-tight">
                UpTime<span className="text-indigo-400 font-semibold">Monitor</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors duration-150">Features</a>
              <a href="#simulator" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors duration-150">Live Demo</a>
              <a href="#docs" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors duration-150">Docs</a>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all duration-200"
              >
                Go to Dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors duration-150 px-3 py-2">
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-slate-200 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-slate-800/80 bg-[#0a0f1e]"
            >
              <div className="px-4 pt-2 pb-6 space-y-3">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Features
                </a>
                <a
                  href="#simulator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Live Demo
                </a>
                <a
                  href="#docs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Docs
                </a>
                <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                  {user ? (
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/dashboard') }}
                      className="w-full py-2.5 text-center bg-indigo-500 text-white rounded-lg font-medium text-sm"
                    >
                      Go to Dashboard
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full py-2.5 text-center bg-slate-800 text-slate-200 rounded-lg font-medium text-sm hover:bg-slate-700"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full py-2.5 text-center bg-indigo-500 text-white rounded-lg font-medium text-sm hover:bg-indigo-600"
                      >
                        Sign Up Free
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-20 pb-16 lg:pt-32 lg:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Enterprise-Grade Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Modern Uptime Monitoring for{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Production Apps
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0">
              Monitor APIs, databases, CDNs, and websites from multiple global locations. Get instant notifications and status dashboards, entirely out-of-the-box.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-center shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                Start Monitoring Free
              </Link>
              <a
                href="#simulator"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 font-semibold rounded-xl text-center border border-slate-700/60 transition-all duration-200"
              >
                Try Live Test
              </a>
            </div>

            {/* Social Proof Stats */}
            <div className="grid grid-cols-3 gap-6 pt-10 max-w-md mx-auto lg:mx-0 border-t border-slate-800/80">
              <div>
                <div className="text-2xl font-bold text-slate-100">1 min</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Check Interval</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">5+</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Global Nodes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">99.99%</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Target SLA</div>
              </div>
            </div>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 rounded-2xl blur-[40px] pointer-events-none" />
            <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
              {/* Card Window Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/30" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
                </div>
                <div className="px-3 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-400">
                  dashboard.uptimemonitor.app
                </div>
                <div className="w-6" />
              </div>

              {/* Monitor Main Info */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-200">Main API Gateway</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">https://api.payment-gateway.com/health</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Uptime (30d)</span>
                  <span className="text-xl font-bold text-slate-200">99.98%</span>
                </div>
              </div>

              {/* Aggregated Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Avg Latency</span>
                  <span className="text-base font-bold text-indigo-300 mt-1 block">246 ms</span>
                </div>
                <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Checks Run</span>
                  <span className="text-base font-bold text-slate-300 mt-1 block">43,200</span>
                </div>
                <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Incidents</span>
                  <span className="text-base font-bold text-emerald-400 mt-1 block">0 Active</span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>Uptime History (Last 90 days)</span>
                  <span>100.0% operational</span>
                </div>
                {/* 30 timeline ticks */}
                <div className="flex gap-1 h-7">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const isDegraded = i === 12;
                    const isDown = i === 22;
                    let color = 'bg-emerald-500 hover:bg-emerald-400';
                    let tooltip = 'Operational (100%)';
                    if (isDegraded) {
                      color = 'bg-amber-500 hover:bg-amber-400';
                      tooltip = 'Degraded Performance (340ms)';
                    } else if (isDown) {
                      color = 'bg-red-500 hover:bg-red-400';
                      tooltip = 'Downtime (4 mins)';
                    }
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${color} transition-colors duration-150 relative group cursor-pointer`}
                      >
                        {/* Custom Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950 text-[10px] text-slate-200 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-20 border border-slate-800">
                          {tooltip}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-1.5 font-medium">
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Global Ping Simulator ────────────────────────────────────────── */}
      <section id="simulator" className="relative z-10 py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
              Test Our Global Infrastructure Live
            </h2>
            <p className="text-lg text-slate-400">
              Select one of our mock targets and see response latency measured from nodes around the globe in real time.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            {/* Control Panel */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                    Select Endpoint Target
                  </label>
                  <div className="space-y-2.5">
                    {Object.keys(targets).map((key) => (
                      <button
                        key={key}
                        disabled={simulatorStatus === 'running'}
                        onClick={() => setActiveTab(key)}
                        className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all duration-150 ${
                          activeTab === key
                            ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-100 shadow-lg shadow-indigo-500/5'
                            : 'bg-slate-800/30 border-slate-800/60 text-slate-400 hover:border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-semibold uppercase block text-indigo-400 font-mono">
                            {key === 'api' ? 'REST API' : key === 'db' ? 'DATABASE' : 'CONTENT ROUTE'}
                          </span>
                          <span className="text-sm font-semibold block truncate max-w-[280px] mt-0.5">
                            {targets[key]}
                          </span>
                        </div>
                        {activeTab === key && (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-800/20 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed">
                  💡 Clicking **Run Test Check** fires mock requests to verify DNS speed, routing, and handshake times across regional nodes, illustrating latency spikes by distance.
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/60 mt-6">
                <button
                  disabled={simulatorStatus === 'running'}
                  onClick={startSimulation}
                  className="w-full py-4 px-6 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold rounded-xl text-center shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all duration-200"
                >
                  {simulatorStatus === 'running' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Testing Global Nodes...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Run Test Check
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Terminal */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
              {/* Terminal Titlebar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/60">
                <span className="text-xs font-mono text-slate-400">Ping Output Engine</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold bg-slate-800 px-2 py-0.5 rounded">
                  Active check
                </span>
              </div>

              {/* Terminal Logs */}
              <div className="flex-1 p-5 font-mono text-xs sm:text-sm space-y-4">
                <AnimatePresence>
                  {pingResults.map((node, i) => (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900/40 border border-slate-900 rounded-xl hover:border-slate-800/80 transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{node.flag}</span>
                        <div>
                          <span className="text-slate-200 font-semibold block">{node.name}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">NODE ID: {node.id.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        {node.status === 'pending' ? (
                          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            Pinging...
                          </div>
                        ) : (
                          <>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Latency</span>
                              <span className="text-slate-200 font-bold text-sm">{node.ping} ms</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                              HTTP {node.statusCode}
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Terminal Stats Footer */}
              <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
                <span>Targets Tested: 1/1</span>
                {simulatorStatus === 'finished' ? (
                  <span className="text-emerald-400 font-bold">● SIMULATION COMPLETED SUCCESSFUL</span>
                ) : (
                  <span>STATUS: {simulatorStatus.toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24 lg:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16 lg:mb-20">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Features Tailored for Engineers
          </h2>
          <p className="text-lg text-slate-400">
            Everything you need to monitor service health, debug latency spikes, and communicate outages.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Card 1 */}
          <div className="p-6 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Real-Time Checks</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Verify website and REST endpoint statuses as frequently as every minute, keeping data fresh and actionable.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Detailed Analytics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Analyze rolling minimum, maximum, and average response times to diagnose performance drift and debug latency.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 mb-5 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 8a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h12a2 2 0 012 2v12z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Status Pages</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate public-facing dashboard status links to communicate service availability and system health transparently.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Incident Detector</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Verify downtime using automatic retry configurations to filter transient network glitches from true system outages.
            </p>
          </div>
        </div>
      </section>

      {/* ── Call To Action ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-tr from-slate-900 to-indigo-950/80 border border-indigo-500/15 rounded-3xl p-8 sm:p-12 lg:p-16 flex flex-col items-center text-center space-y-6">
          <div className="absolute inset-0 bg-radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_50%) pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Stop guessing. Start monitoring.
          </h2>
          <p className="text-slate-400 max-w-lg">
            Deploy your uptime monitoring workflow in seconds. Get started for free, no payment required.
          </p>
          <div className="pt-4">
            <Link
              to={user ? '/dashboard' : '/signup'}
              className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all duration-200"
            >
              Start Monitoring Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#070b15]/60 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-slate-200">UpTimeMonitor</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Monitoring global servers, websites, API layers, and database clusters. Keep track of status histories, SLA, and outages.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#features" className="hover:text-slate-350 transition-colors">Features</a></li>
              <li><a href="#simulator" className="hover:text-slate-350 transition-colors">Live Simulator</a></li>
              <li><a href="/login" className="hover:text-slate-350 transition-colors">Dashboard Overview</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Developer</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#docs" className="hover:text-slate-350 transition-colors">Documentation</a></li>
              <li><a href="https://github.com" className="hover:text-slate-350 transition-colors">GitHub Repository</a></li>
              <li><a href="https://status.io" className="hover:text-slate-350 transition-colors">Platform Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#about" className="hover:text-slate-350 transition-colors">About Us</a></li>
              <li><a href="#privacy" className="hover:text-slate-350 transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-slate-350 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-semibold">
          <span>&copy; {new Date().getFullYear()} UpTimeMonitor. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#twitter" className="hover:text-slate-500">Twitter</a>
            <a href="#github" className="hover:text-slate-500">GitHub</a>
            <a href="#discord" className="hover:text-slate-500">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
