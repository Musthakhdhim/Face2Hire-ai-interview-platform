import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge as UIBadge } from '../../components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { badgeService } from '../../services/badgeService';
import type { Badge } from '../../types/badge';

export default function AdminBadgesPage() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        iconUrl: '',
        type: 'GENERAL' as Badge['type'],
        requirement: '',
    });

    useEffect(() => {
        let isMounted = true;
        const fetchBadges = async () => {
            try {
                const data = await badgeService.getAllBadges();
                if (isMounted) setBadges(data);
            } catch {
                toast.error('Failed to load badges');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchBadges();
        return () => { isMounted = false; };
    }, []);

    const resetForm = () => {
        setFormData({ name: '', description: '', iconUrl: '', type: 'GENERAL', requirement: '' });
        setEditingBadge(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Badge name is required');
            return;
        }
        try {
            if (editingBadge) {
                await badgeService.updateBadge(editingBadge.id, formData);
                toast.success('Badge updated');
            } else {
                await badgeService.createBadge(formData);
                toast.success('Badge created');
            }
            setIsDialogOpen(false);
            resetForm();
            const data = await badgeService.getAllBadges();
            setBadges(data);
            setLoading(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this badge?')) {
            try {
                await badgeService.deleteBadge(id);
                toast.success('Badge deleted');
                const data = await badgeService.getAllBadges();
                setBadges(data);
            } catch {
                toast.error('Failed to delete badge');
            }
        }
    };

    const openEditDialog = (badge: Badge) => {
        setEditingBadge(badge);
        setFormData({
            name: badge.name,
            description: badge.description || '',
            iconUrl: badge.iconUrl || '',
            type: badge.type,
            requirement: badge.requirement || '',
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Badges Management</h1>
                    <p className="text-gray-600 mt-1">Create and manage achievement badges</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                            <Plus className="mr-2 size-4" /> Create Badge
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingBadge ? 'Edit Badge' : 'Create New Badge'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Badge Name *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
                            </div>
                            <div>
                                <Label>Icon URL (optional)</Label>
                                <Input value={formData.iconUrl} onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })} placeholder="https://example.com/icon.png" />
                            </div>
                            <div>
                                <Label>Badge Type</Label>
                                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val as Badge['type'] })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INTERVIEWEE">Interviewee</SelectItem>
                                        <SelectItem value="INTERVIEWER">Interviewer</SelectItem>
                                        <SelectItem value="GENERAL">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Requirement (e.g., "completed_interviews &gt;= 50")</Label>
                                <Input 
                                    value={formData.requirement} 
                                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })} 
                                    placeholder="completed_interviews >= 50" 
                                />
                                <div className="mt-2 text-xs text-gray-500">
                                    <p className="font-medium">Available metrics for this badge type:</p>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li><code className="bg-gray-100 px-1 rounded">completed_interviews</code> – total completed interviews</li>
                                        <li><code className="bg-gray-100 px-1 rounded">avg_score</code> – average score (0‑100)</li>
                                        <li><code className="bg-gray-100 px-1 rounded">jobs_posted</code> – number of jobs posted (interviewer only)</li>
                                        <li><code className="bg-gray-100 px-1 rounded">hired_count</code> – number of approved applications (interviewer only)</li>
                                        <li><code className="bg-gray-100 px-1 rounded">scheduled_interviews</code> – number of interviews scheduled (interviewer only)</li>
                                    </ul>
                                    <p className="mt-2">Format: <code>metric_name operator value</code><br/>Operators: <code>&gt;=</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&lt;</code>, <code>=</code></p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingBadge ? 'Update' : 'Create'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>All Badges</CardTitle>
                    <CardDescription>Manage badges that users can earn</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : badges.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No badges created yet</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Requirement</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {badges.map((badge) => (
                                    <TableRow key={badge.id}>
                                        <TableCell className="font-medium">{badge.name}</TableCell>
                                        <TableCell><UIBadge variant="outline">{badge.type}</UIBadge></TableCell>
                                        <TableCell className="max-w-xs truncate">{badge.description}</TableCell>
                                        <TableCell className="text-xs">{badge.requirement || '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(badge)}><Pencil className="size-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(badge.id)}><Trash2 className="size-4 text-red-500" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}