"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { Camera, Trash2, User } from "lucide-react";
import { useSessionContext } from "@/context/SessionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getUserSettings,
  removeUserAvatar,
  updateUserSettings,
  type UserSettingsResponse,
} from "./utils";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type FormState = {
  fullName: string;
  businessName: string;
  email: string;
  bio: string;
  industry: string;
  website: string;
  timezone: string;
};

export default function SettingsPage() {
  const { session, refresh } = useSessionContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialForm = useMemo<FormState>(
    () => ({
      fullName: "",
      businessName: "",
      email: session?.email || "",
      bio: "",
      industry: "",
      website: "",
      timezone: "UTC",
    }),
    [session?.email],
  );

  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const data = await getUserSettings();
        setSettings(data);
        setForm({
          fullName: data.profile.fullName || "",
          businessName: data.business.name || "",
          email: data.profile.email || session?.email || "",
          bio: data.profile.bio || "",
          industry: data.business.industry || "",
          website: data.business.website || "",
          timezone: data.business.timezone || "UTC",
        });
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Unable to load settings",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [session?.email]);

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const avatarSrc = avatarPreviewUrl
    ? avatarPreviewUrl
    : settings?.profile.avatar.url
      ? `${settings.profile.avatar.url}${settings.profile.avatar.version ? `?v=${settings.profile.avatar.version}` : ""}`
      : null;

  async function persistForm(
    overrides?: Parameters<typeof updateUserSettings>[0]["avatar"],
  ) {
    const payload = {
      fullName: form.fullName.trim(),
      businessName: form.businessName.trim(),
      bio: form.bio.trim(),
      industry: form.industry.trim(),
      website: form.website.trim(),
      timezone: form.timezone.trim(),
      avatar: overrides,
    };
    const data = await updateUserSettings(payload);
    setSettings(data);
    await refresh();
    return data;
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const errors: string[] = [];
    if (!form.fullName.trim()) errors.push("Full name is required.");
    if (!form.email.trim()) errors.push("Email is required.");
    if (form.website.trim() && !isValidUrl(form.website.trim())) {
      errors.push("Website must be a valid URL.");
    }
    if (form.bio.length > 300) {
      errors.push("Bio must be 300 characters or fewer.");
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
      return;
    }

    setSaving(true);
    try {
      await persistForm();
      setMessage("Settings saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  const onAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setMessage(null);

    if (!ALLOWED_AVATAR_TYPES.has(file.type.toLowerCase())) {
      setError("Profile photo must be JPG, JPEG, PNG, or WEBP.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError("Profile photo must be 5MB or smaller.");
      return;
    }

    setAvatarUploading(true);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          purpose: "avatar",
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData?.error || "Failed to create upload URL.");
      }
      const { uploadUrl, storageKey } = presignData as {
        uploadUrl: string | null;
        storageKey: string;
      };
      if (!storageKey) {
        throw new Error("Upload key was not returned.");
      }

      if (uploadUrl) {
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadRes.ok) {
          throw new Error("Failed to upload image to storage.");
        }
      }

      const localPreview = URL.createObjectURL(file);
      setAvatarPreviewUrl(localPreview);

      await persistForm({
        storageKey,
        contentType: file.type,
      });
      setMessage("Profile photo updated.");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to upload profile photo.",
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const onRemoveAvatar = async () => {
    setError(null);
    setMessage(null);
    setAvatarRemoving(true);
    try {
      const data = await removeUserAvatar();
      setSettings(data);
      setAvatarPreviewUrl(null);
      await refresh();
      setMessage("Profile photo removed.");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to remove profile photo.",
      );
    } finally {
      setAvatarRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Settings
          </p>
          <h1 className="text-2xl font-semibold text-white">
            Account & Business
          </h1>
          <p className="text-sm text-slate-300">
            Keep your profile and business info up to date.
          </p>
        </div>
        <Button
          variant="ghost"
          className="rounded-full px-4 py-2 text-white/60 hover:text-white"
          onClick={() => {
            setForm(initialForm);
            setMessage(null);
            setError(null);
          }}
        >
          Reset form
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Loading settings...</p>
      ) : null}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}

      <form className="space-y-6" onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <p className="text-xs text-slate-400">
              Your contact details for notifications and support.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-16 w-16 rounded-full border border-slate-700 bg-slate-900 overflow-hidden flex items-center justify-center">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt="Profile photo"
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="h-6 w-6 text-slate-300" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={onAvatarFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading || avatarRemoving}
                  className="rounded-full border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  <Camera className="mr-2.5 h-4 w-4 text-lime-400" />
                  {avatarUploading ? "Uploading..." : "Upload photo"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onRemoveAvatar}
                  disabled={
                    avatarRemoving ||
                    avatarUploading ||
                    (!settings?.profile.avatar.storageKey && !avatarPreviewUrl)
                  }
                  className="rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <Trash2 className="mr-2.5 h-4 w-4" />
                  {avatarRemoving ? "Removing..." : "Remove photo"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Allowed: JPG, PNG, WEBP. Max file size: 5MB.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  placeholder="Alex Founder"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  readOnly
                  className="bg-slate-950/60"
                />
                <p className="text-xs text-slate-500">
                  Email is managed by your login provider.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / About</Label>
              <textarea
                id="bio"
                value={form.bio}
                onChange={handleChange("bio")}
                maxLength={300}
                rows={3}
                className={cn(
                  "flex w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-lime-300 focus:border-lime-300",
                )}
                placeholder="Tell us a bit about your business or role."
              />
              <p className="text-xs text-slate-500">{form.bio.length}/300</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
            <p className="text-xs text-slate-400">
              Tell us about your business for better recommendations.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business name</Label>
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={handleChange("businessName")}
                  placeholder="Talexia Studio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={handleChange("website")}
                  placeholder="https://yourstore.com"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  id="industry"
                  value={form.industry}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, industry: e.target.value }))
                  }
                  className={cn(
                    "flex h-10 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-lime-300 focus:border-lime-300",
                  )}
                >
                  <option value="">Select industry</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="retail">Retail</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={form.timezone}
                  onChange={handleChange("timezone")}
                  placeholder="UTC"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <p className="text-xs text-slate-400">
              Manage how you sign in and protect your account.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Password</p>
                <p className="text-xs text-slate-400">
                  Change your password via the account security flow.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full"
                onClick={() => {
                  alert("Password change flow coming soon.");
                }}
              >
                Change password
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={saving || loading}
            className="rounded-full"
          >
            {saving ? "Saving..." : "Save settings"}
          </Button>
          {message ? <p className="text-xs text-slate-300">{message}</p> : null}
        </div>
      </form>
    </div>
  );
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch {
    return false;
  }
}
