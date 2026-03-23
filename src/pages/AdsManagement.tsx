import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/herald/MainLayout';
import { apiGet } from '@/lib/apiClient';
import {
  adminGetAllAds,
  adminCreateAd,
  adminUpdateAd,
  adminDeleteAd,
  type Ad,
} from '@/lib/api/ads';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  Lock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminRole {
  is_admin: boolean;
  role: 'admin' | 'user';
}

type AdFormData = {
  title: string;
  description: string;
  sponsor_name: string;
  image_url: string;
  cta_text: string;
  target_url: string;
  reward_points: number;
  is_featured: boolean;
  budget_points: number;
  status: 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
};

const EMPTY_FORM: AdFormData = {
  title: '',
  description: '',
  sponsor_name: '',
  image_url: '',
  cta_text: 'Learn More',
  target_url: '',
  reward_points: 0,
  is_featured: false,
  budget_points: 0,
  status: 'active',
  start_date: '',
  end_date: '',
};

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-bold text-2xl text-foreground">Access Denied</h1>
          <p className="text-muted-foreground max-w-sm">
            You do not have permission to view this page. Admin privileges are required.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/feed">Back to Feed</Link>
        </Button>
      </div>
    </MainLayout>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Ad['status'] }) {
  if (status === 'active') {
    return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Active</Badge>;
  }
  if (status === 'paused') {
    return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">Paused</Badge>;
  }
  return <Badge className="bg-muted text-muted-foreground text-xs">Completed</Badge>;
}

// ─── Ad Form Dialog ───────────────────────────────────────────────────────────

interface AdFormDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: Ad | null;
  onSaved: () => void;
}

function AdFormDialog({ open, onClose, initial, onSaved }: AdFormDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<AdFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description ?? '',
        sponsor_name: initial.sponsor_name ?? '',
        image_url: initial.image_url ?? '',
        cta_text: initial.cta_text,
        target_url: initial.target_url ?? '',
        reward_points: initial.reward_points,
        is_featured: initial.is_featured,
        budget_points: initial.budget_points,
        status: initial.status,
        start_date: initial.start_date ?? '',
        end_date: initial.end_date ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [initial, open]);

  const set = (key: keyof AdFormData, value: AdFormData[keyof AdFormData]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Validation', description: 'Title is required.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const payload: Partial<Ad> & { title: string } = {
        title: form.title,
        description: form.description || null,
        sponsor_name: form.sponsor_name || null,
        image_url: form.image_url || null,
        cta_text: form.cta_text,
        target_url: form.target_url || null,
        reward_points: form.reward_points,
        is_featured: form.is_featured,
        budget_points: form.budget_points,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      if (initial) {
        await adminUpdateAd(initial.id, payload);
        toast({ title: 'Ad Updated', description: 'Campaign updated successfully.' });
      } else {
        await adminCreateAd(payload);
        toast({ title: 'Ad Created', description: 'Campaign created successfully.' });
      }
      onSaved();
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to save ad.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{initial ? 'Edit Ad Campaign' : 'Create Ad Campaign'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="ad-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="ad-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Campaign title"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="ad-desc">Description</Label>
            <Textarea
              id="ad-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Campaign description"
              rows={3}
            />
          </div>

          {/* Sponsor Name */}
          <div className="space-y-1">
            <Label htmlFor="ad-sponsor">Sponsor Name</Label>
            <Input
              id="ad-sponsor"
              value={form.sponsor_name}
              onChange={(e) => set('sponsor_name', e.target.value)}
              placeholder="Sponsor / brand name"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1">
            <Label htmlFor="ad-image">Image URL</Label>
            <Input
              id="ad-image"
              value={form.image_url}
              onChange={(e) => set('image_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* CTA Text + Target URL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ad-cta">CTA Text</Label>
              <Input
                id="ad-cta"
                value={form.cta_text}
                onChange={(e) => set('cta_text', e.target.value)}
                placeholder="Learn More"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ad-url">Target URL</Label>
              <Input
                id="ad-url"
                value={form.target_url}
                onChange={(e) => set('target_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Reward + Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ad-reward">Reward Points</Label>
              <Input
                id="ad-reward"
                type="number"
                min={0}
                value={form.reward_points}
                onChange={(e) => set('reward_points', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ad-budget">Budget Points</Label>
              <Input
                id="ad-budget"
                type="number"
                min={0}
                value={form.budget_points}
                onChange={(e) => set('budget_points', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set('status', v as Ad['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start + End Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ad-start">Start Date</Label>
              <Input
                id="ad-start"
                type="date"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ad-end">End Date</Label>
              <Input
                id="ad-end"
                type="date"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
              />
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="ad-featured"
              checked={form.is_featured}
              onCheckedChange={(v) => set('is_featured', v === true)}
            />
            <Label htmlFor="ad-featured" className="cursor-pointer">Featured ad</Label>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {initial ? 'Save Changes' : 'Create Campaign'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Access guard
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Ads state
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog / delete state
  const [formOpen, setFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Check admin role ──
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const data = await apiGet<AdminRole>('/admin/me/role/');
        setIsAdmin(data.is_admin);
      } catch {
        setIsAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };
    check();
  }, [user]);

  // ── Fetch ads ──
  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await adminGetAllAds(params);
      setAds(data.results ?? []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load ads', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    if (isAdmin) fetchAds();
  }, [isAdmin, fetchAds]);

  // ── Delete ──
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await adminDeleteAd(id);
      toast({ title: 'Ad Deleted', description: 'Campaign removed.' });
      setDeleteConfirmId(null);
      fetchAds();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete ad', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render guards ──
  if (checkingRole) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) return <AccessDenied />;

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="font-display font-bold text-xl text-foreground">Ads Management</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={fetchAds} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setEditingAd(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Create Ad
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Status filter */}
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground shrink-0">Filter:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ads Table */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ad Campaigns</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : ads.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No ad campaigns found.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setEditingAd(null);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Create First Campaign
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="p-4 font-medium">Title</th>
                        <th className="p-4 font-medium hidden sm:table-cell">Sponsor</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium hidden md:table-cell">Impressions</th>
                        <th className="p-4 font-medium hidden md:table-cell">Clicks</th>
                        <th className="p-4 font-medium hidden lg:table-cell">Budget</th>
                        <th className="p-4 font-medium hidden lg:table-cell">Created</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ads.map((ad) => (
                        <>
                          <tr key={ad.id} className="hover:bg-secondary/30">
                            <td className="p-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-sm text-foreground">{ad.title}</span>
                                  {ad.is_featured && (
                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                                {ad.target_url && (
                                  <a
                                    href={ad.target_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground flex items-center gap-0.5 hover:text-primary"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Link
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">
                              {ad.sponsor_name || '—'}
                            </td>
                            <td className="p-4">
                              <StatusBadge status={ad.status} />
                            </td>
                            <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                              {ad.impressions.toLocaleString()}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                              {ad.clicks.toLocaleString()}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                              {ad.budget_points.toLocaleString()} pts
                            </td>
                            <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                              {new Date(ad.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  title="Edit"
                                  onClick={() => {
                                    setEditingAd(ad);
                                    setFormOpen(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-destructive hover:text-destructive"
                                  title="Delete"
                                  onClick={() => setDeleteConfirmId(ad.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {/* Inline delete confirm row */}
                          {deleteConfirmId === ad.id && (
                            <tr key={`del-${ad.id}`} className="bg-destructive/5">
                              <td colSpan={8} className="p-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-destructive flex-1">
                                    Delete &ldquo;{ad.title}&rdquo;? This cannot be undone.
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(ad.id)}
                                    disabled={deletingId === ad.id}
                                    className="h-8"
                                  >
                                    {deletingId === ad.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      'Delete'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="h-8"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <AdFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingAd(null);
        }}
        initial={editingAd}
        onSaved={fetchAds}
      />
    </MainLayout>
  );
}
