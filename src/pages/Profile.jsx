import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, User, Save, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setDisplayName(u.display_name || u.full_name || "");
      setAvatarUrl(u.avatar_url || "");
      setRole(u.role || "user");
    });
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAvatarUrl(file_url);
    await base44.auth.updateMe({ avatar_url: file_url });
    setUploading(false);
    toast.success("Profile photo updated");
  };

  const JOB_CODES = [
    { value: "user", label: "Kitchen Staff (BOH)" },
    { value: "server", label: "Server" },
    { value: "bartender", label: "Bartender" },
    { value: "host", label: "Host" },
    { value: "busser", label: "Busser" },
    { value: "food_runner", label: "Food Runner" },
  ];

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ display_name: displayName, role });
    setSaving(false);
    toast.success("Profile saved");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">Update your display name and profile photo.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-24 w-24 rounded-2xl object-cover border-2 border-border"
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-secondary border-2 border-border flex items-center justify-center">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <label className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center cursor-pointer">
            {uploading
              ? <Loader2 className="h-5 w-5 text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
              : <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            }
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div>
          <p className="font-semibold">{user.full_name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">Click photo to change</p>
        </div>
      </div>

      {/* Display name */}
      <div className="space-y-2">
        <Label>Display Name</Label>
        <p className="text-xs text-muted-foreground">This name appears on shift assignments and completed tasks.</p>
        <Input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="e.g., Chef Mike, Line 2 - Sarah"
          className="max-w-sm"
        />
      </div>

      {/* Job code */}
      {user.role !== "admin" && (
        <div className="space-y-2">
          <Label>Job Code</Label>
          <p className="text-xs text-muted-foreground">Determines which sections and tasks you see in the app.</p>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {JOB_CODES.map(j => (
                <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving || !displayName.trim()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Changes
      </Button>
    </div>
  );
}