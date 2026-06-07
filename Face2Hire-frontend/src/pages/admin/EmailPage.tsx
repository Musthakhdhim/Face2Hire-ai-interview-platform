import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'react-toastify';
import { adminEmailService } from '../../services/adminEmailService';
import { Mail, Send, Users, Megaphone } from 'lucide-react';

export default function AdminEmailPage() {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [recipientType, setRecipientType] = useState<'MARKETING' | 'EMAIL_UPDATES' | 'ALL_USERS'>('MARKETING');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !body.trim()) {
            toast.error('Please fill in subject and body');
            return;
        }
        setSending(true);
        try {
            await adminEmailService.sendBulkEmail({ subject, body, recipientType });
            toast.success('Emails sent successfully!');
            setSubject('');
            setBody('');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to send emails';
            toast.error(message);
        } finally {
            setSending(false);
        }
    };

    const getRecipientDescription = () => {
        switch (recipientType) {
            case 'MARKETING':
                return 'Users who opted in for marketing emails';
            case 'EMAIL_UPDATES':
                return 'Users who opted in for general email updates';
            default:
                return 'All active and verified users';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
                <p className="text-gray-600 mt-1">Send bulk emails to users based on their notification preferences</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>Compose Email</CardTitle>
                    <CardDescription>Create and send promotional or informational emails</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Recipient Type</Label>
                            <Select value={recipientType} onValueChange={(val: any) => setRecipientType(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MARKETING">
                                        <div className="flex items-center gap-2">
                                            <Megaphone className="size-4" /> Marketing Opt-in
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="EMAIL_UPDATES">
                                        <div className="flex items-center gap-2">
                                            <Mail className="size-4" /> Email Updates Opt-in
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="ALL_USERS">
                                        <div className="flex items-center gap-2">
                                            <Users className="size-4" /> All Active Users
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">{getRecipientDescription()}</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Enter email subject"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Message Body</Label>
                            <Textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Write your message here..."
                                rows={10}
                                required
                            />
                            <p className="text-xs text-gray-500">HTML is not supported; plain text will be wrapped in a styled HTML template.</p>
                        </div>

                        <Button type="submit" disabled={sending} className="bg-indigo-600 w-full md:w-auto">
                            {sending ? 'Sending...' : <><Send className="mr-2 size-4" /> Send Emails</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}