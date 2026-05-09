import React, { useState, useRef, useEffect } from 'react';
import { useTripStore } from '../store/tripStore';
import { useDocumentStore } from '../store/documentStore';
import { FileText, Upload, Trash2, ShieldCheck, Search, Download, Eye, FilePlus, ChevronDown, Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentVault() {
  const { activeTrip } = useTripStore();
  const { documents, uploadDocument, deleteDocument, updateDocument, fetchDocuments } = useDocumentStore();
  
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Identity');
  const fileInputRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '' });

  const categories = ['All', 'Identity', 'Bookings', 'Tickets', 'Health'];
  const uploadOptions = ['Identity', 'Bookings', 'Tickets', 'Health'];

  // Load documents when active trip changes
  useEffect(() => {
    if (activeTrip?.id) {
      fetchDocuments(activeTrip.id);
    }
  }, [activeTrip?.id, fetchDocuments]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!activeTrip?.id) {
      toast.error("No active mission selected. Please initialize a trip first.");
      e.target.value = null;
      return;
    }

    // --- 🚨 5MB LIMIT LOGIC 🚨 ---
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`SECURITY ALERT: File size exceeds the ${MAX_SIZE_MB}MB limit.`);
      e.target.value = null;
      return;
    }

    // Loading indicator on
    const toastId = toast.loading('Encrypting and uploading to Vault...');
    
    // Store function call
    const result = await uploadDocument(activeTrip.id, file, uploadCategory);
    
    // Check real success status
    if (result.success) {
      toast.success('Document safely encrypted in Vault!', { id: toastId });
    } else {
      // Store pehle hi error toast de chuka hai, isliye loading ko dismiss karein
      toast.dismiss(toastId); 
    }

    e.target.value = null;
  };

  const startEditing = (doc) => {
    setEditingId(doc.id);
    setEditForm({ name: doc.name, category: doc.category });
  };

  const handleSaveEdit = async (id) => {
    await updateDocument(id, editForm);
    toast.success("Document metadata updated.");
    setEditingId(null);
  };

  const handleDelete = async (id, storagePath) => {
    const toastId = toast.loading("Purging document from Vault...");
    
    // Ye line aapke documentStore.js ko call karti hai
    const result = await deleteDocument(id, storagePath);
    
    if (result.success) {
      toast.success("Document permanently deleted.", { id: toastId });
    } else {
      toast.error("Failed to delete from storage.", { id: toastId });
    }
};

  const handleView = (doc) => {
    if (!doc.url) return;
    try {
      if (doc.url.startsWith('data:')) {
        const parts = doc.url.split(';');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1].split(',')[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        window.open(doc.url, '_blank');
      }
    } catch (e) {
      const newWindow = window.open();
      newWindow.document.write(`<img src="${doc.url}" style="max-width:100%" />`);
    }
  };

  const handleDownload = async (doc) => {
    if (doc.url) {
      try {
        toast.loading("Initiating secure download...", { id: 'download' });
        const response = await fetch(doc.url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        toast.success("Download complete.", { id: 'download' });
      } catch (error) {
        console.error("Download failed:", error);
        window.open(doc.url, '_blank');
        toast.dismiss('download');
      }
    }
  };

  const filteredDocs = documents?.filter(doc => {
    const matchesFilter = filter === 'All' || doc.category === filter;
    const matchesSearch = doc.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-l-4 border-blue-600 pl-8">
        <div>
          <h1 className="text-6xl font-black text-blue-600 italic uppercase tracking-tighter leading-none">Secure Vault</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">Encrypted Travel Documentation</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-full border border-green-700">
          <ShieldCheck size={16} className="text-green-400" />
          <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">AES-256 Protected</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign Category</label>
              <div className="relative">
                <select 
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold text-xs outline-none focus:border-blue-500 appearance-none cursor-pointer uppercase transition-all shadow-inner"
                >
                  {uploadOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <button onClick={() => fileInputRef.current.click()} className="w-full h-48 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 hover:bg-blue-600/5 hover:border-blue-500/50 transition-all group">
              <div className="p-4 bg-slate-950 rounded-2xl group-hover:scale-110 transition-transform shadow-xl ring-1 ring-slate-800">
                <Upload className="text-blue-500" size={24} />
              </div>
              <div className="text-center">
                <span className="block text-[10px] font-black text-slate-800 uppercase tracking-widest">Authorize Upload</span>
                <span className="text-[9px] text-slate-600 uppercase font-bold mt-1">Ready for {uploadCategory}</span>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input type="text" placeholder="SEARCH VAULT..." className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] py-5 pl-14 pr-6 text-[10px] font-black text-white outline-none focus:border-blue-500 transition-all uppercase tracking-[0.2em] placeholder:text-slate-700 shadow-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className={`shrink-0 px-8 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest border ${filter === cat ? "bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-900/30" : "bg-slate-950/40 text-slate-500 border-slate-900 hover:text-slate-300 hover:border-slate-800"}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <div key={doc.id} className="group flex items-center gap-6 p-6 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] hover:bg-slate-900/60 transition-all duration-300">
                  <div className="p-4 bg-slate-950 rounded-2xl text-blue-500 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === doc.id ? (
                      <div className="space-y-2">
                        <input className="bg-slate-900 border-b-2 border-blue-500 text-white font-bold italic w-full outline-none py-1" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                        <select className="bg-slate-900 text-blue-400 text-[9px] font-black uppercase outline-none" value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})}>
                          {uploadOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-white font-bold text-lg italic tracking-tight truncate uppercase mb-1 leading-none">{doc.name}</h3>
                        <div className="flex gap-4 items-center">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{doc.size}</span>
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-600/10 px-2 py-0.5 rounded-md">{doc.category}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    {editingId === doc.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(doc.id)} className="p-3 text-emerald-500 hover:scale-110 transition-all"><Save size={18} /></button>
                        <button onClick={() => setEditingId(null)} className="p-3 text-slate-500"><X size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleView(doc)} className="p-3 bg-slate-950 text-slate-400 hover:text-blue-400 rounded-xl transition-all"><Eye size={18} /></button>
                        <button onClick={() => handleDownload(doc)} className="p-3 bg-slate-950 text-slate-400 hover:text-emerald-400 rounded-xl transition-all"><Download size={18} /></button>
                        <button onClick={() => startEditing(doc)} className="p-3 bg-slate-950 text-slate-400 hover:text-blue-500 rounded-xl transition-all"><Edit3 size={18} /></button>
                        <button onClick={() => handleDelete(doc.id, doc.storage_path)} className="p-3 bg-slate-950 text-slate-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-[365px] border-2 border-dashed border-slate-900 rounded-[3rem] bg-slate-900/10 transition-all">
                <FilePlus size={40} className="text-slate-800 mb-4" />
                <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.4em]">Vault clear of documentation</p>
                <div className="mt-2 px-3 py-1 bg-slate-900 rounded text-[8px] font-black text-slate-700 uppercase tracking-widest border border-slate-800">Category: {filter}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}