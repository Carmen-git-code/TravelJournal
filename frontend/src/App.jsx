import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home, Briefcase, Map as MapIcon, BookOpen, Image as ImageIcon, 
  Heart, BarChart2, Settings, Search, Plus, MapPin, Calendar, 
  X, LogIn, ChevronDown, PenSquare, Globe, Navigation
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// --- MOCK INITIAL DATA ---
const INITIAL_ENTRIES = [
  {
    id: 1,
    title: "Amalfi Coast, Italy",
    location: "Amalfi Coast",
    startDate: "2024-05-12",
    endDate: "2024-05-21",
    note: "Woke up to the sound of waves and enjoyed the best espresso with a view. The drive along the coast was breathtaking.",
    photoUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    coords: [40.6333, 14.6029]
  },
  {
    id: 2,
    title: "Kyoto, Japan",
    location: "Kyoto",
    startDate: "2024-03-18",
    endDate: "2024-03-28",
    note: "Thousands of torii gates stretching as far as the eye can see. The cherry blossoms were at their peak.",
    photoUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    coords: [35.0116, 135.7681]
  },
  {
    id: 3,
    title: "Banff, Canada",
    location: "Banff",
    startDate: "2024-02-02",
    endDate: "2024-02-09",
    note: "The hike was challenging but the view at the top was absolutely worth it. Lake Louise was completely frozen.",
    photoUrl: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    coords: [51.1784, -115.5708]
  },
  {
    id: 4,
    title: "Santorini, Greece",
    location: "Santorini",
    startDate: "2023-09-10",
    endDate: "2023-09-17",
    note: "The sunsets in Oia are unmatched. Enjoyed amazing seafood and explored the volcanic beaches.",
    photoUrl: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    coords: [36.3932, 25.4615]
  }
];

// --- RANDOM FALLBACK PHOTOS ---
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1488085061387-422e29b40080?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
];

export default function App() {
  // --- STATE MANAGEMENT ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginType, setLoginType] = useState(null); 
  const [authError, setAuthError] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // --- NAVIGATION STATE ---
  const [currentView, setCurrentView] = useState('home');

  // --- MAP CONFIGURATION EFFECT ---
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });

    return () => document.head.removeChild(link);
  }, []);

  // --- AUTHENTICATION ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'resume' || passwordInput === 'blog') {
      setLoginType(passwordInput);
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid access password. Please try again.");
    }
  };

  // --- CRUD OPERATIONS ---
  const handleSaveEntry = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const locationStr = formData.get('location');
    
    // Unsplash Fallback - Pick a random photo from the array every single time
    let photoUrl = formData.get('photoUrl');
    if (!photoUrl) {
      const randomIndex = Math.floor(Math.random() * FALLBACK_PHOTOS.length);
      photoUrl = FALLBACK_PHOTOS[randomIndex];
    }

    const mockLat = (Math.random() * 80 - 40).toFixed(4);
    const mockLng = (Math.random() * 180 - 90).toFixed(4);

    const newEntry = {
      id: editingEntry?.id || Date.now(),
      title: formData.get('title'),
      location: locationStr,
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      note: formData.get('note'),
      photoUrl: photoUrl,
      coords: editingEntry?.coords || [mockLat, mockLng]
    };

    if (editingEntry) {
      setEntries(entries.map(ent => ent.id === editingEntry.id ? newEntry : ent));
    } else {
      setEntries([newEntry, ...entries]);
    }
    
    closeModal();
  };

  const handleDelete = (id) => {
    setEntries(entries.filter(ent => ent.id !== id));
    closeModal();
  };

  const openModal = (entry = null) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingEntry(null);
    setIsModalOpen(false);
  };

  // --- SEARCH & FILTERING ---
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.note.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

  const heroEntry = filteredEntries[0]; 
  const recentEntries = filteredEntries.slice(1, 5); 

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapIcon size={32} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">Travel Journal</h1>
          <p className="text-slate-500 mb-8">Please enter your access password to view this portfolio project.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password: " 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {authError && <p className="text-red-500 text-sm mt-2">{authError}</p>}
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Access Journal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 p-6 z-20">
        <div className="flex items-center gap-3 mb-10 text-blue-600">
          <MapIcon size={28} className="fill-blue-100" />
          <span className="text-xl font-serif font-bold text-slate-800">Travel Journal</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<Home size={20} />} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
          <NavItem icon={<Briefcase size={20} />} label="Trips" active={currentView === 'trips'} onClick={() => setCurrentView('trips')} />
          <NavItem icon={<MapIcon size={20} />} label="Map" active={currentView === 'map'} onClick={() => setCurrentView('map')} />
          <NavItem icon={<BookOpen size={20} />} label="Journal" active={currentView === 'journal'} onClick={() => setCurrentView('journal')} />
          <NavItem icon={<ImageIcon size={20} />} label="Photos" active={currentView === 'photos'} onClick={() => setCurrentView('photos')} />
          <NavItem icon={<Heart size={20} />} label="Bucket List" active={currentView === 'bucketlist'} onClick={() => setCurrentView('bucketlist')} />
          
          <div className="pt-6 pb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analytics</p>
          </div>
          <NavItem icon={<BarChart2 size={20} />} label="Statistics" active={currentView === 'stats'} onClick={() => setCurrentView('stats')} />
          <NavItem icon={<Settings size={20} />} label="Settings" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
        </nav>

        <div className="mt-auto">
          <div className="flex items-center gap-3 mb-6 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
            <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Alex Morgan" className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Alex Morgan</p>
              <p className="text-xs text-slate-500">Via: {loginType}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-sm italic text-slate-600 mb-2">"The world is a book and those who do not travel read only one page."</p>
            <p className="text-xs text-slate-400 font-medium">- Saint Augustine</p>
          </div>
        </div>
      </aside>

      {/* CENTER CONTENT */}
      <main className="flex-1 px-4 md:px-8 py-8 overflow-y-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif text-slate-800">
              {currentView === 'home' && "Good morning, Alex!"}
              {currentView === 'trips' && "All Your Trips"}
              {currentView === 'map' && "Interactive Map"}
              {currentView === 'journal' && "Journal Entries"}
              {currentView === 'photos' && "Photo Gallery"}
              {currentView === 'bucketlist' && "Your Bucket List"}
              {currentView === 'stats' && "Travel Statistics"}
              {currentView === 'settings' && "Account Settings"}
            </h1>
            <p className="text-slate-500 mt-1">
              {currentView === 'home' ? "Where will your next adventure be?" : `Viewing your ${currentView} dashboard`}
            </p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-4 z-20">
            <div className="relative w-full md:w-64">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search entries..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
              />
            </div>
            <button 
              onClick={() => openModal()}
              className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap shadow-sm shadow-blue-200"
            >
              <Plus size={18} /> New Entry
            </button>
          </div>
        </header>

        {/* --- VIEW: HOME DASHBOARD --- */}
        {currentView === 'home' && (
          <div className="animate-in fade-in duration-300">
            {heroEntry ? (
              <div 
                className="relative h-80 rounded-3xl overflow-hidden mb-10 shadow-lg group cursor-pointer"
                onClick={() => openModal(heroEntry)}
              >
                <img src={heroEntry.photoUrl} alt={heroEntry.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium mb-3 uppercase tracking-wider">
                    Last Trip
                  </span>
                  <h2 className="text-4xl font-serif text-white mb-2">{heroEntry.title}</h2>
                  <div className="flex justify-between items-end">
                    <p className="text-slate-200 flex items-center gap-2">
                      <Calendar size={16} /> {formatDate(heroEntry.startDate)} - {formatDate(heroEntry.endDate)}
                    </p>
                    <button className="bg-white text-slate-900 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-100 transition-colors flex items-center gap-2">
                      View Trip <PenSquare size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-80 rounded-3xl bg-slate-200 mb-10 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-300">
                <ImageIcon size={48} className="mb-4 opacity-50" />
                <p>No trips match your search.</p>
              </div>
            )}

            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-semibold text-slate-800">My Trips</h3>
              <button onClick={() => setCurrentView('trips')} className="text-blue-600 text-sm font-medium hover:underline">View all trips &rsaquo;</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {recentEntries.map(entry => (
                <div 
                  key={entry.id} 
                  onClick={() => openModal(entry)}
                  className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all"
                >
                  <img src={entry.photoUrl} alt={entry.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  
                  <div className="absolute top-3 right-3 w-8 h-8 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <PenSquare size={16} />
                  </div>

                  <div className="absolute bottom-0 left-0 p-4 w-full text-white">
                    <h4 className="font-semibold text-lg leading-tight mb-1">{entry.title}</h4>
                    <p className="text-xs text-slate-300 mb-2">{formatDate(entry.startDate)} - {formatDate(entry.endDate)}</p>
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-200">
                      <BookOpen size={12} /> {Math.floor(Math.random() * 8) + 2} Entries
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <BookOpen size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-1">Capture every moment of your journey</h4>
                  <p className="text-sm text-slate-500">Write, upload photos, and preserve your memories for a lifetime.</p>
                </div>
              </div>
              <button 
                onClick={() => openModal()}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2 shrink-0"
              >
                <Plus size={18} /> New Journal Entry
              </button>
            </div>
          </div>
        )}

        {/* --- VIEW: REAL INTERACTIVE MAP --- */}
        {currentView === 'map' && (
          <div className="animate-in fade-in duration-300 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[70vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 z-10 relative">
               <div>
                 <h3 className="text-lg font-bold text-slate-800">Your Global Footprint</h3>
                 <p className="text-sm text-slate-500">{entries.length} locations explored</p>
               </div>
               <Globe className="text-blue-500 opacity-50" size={32} />
            </div>
            <div className="flex-1 relative z-0">
              {/* REAL Leaflet Map Integration */}
              <MapContainer 
                center={[30, 0]} 
                zoom={2} 
                scrollWheelZoom={true} 
                className="w-full h-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredEntries.map(entry => (
                  <Marker key={entry.id} position={entry.coords}>
                    <Popup className="rounded-xl">
                      <div className="text-center p-1">
                        <img src={entry.photoUrl} alt={entry.title} className="w-full h-20 object-cover rounded-md mb-2" />
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{entry.title}</h4>
                        <button 
                          onClick={() => openModal(entry)}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-md w-full font-medium hover:bg-blue-100 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}

        {/* --- VIEW: ALL TRIPS --- */}
        {currentView === 'trips' && (
           <div className="animate-in fade-in duration-300 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntries.map(entry => (
                 <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => openModal(entry)}>
                   <div className="h-48 relative">
                     <img src={entry.photoUrl} className="w-full h-full object-cover" alt={entry.title} />
                     <div className="absolute top-3 right-3 bg-white/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-slate-700">
                       {formatDate(entry.startDate)}
                     </div>
                   </div>
                   <div className="p-5">
                     <h3 className="font-bold text-lg text-slate-800 mb-1">{entry.title}</h3>
                     <p className="text-slate-500 text-sm flex items-center gap-1 mb-3"><MapPin size={14}/> {entry.location}</p>
                     <p className="text-slate-600 text-sm line-clamp-2">{entry.note}</p>
                   </div>
                 </div>
              ))}
           </div>
        )}

        {/* --- VIEW: JOURNAL ENTRIES --- */}
        {currentView === 'journal' && (
          <div className="animate-in fade-in duration-300 space-y-4 max-w-3xl mx-auto">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openModal(entry)}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-serif font-bold text-xl text-slate-800">{entry.title}</h3>
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
                    {formatDate(entry.startDate)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-blue-600 font-medium mb-4">
                  <Navigation size={14} className="mr-1" /> {entry.location}
                </div>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                  "{entry.note}"
                </p>
              </div>
            ))}
          </div>
        )}

        {/* --- VIEW: PHOTO GALLERY --- */}
        {currentView === 'photos' && (
          <div className="animate-in fade-in duration-300 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="relative h-48 md:h-64 rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-shadow" onClick={() => openModal(entry)}>
                <img src={entry.photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={entry.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 p-4 w-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                  <h4 className="font-bold text-sm truncate">{entry.title}</h4>
                  <p className="text-xs text-slate-300 flex items-center gap-1 mt-1"><MapPin size={12} /> {entry.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- VIEW: UNDER CONSTRUCTION (Bucket List, Stats, Settings) --- */}
        {['bucketlist', 'stats', 'settings'].includes(currentView) && (
           <div className="animate-in fade-in duration-300 bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Settings size={40} className="animate-spin-slow" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">View Under Construction</h3>
              <p className="text-slate-500 max-w-md mx-auto">You navigated to the {currentView} route! As a Cloud Engineer, building out this UI feature is the next logical step.</p>
           </div>
        )}

      </main>

      {/* RIGHT SIDEBAR (Hidden on map view for wider space) */}
      {currentView !== 'map' && (
        <aside className="hidden xl:block w-80 bg-white border-l border-slate-100 p-6 overflow-y-auto">
          <h3 className="font-semibold text-slate-800 mb-6">Your Journey in Numbers</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-10">
            <StatCard icon={<Briefcase size={20} className="text-blue-500" />} bg="bg-blue-50" value={entries.length} label="Trips" />
            <StatCard icon={<BookOpen size={20} className="text-rose-500" />} bg="bg-rose-50" value={entries.length * 5 + 12} label="Journal Entries" />
            <StatCard icon={<MapPin size={20} className="text-amber-500" />} bg="bg-amber-50" value={entries.length} label="Places Visited" />
            <StatCard icon={<ImageIcon size={20} className="text-emerald-500" />} bg="bg-emerald-50" value="12k" label="Photos Taken" />
          </div>

          <div className="flex justify-between items-end mb-4">
            <h3 className="font-semibold text-slate-800">Places Visited</h3>
            <button onClick={() => setCurrentView('map')} className="text-slate-400 text-xs font-medium hover:text-blue-600 transition-colors">Open map view &rsaquo;</button>
          </div>
          
          <div className="flex justify-between items-end mb-4 mt-10">
            <h3 className="font-semibold text-slate-800">Recent Entries</h3>
            <button onClick={() => setCurrentView('trips')} className="text-slate-400 text-xs font-medium hover:text-blue-600 transition-colors">View all</button>
          </div>
          <div className="space-y-4">
            {entries.slice(0,4).map(entry => (
              <div key={entry.id} className="flex gap-3 group cursor-pointer" onClick={() => openModal(entry)}>
                <img src={entry.photoUrl} alt={entry.title} className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm" />
                <div>
                  <h5 className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{entry.title}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5 mb-1">{formatDate(entry.startDate)} • {entry.location}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{entry.note}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* --- CRUD MODAL OVERLAY --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-8 py-5 border-b border-slate-100 flex justify-between items-center z-10">
              <h2 className="text-xl font-serif font-bold text-slate-800">
                {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEntry} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  name="title" 
                  defaultValue={editingEntry?.title} 
                  required
                  placeholder="e.g. A perfect day in Positano"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    name="location" 
                    defaultValue={editingEntry?.location} 
                    required
                    placeholder="e.g. Amalfi Coast, Italy"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Photo URL (Optional)</label>
                  <input 
                    type="url" 
                    name="photoUrl" 
                    defaultValue={editingEntry?.photoUrl} 
                    placeholder="Leave blank for random auto-image"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    defaultValue={editingEntry?.startDate} 
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    defaultValue={editingEntry?.endDate} 
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Journal Note</label>
                <textarea 
                  name="note" 
                  defaultValue={editingEntry?.note} 
                  required
                  rows="4"
                  placeholder="Write about your experience..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                {editingEntry ? (
                  <button 
                    type="button" 
                    onClick={() => handleDelete(editingEntry.id)}
                    className="text-red-500 font-medium text-sm hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete Entry
                  </button>
                ) : <div></div>}
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={closeModal}
                    className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- HELPER COMPONENTS ---
function NavItem({ icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}

function StatCard({ icon, bg, value, label }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-center gap-2">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{value}</p>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return '';
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}
