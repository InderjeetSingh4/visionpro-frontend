import { useState, useEffect, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Video, RefreshCw, Activity, Trash2, ShieldCheck, Cpu, Database, Zap, Sparkles, Download, Lock, ArrowRight, Loader2, Server, Sun, Moon, Camera, User, Key, AlertTriangle, LogOut, CheckCircle2, AlertCircle, X, Smartphone, Monitor, Wifi, Menu } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';

// 🟢 YOUR LIVE NGROK TUNNEL LINK IS HARDCODED HERE
const BACKEND_URL = "https://illiquid-unappended-agnes.ngrok-free.dev";

const TrackedPanel = ({ children, className, isDarkMode }) => {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
  };
  return (
    <div onMouseMove={handleMouseMove} className={`relative group overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle 400px at var(--x, 50%) var(--y, 50%), ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}, transparent 80%)` }} />
      <div className="relative z-10 w-full h-full flex flex-col">{children}</div>
    </div>
  );
};

// ==========================================
// 🟢 THE MOBILE COMPANION APP UI
// ==========================================
const CompanionMode = ({ sessionId, hostIp }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Initializing Lens...');
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    const newChannel = supabase.channel(`room_${sessionId}`);
    newChannel.subscribe((state) => { if (state === 'SUBSCRIBED') setChannel(newChannel); });
    return () => { supabase.removeChannel(newChannel); }
  }, [sessionId]);

  useEffect(() => {
    if (!channel) return;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        if(videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setStatus('Streaming to Mainframe...');
        }
      })
      .catch(err => {
         setStatus('ERROR: Browser blocked camera. (Use Android Chrome Flags or Apple Wi-Fi)');
      });

    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = 640; canvas.height = 360;
      ctx.drawImage(videoRef.current, 0, 0, 640, 360);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const fd = new FormData(); fd.append('file', blob, 'live_frame.jpg');
        try {
          const res = await fetch(`${BACKEND_URL}/api/detect/image`, { 
              method: 'POST', 
              body: fd,
              headers: { 
                  "Bypass-Tunnel-Reminder": "true",
                  "ngrok-skip-browser-warning": "true" 
              }
          });
          if (res.ok) {
            const data = await res.json();
            channel.send({
              type: 'broadcast', event: 'frame', 
              payload: { image: data.image, metrics: { latency: data.latency, detections: data.detections } }
            });
          }
        } catch (e) {}
      }, 'image/jpeg', 0.5);
    }, 200);

    return () => clearInterval(interval);
  }, [channel, hostIp]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 sm:p-8 text-center font-sans">
        <Sparkles size={40} className="mb-6 text-indigo-400 animate-pulse" />
        <h1 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight">VisionPro Edge Node</h1>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-8 sm:mb-10 ${status.includes('ERROR') ? 'text-red-500' : 'text-emerald-400'}`}>{status}</p>
        <div className="relative w-full max-w-sm rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <video ref={videoRef} playsInline muted autoPlay className="w-full h-auto object-cover scale-105" />
        </div>
        <p className="text-[10px] sm:text-xs text-zinc-500 mt-8 max-w-xs">Keep this screen open. Processing is being offloaded to the local mainframe.</p>
        <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

// ==========================================
// 🟢 MAIN APPLICATION
// ==========================================
function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isCompanion = urlParams.get('companion') === 'true';
  const sessionIdParam = urlParams.get('session');
  const hostIpParam = urlParams.get('ip');

  if (isCompanion) return <CompanionMode sessionId={sessionIdParam} hostIp={hostIpParam} />;

  const [session, setSession] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authMessage, setAuthMessage] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('visionPro_theme') === 'dark');
  const [view, setView] = useState('detection'); 
  const [mode, setMode] = useState('image'); 
  const [status, setStatus] = useState('idle');
  const [file, setFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultVideo, setResultVideo] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRemoteActive, setIsRemoteActive] = useState(false); 
  const [showQRModal, setShowQRModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [pairingSession] = useState(() => Math.random().toString(36).substring(7));
  const [localIp, setLocalIp] = useState(window.location.hostname !== 'localhost' ? window.location.hostname : '192.168.x.x'); 
  const qrUrl = `http://${localIp}:5173/?companion=true&session=${pairingSession}&ip=${localIp}`;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const logsEndRef = useRef(null);
  const isProcessingRef = useRef(false); 
  
  const [systemLogs, setSystemLogs] = useState([{ id: 1, time: new Date().toLocaleTimeString(), msg: 'System initialized.' }]);
  const addLog = (msg) => { setSystemLogs(prev => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString(), msg }].slice(-15)); };

  useEffect(() => {
    if (window.location.hash.includes('error_code')) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { fetchHistory(session.user.id); setAvatarUrl(session.user.user_metadata?.avatar_url); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN') { fetchHistory(session?.user.id); setAvatarUrl(session?.user.user_metadata?.avatar_url); }
      if (event === 'SIGNED_OUT') { setHistory([]); setAvatarUrl(null); stopCamera(); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('visionPro_theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('visionPro_theme', 'light'); }
  }, [isDarkMode]);

  useEffect(() => {
      const channel = supabase.channel(`room_${pairingSession}`)
      .on('broadcast', { event: 'frame' }, ({ payload }) => {
          if (mode !== 'live') setMode('live');
          if (isCameraActive) setIsCameraActive(false);
          if (!isRemoteActive) {
              setIsRemoteActive(true);
              addLog("Mobile Edge Node connected.");
          }
          setResultImage(payload.image);
          setMetrics(payload.metrics);
      }).subscribe();
      return () => { supabase.removeChannel(channel); }
  }, [pairingSession, mode, isCameraActive, isRemoteActive]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true); setAuthError(null); setAuthMessage(null);
    try {
      if (isLoginMode) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) setSession(data.session);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setAuthMessage("Account created! Please log in.");
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (error) { setAuthError(error.message); } 
    finally { setIsAuthenticating(false); }
  };

  const handleSignOut = async () => { stopCamera(); await supabase.auth.signOut(); };

  const startCamera = async () => {
    try {
      setMode('live');
      setIsRemoteActive(false);
      setIsCameraActive(true); 
      setFile(null); 
      setOriginalPreview(null); 
      setResultImage(null); 
      setMetrics(null); 
      setStatus('idle');

      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: false 
      });

      setTimeout(() => {
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(e => console.error("Play prevented:", e));
              addLog("Hardware PC camera online.");
          } else {
              addLog("ERROR: Video element completely missing.");
          }
      }, 50);

    } catch (err) {
      console.error(err);
      addLog(`ERROR: Camera access denied.`);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    setIsCameraActive(false); setStatus('idle'); setResultImage(null);
  };

  const processLiveFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessingRef.current) return;
    isProcessingRef.current = true;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 640; canvas.height = 360;
    context.drawImage(videoRef.current, 0, 0, 640, 360);
    
    canvas.toBlob(async (blob) => {
      if (!blob) { isProcessingRef.current = false; return; }
      const formData = new FormData();
      formData.append('file', blob, 'live_frame.jpg');
      try {
        const response = await fetch(`${BACKEND_URL}/api/detect/image`, { 
            method: 'POST', 
            body: formData,
            headers: { 
                "Bypass-Tunnel-Reminder": "true",
                "ngrok-skip-browser-warning": "true"
            }
        });
        if (response.ok) {
            const data = await response.json();
            setResultImage(data.image); 
            setMetrics({ latency: data.latency || 0, detections: data.detections || {} });
        }
      } catch (err) {} finally { isProcessingRef.current = false; }
    }, 'image/jpeg', 0.6); 
  };

  const toggleLiveInference = () => {
    if (status === 'processing') {
      clearInterval(streamIntervalRef.current);
      setStatus('idle');
      addLog("Live analysis paused. Finalizing recording...");
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
      }
    } else {
      setStatus('processing');
      addLog("Live analysis started. Intercepting frames...");
      recordedChunksRef.current = [];
      const stream = videoRef.current.srcObject;
      if (stream) {
        let options = { mimeType: 'video/webm' };
        if (!MediaRecorder.isTypeSupported('video/webm')) options = { mimeType: 'video/mp4' };
        try {
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
            mediaRecorder.onstop = async () => {
               const blob = new Blob(recordedChunksRef.current, { type: options.mimeType });
               setResultVideo(URL.createObjectURL(blob));
               addLog("Live recording compiled. Ready for download.");
               const ext = options.mimeType.split('/')[1] || 'webm';
               const fileName = `${session.user.id}/live_${Date.now()}.${ext}`;
               const { error } = await supabase.storage.from('detections').upload(fileName, blob, { contentType: options.mimeType });
               if (!error) {
                  const { data: { publicUrl } } = supabase.storage.from('detections').getPublicUrl(fileName);
                  await supabase.from('detection_history').insert([{ user_id: session.user.id, file_name: 'Live Session Capture', media_url: publicUrl, latency: metrics?.latency || 0, media_type: 'video' }]);
                  fetchHistory(session.user.id);
               }
            };
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
        } catch(err) { addLog("Recording unsupported on this browser."); }
      }
      streamIntervalRef.current = setInterval(processLiveFrame, 150); 
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const isVideo = selectedFile.type.includes('video') || selectedFile.name.toLowerCase().match(/\.(mp4|mov|mkv|avi|hevc)$/i);
    if (mode === 'image' && isVideo) { addLog("Error: Switch to STREAM mode for videos."); return; }
    if (mode === 'video' && !isVideo) { addLog("Error: Switch to STATIC mode for images."); return; }
    setFile(selectedFile); setOriginalPreview(URL.createObjectURL(selectedFile));
    setResultImage(null); setResultVideo(null); setMetrics(null); setStatus('idle');
    if (isCameraActive) stopCamera(); 
    if (isRemoteActive) setIsRemoteActive(false);
  };

  const handleUpload = async () => {
    if (!file || !session) return;
    setStatus('processing'); addLog(`Initiating ${mode.toUpperCase()} analysis...`);
    const formData = new FormData(); formData.append('file', file);
    const endpoint = mode === 'image' ? `${BACKEND_URL}/api/detect/image` : `${BACKEND_URL}/api/detect/video`;
    try {
      const response = await fetch(endpoint, { 
          method: 'POST', 
          body: formData,
          headers: { 
              "Bypass-Tunnel-Reminder": "true",
              "ngrok-skip-browser-warning": "true"
          }
      });
      const data = await response.json();
      if (response.ok) {
        if (mode === 'image') setResultImage(data.image); else setResultVideo(`${data.video_url}?t=${Date.now()}`);
        setMetrics({ latency: data.latency || 0, detections: data.detections || {} });
        setStatus('success'); addLog(`Inference complete.`);
        
        let fileBlob; const rawMediaUrl = mode === 'image' ? data.image : data.video_url;
        const blobResponse = await fetch(rawMediaUrl); fileBlob = await blobResponse.blob();
        const fileName = `${session.user.id}/${Date.now()}.${mode === 'image' ? 'jpg' : 'mp4'}`;
        await supabase.storage.from('detections').upload(fileName, fileBlob, { contentType: mode === 'image' ? 'image/jpeg' : 'video/mp4' });
        const { data: { publicUrl } } = supabase.storage.from('detections').getPublicUrl(fileName);
        await supabase.from('detection_history').insert([{ user_id: session.user.id, file_name: file.name, media_url: publicUrl, latency: data.latency, media_type: mode }]);
        fetchHistory(session.user.id);
      } else { setStatus('error'); addLog(`Error: ${data.error || 'Model failed.'}`); }
    } catch (error) { setStatus('error'); addLog(`Error: Backend connection failed.`); }
  };

  const handleDownload = () => {
    const targetUrl = resultVideo || resultImage || originalPreview;
    if (!targetUrl) return;
    const link = document.createElement('a'); 
    link.href = targetUrl.split('?')[0]; 
    link.download = `VisionPro_Output_${Date.now()}.${targetUrl.includes('blob') || targetUrl.includes('mp4') || targetUrl.includes('webm') ? 'webm' : 'jpg'}`; 
    link.click();
    addLog("Download initiated.");
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setFile(null); setOriginalPreview(null); setResultImage(null); setResultVideo(null); setMetrics(null);
    if (isCameraActive) stopCamera();
    if (isRemoteActive) setIsRemoteActive(false);
  };

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    setResultImage(null); setResultVideo(null); setFile(null); setOriginalPreview(null); setMetrics(null);
    setTimeout(() => setIsRefreshing(false), 800); 
  };

  const fetchHistory = async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase.from('detection_history').select('*').order('created_at', { ascending: false });
    if (!error && data) setHistory(data.map(item => ({ id: item.id, time: new Date(item.created_at).toLocaleTimeString(), date: new Date(item.created_at).toLocaleDateString(), preview: item.media_url, fileName: item.file_name, latency: item.latency })));
  };

  const isMobile = window.innerWidth < 768;
  const tiltSettings = { tiltEnable: !isMobile, tiltMaxAngleX: 1.5, tiltMaxAngleY: 1.5, perspective: 1000, scale: 1.01, transitionSpeed: 2000, className: "w-full h-full rounded-[1.5rem] sm:rounded-[2rem] transform-gpu" };

  return (
    <div className="min-h-screen bg-[#E5E5EA] dark:bg-[#09090b] text-[#1D1D1F] dark:text-zinc-100 font-sans relative overflow-x-hidden flex flex-col transition-colors duration-1000">
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'); * { font-family: 'Inter', sans-serif; }`}} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full filter blur-[120px] ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-200/50'}`}></div>
        <div className={`absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full filter blur-[120px] ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-200/50'}`}></div>
        <div className={`absolute inset-0 opacity-20 dark:opacity-40 mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]`}></div>
      </div>

      <AnimatePresence>
        {showQRModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl border border-white/50 dark:border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative text-center">
                    <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-slate-500 hover:text-red-500"><X size={18} /></button>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#1D1D1F] dark:bg-white rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center text-white dark:text-[#1D1D1F] mb-6 mx-auto shadow-lg"><Wifi size={24} className="sm:w-7 sm:h-7" strokeWidth={1.5} /></div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white mb-2">Connect Mobile Node</h2>
                    
                    <div className="text-left mb-6 mt-6">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block text-center">Your Local IPv4 Address</label>
                        <input type="text" value={localIp} onChange={e => setLocalIp(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#1D1D1F] dark:focus:ring-white transition-all text-center tracking-widest" placeholder="e.g. 192.168.1.50" />
                    </div>

                    <div className="bg-white p-3 sm:p-4 rounded-[1.5rem] sm:rounded-3xl shadow-inner inline-block border border-slate-200">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`} alt="QR Code" className="w-[150px] h-[150px] sm:w-[180px] sm:h-[180px]" />
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-400 mt-6 uppercase tracking-widest leading-relaxed">Android Note: Connect via Wi-Fi</p>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {!session ? (
        <div className="flex-1 flex items-center justify-center relative z-20 px-4 py-8">
            <div className="w-full max-w-md bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                <div className="flex bg-white/60 dark:bg-black/40 p-1.5 rounded-2xl mb-8 relative shadow-inner">
                    {['login', 'signup'].map((tab) => {
                        const isActive = tab === 'login' ? isLoginMode : !isLoginMode;
                        return (
                            <button key={tab} onClick={() => { setIsLoginMode(tab === 'login'); setAuthError(null); setAuthMessage(null); }} className={`relative z-10 flex-1 py-3 text-xs font-bold rounded-xl transition-colors ${isActive ? 'text-white dark:text-[#1D1D1F]' : 'text-slate-500 hover:text-[#1D1D1F] dark:hover:text-white'}`}>
                                {isActive && <motion.div layoutId="auth-slider" className="absolute inset-0 bg-[#1D1D1F] dark:bg-white rounded-xl -z-10 shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
                                {tab === 'login' ? 'Log In' : 'Sign Up'}
                            </button>
                        );
                    })}
                </div>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#1D1D1F] dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-[#1D1D1F] mb-4 sm:mb-6 mx-auto shadow-lg"><Lock size={24} className="sm:w-7 sm:h-7" /></div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h1>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-2">{isLoginMode ? 'Enter your details to access the dashboard.' : 'Register to deploy the VisionPro engine.'}</p>
                </div>
                
                <form onSubmit={handleAuth} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" disabled={isAuthenticating} className="w-full bg-white/80 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-2xl px-5 py-3.5 sm:py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#1D1D1F] dark:focus:ring-white transition-all shadow-sm" required />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (Min 6 chars)" disabled={isAuthenticating} minLength={6} className="w-full bg-white/80 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-2xl px-5 py-3.5 sm:py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#1D1D1F] dark:focus:ring-white transition-all shadow-sm" required />
                    
                    <AnimatePresence mode="wait">
                        {authError && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3.5 rounded-2xl text-left overflow-hidden">
                                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5"/>
                                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">{authError}</span>
                            </motion.div>
                        )}
                        {authMessage && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3.5 rounded-2xl text-left overflow-hidden">
                                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"/>
                                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">{authMessage}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <button type="submit" disabled={isAuthenticating} className="w-full py-3.5 sm:py-4 bg-[#1D1D1F] dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-[#1D1D1F] rounded-2xl font-bold text-sm transition-all mt-4 flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                        {isAuthenticating ? <Loader2 className="animate-spin" size={18} /> : <>{isLoginMode ? 'Log In' : 'Sign Up'} <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative z-20 h-screen overflow-hidden">
            <nav className="w-full border-b border-white/40 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-3xl sticky top-0 z-50">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 cursor-pointer" onClick={() => setView('detection')}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1D1D1F] dark:bg-white rounded-lg sm:rounded-xl flex items-center justify-center text-white dark:text-[#1D1D1F] shadow-md">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}><Sparkles size={16} className="sm:w-5 sm:h-5" /></motion.div>
                    </div>
                    <span className="font-bold text-lg sm:text-xl tracking-tight hidden sm:block">VisionPro</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-6 w-full justify-end sm:w-auto">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/10 shadow-sm hover:scale-105 transition-transform">
                        {isDarkMode ? <Moon size={16} className="sm:w-[18px]" /> : <Sun size={16} className="sm:w-[18px]" />}
                    </button>
                    
                    <div className="flex bg-white/40 dark:bg-white/5 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-white/50 dark:border-white/10 relative shadow-inner overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
                        {['detection', 'dashboard', 'account'].map((tab) => (
                            <button key={tab} onClick={() => setView(tab)} className={`shrink-0 relative z-10 w-20 sm:w-24 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold capitalize transition-colors ${view === tab ? 'text-white dark:text-[#1D1D1F]' : 'text-slate-500 hover:text-[#1D1D1F] dark:hover:text-white'}`}>
                                {view === tab && <motion.div layoutId="nav-slider" className="absolute inset-0 bg-[#1D1D1F] dark:bg-white rounded-md sm:rounded-lg -z-10 shadow-md" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
                                {tab === 'detection' ? 'Workspace' : tab === 'dashboard' ? 'Datasets' : 'Profile'}
                            </button>
                        ))}
                    </div>
                </div>
                </div>
            </nav>

            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full flex-1 flex flex-col overflow-y-auto overflow-x-hidden sm:overflow-hidden">
                <AnimatePresence mode="wait">
                
                {view === 'detection' && (
                <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 flex-1 h-full min-h-max pb-20 sm:pb-0">
                    
                    <div className="xl:col-span-3 flex flex-col gap-4 sm:gap-6 h-auto sm:h-full shrink-0">
                        <Tilt {...tiltSettings} className="h-full">
                            <TrackedPanel isDarkMode={isDarkMode} className="bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                                
                                <h3 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><ImageIcon size={14}/> Parameters</h3>
                                
                                <div className="flex bg-white/60 dark:bg-black/40 p-1.5 rounded-xl sm:rounded-2xl border border-white/60 dark:border-white/10 mb-6 sm:mb-8 relative shadow-inner">
                                    {['image', 'video'].map((m) => {
                                        const isActive = mode === m || (mode === 'live' && m === 'image');
                                        return (
                                            <button key={m} onClick={() => handleModeChange(m)} className={`relative z-10 flex-1 py-2 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-lg sm:rounded-xl transition-colors ${isActive ? 'text-white dark:text-[#1D1D1F]' : 'text-slate-500 hover:text-[#1D1D1F] dark:hover:text-white'}`}>
                                                {isActive && <motion.div layoutId="mode-slider" className="absolute inset-0 bg-[#1D1D1F] dark:bg-white rounded-lg sm:rounded-xl -z-10 shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
                                                {m === 'image' ? 'Static' : 'Stream'}
                                            </button>
                                        )
                                    })}
                                </div>

                                <h3 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Camera size={14}/> Live Devices</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 mb-6 sm:mb-8 relative z-20">
                                    <button 
                                        onClick={isCameraActive ? stopCamera : startCamera} 
                                        className={`flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-all border ${mode === 'live' && isCameraActive ? 'bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F] border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.12)]' : 'bg-white/80 dark:bg-white/5 border-white/60 dark:border-white/10 text-[#1D1D1F] dark:text-white shadow-sm hover:scale-[1.02]'}`}>
                                        <Monitor size={16} className="sm:w-[18px]" /> <span className="hidden sm:inline">{isCameraActive ? 'Stop PC Cam' : 'Start PC Cam'}</span><span className="sm:hidden">{isCameraActive ? 'Stop PC' : 'PC Cam'}</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => isRemoteActive ? setIsRemoteActive(false) : setShowQRModal(true)} 
                                        className={`flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-all border ${isRemoteActive ? 'bg-indigo-600 text-white border-transparent shadow-md' : 'bg-white/80 dark:bg-white/5 border-white/60 dark:border-white/10 text-[#1D1D1F] dark:text-white shadow-sm hover:scale-[1.02]'}`}>
                                        <Smartphone size={16} className="sm:w-[18px]" /> <span className="hidden sm:inline">{isRemoteActive ? 'Disconnect Phone' : 'Pair Phone'}</span><span className="sm:hidden">{isRemoteActive ? 'Unpair' : 'Pair'}</span>
                                    </button>
                                </div>
                                
                                <div className="mt-auto">
                                    {mode === 'live' && !isRemoteActive ? (
                                        <button onClick={toggleLiveInference} disabled={!isCameraActive} className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all ${isCameraActive ? (status === 'processing' ? 'bg-slate-700 dark:bg-white/20 text-white hover:bg-slate-800' : 'bg-[#1D1D1F] dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-[#1D1D1F] active:scale-95') : 'bg-white/50 dark:bg-white/5 text-slate-400 cursor-not-allowed'}`}>
                                            {status === 'processing' ? 'Stop Analysis' : 'Start Analysis'}
                                        </button>
                                    ) : (
                                        <button onClick={handleUpload} disabled={(!file && !isRemoteActive) || status === 'processing'} className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all ${file || isRemoteActive ? 'bg-[#1D1D1F] dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-[#1D1D1F] active:scale-95' : 'bg-white/50 dark:bg-white/5 text-slate-400 cursor-not-allowed'}`}>
                                            {status === 'processing' ? 'Analyzing...' : isRemoteActive ? 'Remote Live' : 'Execute Task'}
                                        </button>
                                    )}
                                </div>
                            </TrackedPanel>
                        </Tilt>
                    </div>

                    <div className="xl:col-span-6 flex flex-col gap-4 sm:gap-6 h-[400px] sm:h-full sm:min-h-[500px]">
                        <TrackedPanel isDarkMode={isDarkMode} className="flex-1 bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative">
                            {mode === 'live' ? (
                                <div className="flex-1 w-full h-full bg-[#1D1D1F] dark:bg-black rounded-[1.2rem] sm:rounded-[1.5rem] relative overflow-hidden flex items-center justify-center shadow-inner">
                                    <canvas ref={canvasRef} className="hidden" />
                                    
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        playsInline 
                                        muted 
                                        className="absolute inset-0 w-full h-full object-cover z-0" 
                                    />
                                    
                                    {!isCameraActive && !isRemoteActive && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1D1D1F] dark:bg-black">
                                            <Camera size={40} className="mx-auto mb-3 sm:mb-4 text-white/30 sm:w-12 sm:h-12" strokeWidth={1.5} />
                                            <p className="text-xs sm:text-sm font-bold tracking-widest text-white/80 uppercase text-red-400">Hardware Disconnected</p>
                                        </div>
                                    )}

                                    {resultImage && (status === 'processing' || isRemoteActive) && <img src={resultImage} className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none" />}
                                    
                                    {isCameraActive && status === 'processing' && !isRemoteActive && (
                                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-2 bg-emerald-600/90 backdrop-blur-md text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg border border-emerald-400">
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                                            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">LIVE INFERENCE</span>
                                        </div>
                                    )}
                                    {isRemoteActive && (
                                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-2 bg-indigo-600/90 backdrop-blur-md text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg border border-indigo-400">
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                                            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">REMOTE NODE</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                !originalPreview ? (
                                    <div onClick={() => document.getElementById('fileInput').click()} className="flex-1 w-full h-full rounded-[1.2rem] sm:rounded-[1.5rem] border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/60 dark:hover:bg-white/5 transition-all">
                                        <input id="fileInput" type="file" accept={mode === 'image' ? "image/*" : "video/*"} hidden onChange={(e) => handleFileSelect(e.target.files[0])} />
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-white/5 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-white/50 dark:border-white/10"><UploadCloud size={28} className="text-[#1D1D1F] dark:text-white sm:w-8 sm:h-8" strokeWidth={1.5} /></div>
                                        <p className="font-bold text-base sm:text-lg text-[#1D1D1F] dark:text-white">Drop {mode === 'image' ? 'Image' : 'Video'} Here</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 w-full h-full rounded-[1.2rem] sm:rounded-[1.5rem] relative overflow-hidden shadow-inner bg-slate-100 dark:bg-black/40 flex items-center justify-center">
                                        {mode === 'image' ? <img src={resultImage || originalPreview} className="max-w-full max-h-full object-contain rounded-[1.2rem] sm:rounded-[1.5rem]" /> : <video src={resultVideo || originalPreview} controls className="max-w-full max-h-full object-contain rounded-[1.2rem] sm:rounded-[1.5rem]" />}
                                    </div>
                                )
                            )}
                        </TrackedPanel>
                        
                        <AnimatePresence>
                        {(metrics || resultVideo || resultImage) && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                                <Tilt {...tiltSettings}>
                                    <div className="bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden gap-4 sm:gap-0">
                                        <div className="flex items-center gap-4 sm:gap-6 w-full overflow-hidden">
                                            <div className="shrink-0"><p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Latency</p><p className="text-xl sm:text-3xl font-black tracking-tight text-[#1D1D1F] dark:text-white">{metrics?.latency || 0}<span className="text-xs sm:text-sm font-semibold text-slate-400 ml-1 tracking-normal">ms</span></p></div>
                                            <div className="w-px h-8 sm:h-10 bg-slate-300 dark:bg-white/10 shrink-0"></div>
                                            
                                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 flex-1 mask-edges min-w-0">
                                                {Object.entries(metrics?.detections || {}).map(([item, count]) => (
                                                    <div key={item} className="bg-white dark:bg-white/5 border border-white/50 dark:border-white/10 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 shadow-sm shrink-0">
                                                        <span className="font-bold text-[10px] sm:text-[11px] capitalize text-[#1D1D1F] dark:text-white whitespace-nowrap">{item.replace('_', ' ')}</span>
                                                        <span className="bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] px-1.5 py-0.5 sm:px-2 rounded-lg text-[9px] sm:text-[10px] font-black">{count}</span>
                                                    </div>
                                                ))}
                                                {Object.keys(metrics?.detections || {}).length === 0 && <span className="text-xs text-slate-400 font-medium whitespace-nowrap">No objects detected</span>}
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 sm:gap-3 sm:pl-6 sm:border-l border-slate-300 dark:border-white/10 shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                                            <button onClick={handleDownload} title="Download Media" className="p-2.5 sm:p-3 bg-white/80 dark:bg-white/10 border border-white/50 dark:border-white/10 text-[#1D1D1F] dark:text-white rounded-full hover:bg-[#1D1D1F] hover:text-white dark:hover:bg-white dark:hover:text-[#1D1D1F] transition-all shadow-sm">
                                                <Download size={16} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                                            </button>
                                            <button onClick={handleRefreshClick} title="Refresh Workspace" className="p-2.5 sm:p-3 bg-white/80 dark:bg-white/10 border border-white/50 dark:border-white/10 text-[#1D1D1F] dark:text-white rounded-full hover:bg-[#1D1D1F] hover:text-white dark:hover:bg-white dark:hover:text-[#1D1D1F] transition-all shadow-sm">
                                                <RefreshCw size={16} className={`sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                </Tilt>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>

                    <div className="xl:col-span-3 flex flex-col h-[300px] sm:h-full">
                        <Tilt {...tiltSettings} className="h-full">
                            <TrackedPanel isDarkMode={isDarkMode} className="bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                                <h3 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2"><Server size={14}/> Telemetry Logs</h3>
                                <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 no-scrollbar relative z-20">
                                    {systemLogs.map((log) => (
                                        <div key={log.id} className="p-2.5 sm:p-3 bg-white/80 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-xl sm:rounded-2xl shadow-sm"><span className="text-[8px] sm:text-[9px] font-black block mb-0.5 sm:mb-1 text-[#1D1D1F] dark:text-white opacity-50">{log.time}</span><span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-zinc-200">{log.msg}</span></div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            </TrackedPanel>
                        </Tilt>
                    </div>
                </motion.div>
                )}

                {view === 'dashboard' && (
                <motion.div key="datasets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full flex-1 flex flex-col pb-20 sm:pb-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 px-2 sm:px-4 gap-4 sm:gap-0">
                        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">Analytics Hub</h3>
                        <button onClick={async () => { if(window.confirm('Erase all history?')) { await supabase.from('detection_history').delete().neq('id', 0); setHistory([]); } }} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/10 text-red-600 shadow-sm hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} className="sm:w-4 sm:h-4" strokeWidth={2}/> Clear Registry</button>
                    </div>
                    <Tilt {...tiltSettings} className="flex-1">
                        <TrackedPanel isDarkMode={isDarkMode} className="bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden flex-1 shadow-[0_8px_30px_rgb(0,0,0,0.06)]" contentClassName="w-full h-full relative z-20">
                        {history.length > 0 ? (
                            <div className="w-full h-full overflow-x-auto no-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead className="border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-black/20 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                        <tr>
                                            <th className="px-6 sm:px-10 py-4 sm:py-6 whitespace-nowrap">Output</th>
                                            <th className="px-6 sm:px-10 py-4 sm:py-6 whitespace-nowrap">Source File</th>
                                            <th className="px-6 sm:px-10 py-4 sm:py-6 whitespace-nowrap">Latency</th>
                                            <th className="px-6 sm:px-10 py-4 sm:py-6 whitespace-nowrap">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/60 dark:divide-white/10">
                                        {history.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 sm:px-10 py-4 sm:py-5">
                                                {item.preview.startsWith('data:image') 
                                                    ? <img src={item.preview} className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-xl sm:rounded-2xl border border-white/50 dark:border-white/10 shadow-sm" />
                                                    : <video src={item.preview} className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-xl sm:rounded-2xl border border-white/50 dark:border-white/10 shadow-sm" />
                                                }
                                            </td>
                                            <td className="px-6 sm:px-10 py-4 sm:py-5 text-xs sm:text-sm font-bold tracking-tight truncate max-w-[150px] sm:max-w-xs">{item.fileName}</td>
                                            <td className="px-6 sm:px-10 py-4 sm:py-5"><span className="bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs shadow-sm">{item.latency}ms</span></td>
                                            <td className="px-6 sm:px-10 py-4 sm:py-5 text-[10px] sm:text-xs font-bold text-slate-500 whitespace-nowrap">{item.date} - {item.time}</td>
                                        </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                <Database size={48} className="sm:w-16 sm:h-16 mb-4 sm:mb-6 opacity-40" strokeWidth={1.5} />
                                <p className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-zinc-400 text-center">No records found</p>
                            </div>
                        )}
                        </TrackedPanel>
                    </Tilt>
                </motion.div>
                )}
                
                {view === 'account' && (
                <motion.div key="account" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl mx-auto flex-1 flex flex-col pt-6 sm:pt-10 px-2 sm:px-0">
                    <Tilt {...tiltSettings} className="w-full">
                        <TrackedPanel isDarkMode={isDarkMode} className="bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm p-6 sm:p-10">
                            <div className="flex flex-col items-center text-center mb-8 sm:mb-10 pb-8 sm:pb-10 border-b border-white/50 dark:border-white/10 relative z-20">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#1D1D1F] dark:bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden flex items-center justify-center text-white dark:text-[#1D1D1F] mb-4 sm:mb-6 shadow-xl">
                                    {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User size={32} className="sm:w-10 sm:h-10" strokeWidth={1.5} />}
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">Operator Profile</h2>
                                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">{session?.user?.email}</p>
                            </div>
                            <div className="space-y-4 relative z-20">
                                <div className="bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur-xl rounded-[1.2rem] sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-all gap-4 sm:gap-0">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white dark:bg-white/10 border border-white/50 dark:border-white/5 flex items-center justify-center text-[#1D1D1F] dark:text-white shadow-sm shrink-0"><LogOut size={16} className="sm:w-[18px]" /></div>
                                        <div><p className="text-xs sm:text-sm font-bold">System Session</p><p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Securely uncouple from the mainframe.</p></div>
                                    </div>
                                    <button onClick={handleSignOut} className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-white/60 dark:bg-white/10 hover:bg-[#1D1D1F] dark:hover:bg-white hover:text-white dark:hover:text-[#1D1D1F] rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-sm">Sign Out</button>
                                </div>
                            </div>
                        </TrackedPanel>
                    </Tilt>
                </motion.div>
                )}
                </AnimatePresence>
            </main>
        </div>
      )}
    </div>
  );
}

export default App;