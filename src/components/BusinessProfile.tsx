import { useState, useRef, ChangeEvent, MouseEvent, useEffect } from "react";
import { Camera, Save, X, Trash2, Loader2 } from "lucide-react";
import { useBusiness } from "../contexts/BusinessContext";
import { useReceipts } from "../contexts/ReceiptsContext";

export default function BusinessProfile() {
  const { businessInfo, updateBusinessInfo } = useBusiness();
  const { clearAllData } = useReceipts();
  const [localInfo, setLocalInfo] = useState(businessInfo);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync from context when it updates, but not while we are saving
    if (!isSaving) {
      setLocalInfo(businessInfo);
    }
  }, [businessInfo, isSaving]);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      alert("Please upload a PNG or JPG image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLocalInfo(prev => ({ ...prev, logo: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = (e: MouseEvent) => {
    e.stopPropagation();
    setLocalInfo(prev => ({ ...prev, logo: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBusinessInfo(localInfo);
      alert("Business profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tighter text-primary">Business Profile</h2>
        <p className="text-text-muted font-medium leading-relaxed text-sm">
          Set up your official business details. This information will appear on all receipts you generate.
        </p>
      </div>

      {/* Logo Upload */}
      <div className="relative group">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleLogoUpload}
          accept=".png, .jpg, .jpeg"
          className="hidden"
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center gap-4 bg-bg dark:bg-card hover:border-accent hover:bg-blue-50 dark:hover:bg-accent/10 transition-all cursor-pointer relative overflow-hidden"
        >
          {localInfo.logo ? (
            <div className="relative group/preview">
              <img 
                src={localInfo.logo} 
                alt="Business Logo" 
                className="w-32 h-32 object-contain rounded-lg bg-card p-2 border border-border group-hover:opacity-40 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                 <div className="bg-primary/10 text-primary p-2 rounded-full border border-primary/20">
                   <Camera size={20} />
                 </div>
              </div>
              <button
                onClick={removeLogo}
                className="absolute -top-2 -right-2 bg-error text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover/preview:opacity-100 transition-opacity z-10"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-card rounded-lg shadow-sm border border-border flex items-center justify-center text-text-muted group-hover:text-accent transition-colors">
                <Camera size={32} />
              </div>
              <div className="text-center">
                <p className="font-bold text-accent text-sm">Upload Business Logo</p>
                <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-wider">PNG, JPG up to 2MB</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <InputField 
          label="Business Name" 
          placeholder="e.g. Acme Corporation" 
          value={localInfo.name} 
          onChange={(val: string) => setLocalInfo({...localInfo, name: val})}
        />
        <InputField 
          label="Business Email" 
          placeholder="billing@yourbusiness.com" 
          type="email" 
          value={localInfo.email}
          onChange={(val: string) => setLocalInfo({...localInfo, email: val})}
        />
        <InputField 
          label="Phone Number" 
          placeholder="+1 (555) 000-0000" 
          type="tel" 
          value={localInfo.phone}
          onChange={(val: string) => setLocalInfo({...localInfo, phone: val})}
        />
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Business Address</label>
          <textarea
            rows={4}
            placeholder="Street name, City, State, ZIP"
            value={localInfo.address}
            onChange={(e) => setLocalInfo({...localInfo, address: e.target.value})}
            className="w-full px-5 py-3.5 bg-card border border-border rounded-lg focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none text-text-main placeholder-text-muted text-sm font-medium transition-all"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-accent hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm uppercase tracking-widest disabled:opacity-70"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? "Saving..." : "Save Business Profile"}
        </button>
        <button 
          onClick={clearAllData}
          className="w-full py-2 text-error font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-error/5 rounded transition-colors"
        >
          <Trash2 size={12} className="inline mr-1" />
          Clear All App Data
        </button>
      </div>

      {/* Live Preview Section */}
      <div className="bg-card rounded-xl p-8 space-y-4 border border-border">
        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] text-center">Identity Preview</h4>
        
        <div className="bg-bg rounded-lg p-6 shadow-sm border border-border flex items-center gap-4">
           <div className="w-12 h-12 bg-card rounded flex items-center justify-center text-border overflow-hidden">
              {localInfo.logo ? (
                <img src={localInfo.logo} className="w-full h-full object-contain" alt="Preview logo" referrerPolicy="no-referrer" />
              ) : (
                <Camera size={20} />
              )}
           </div>
           <div>
              <h5 className="font-extrabold text-primary tracking-tight">{localInfo.name || "Business Name"}</h5>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{localInfo.email || "Email Address"}</p>
           </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, placeholder, type = "text", value, onChange }: any) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-5 py-3.5 bg-card border border-border rounded-lg focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none text-text-main placeholder-text-muted text-sm font-medium transition-all"
      />
    </div>
  );
}
