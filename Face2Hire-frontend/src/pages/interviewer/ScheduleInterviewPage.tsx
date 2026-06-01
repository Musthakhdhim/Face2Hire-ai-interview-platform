import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Calendar, CheckCircle2, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Slider } from "../../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { toast } from "react-toastify";
import { scheduledInterviewService } from "../../services/scheduledInterviewService";
import type { ScheduleInterviewRequest } from "../../services/scheduledInterviewService";
import type { InterviewType, Difficulty, AvatarStyle } from "../../services/interviewService";
import { userService, type UserSearchResult } from "../../services/userService";

export default function ScheduleInterviewPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [formData, setFormData] = useState<ScheduleInterviewRequest>(() => {
        const idParam = searchParams.get("intervieweeId");
        const nameParam = searchParams.get("candidateName");
        const appIdParam = searchParams.get("applicationId");
        return {
            intervieweeId: idParam ? Number(idParam) : 0,
            intervieweeName: nameParam ? decodeURIComponent(nameParam) : "",
            type: "technical",
            difficulty: "intermediate",
            duration: 30,
            questionCount: 10,
            avatarStyle: "professional",
            dueDate: "",
            applicationId: appIdParam ? Number(appIdParam) : undefined,
            minimumScore: 70,
        };
    });

    const [emailSearchOpen, setEmailSearchOpen] = useState(false);
    const [emailSearchValue, setEmailSearchValue] = useState("");
    const [emailSearchResults, setEmailSearchResults] = useState<UserSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(""); // ✅ store selected email for display

    // If coming from application (URL params), we can try to fetch email? Optional.
    // For now, we leave it as is; the email display will be empty until a search is done.

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (emailSearchValue.length >= 3) {
                setSearching(true);
                try {
                    const results = await userService.searchByEmail(emailSearchValue);
                    setEmailSearchResults(results);
                } catch (err) {
                    console.error(err);
                    setEmailSearchResults([]);
                } finally {
                    setSearching(false);
                }
            } else {
                setEmailSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [emailSearchValue]);

    const handleSelectUser = (user: UserSearchResult) => {
        setFormData(prev => ({
            ...prev,
            intervieweeId: user.id,
            intervieweeName: user.name,
        }));
        setSelectedEmail(user.email);   // ✅ save email for display
        setEmailSearchValue("");
        setEmailSearchOpen(false);
    };

    const avatars = [
        { id: "professional", emoji: "👔", name: "Professional", description: "Formal and focused" },
        { id: "friendly", emoji: "😊", name: "Friendly", description: "Warm and encouraging" },
        { id: "strict", emoji: "🧐", name: "Strict", description: "Direct and challenging" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.intervieweeId || !formData.intervieweeName || !formData.dueDate) {
            toast.error("Please fill in all required fields");
            return;
        }
        try {
            await scheduledInterviewService.schedule(formData);
            toast.success("Interview scheduled successfully!");
            navigate("/interviewer/scheduled");
        } catch {
            toast.error("Failed to schedule interview");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Button variant="ghost" onClick={() => navigate("/interviewer")}>← Back to Dashboard</Button>
                <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Schedule Interview</h1>
                <p className="text-gray-600">Set up an interview for a candidate</p>
            </motion.div>

            <Card className="border-0 shadow-lg bg-blue-50 border-l-4 border-l-blue-600">
                <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">About Scheduled Interviews</h3>
                    <p className="text-sm text-gray-600">When you schedule an interview, the candidate will not be able to modify any interview settings. They must complete it by the due date you specify.</p>
                </CardContent>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="border-0 shadow-lg">
                    <CardHeader><CardTitle>Candidate Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Candidate Email *</Label>
                                <Popover open={emailSearchOpen} onOpenChange={setEmailSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {selectedEmail ? selectedEmail : "Search by email..."}
                                            <Search className="ml-2 size-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Type email (at least 3 characters)"
                                                value={emailSearchValue}
                                                onValueChange={setEmailSearchValue}
                                            />
                                            <CommandList>
                                                {searching && (
                                                    <div className="flex justify-center p-4">
                                                        <Loader2 className="size-5 animate-spin" />
                                                    </div>
                                                )}
                                                {!searching && emailSearchResults.length === 0 && emailSearchValue.length >= 3 && (
                                                    <CommandEmpty>No users found</CommandEmpty>
                                                )}
                                                <CommandGroup>
                                                    {emailSearchResults.map((user) => (
                                                        <CommandItem
                                                            key={user.id}
                                                            value={user.email}
                                                            onSelect={() => handleSelectUser(user)}
                                                        >
                                                            <div>
                                                                <div className="font-medium">{user.name}</div>
                                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-gray-500">Start typing the candidate's email address</p>
                            </div>
                            <div>
                                <Label htmlFor="name">Candidate Name</Label>
                                <Input
                                    id="name"
                                    value={formData.intervieweeName}
                                    disabled
                                    className="bg-gray-100"
                                />
                                <p className="text-xs text-gray-500 mt-1">Automatically filled when email selected</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Rest of the form unchanged (Interview Configuration, Avatar, etc.) */}
                <Card className="border-0 shadow-lg">
                    <CardHeader><CardTitle>Interview Configuration</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Interview Type</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as InterviewType })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="hr">HR</SelectItem>
                                        <SelectItem value="behavioral">Behavioral</SelectItem>
                                        <SelectItem value="salary">Salary</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Difficulty</Label>
                                <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v as Difficulty })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="expert">Expert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-3">
                                <Label className="text-base font-semibold">Duration</Label>
                                <Badge variant="outline">{formData.duration} minutes</Badge>
                            </div>
                            <Slider
                                value={[formData.duration]}
                                onValueChange={([val]) => setFormData({ ...formData, duration: val })}
                                min={15} max={60} step={15}
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>15 min</span><span>30 min</span><span>45 min</span><span>60 min</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-3">
                                <Label className="text-base font-semibold">Number of Questions</Label>
                                <Badge variant="outline">{formData.questionCount} questions</Badge>
                            </div>
                            <Slider
                                value={[formData.questionCount]}
                                onValueChange={([val]) => setFormData({ ...formData, questionCount: val })}
                                min={5} max={20} step={5}
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>5</span><span>10</span><span>15</span><span>20</span>
                            </div>
                        </div>

                        <div>
                            <Label className="text-base font-semibold mb-3 block">Interviewer Avatar Personality</Label>
                            <div className="grid md:grid-cols-3 gap-4 mb-4">
                                {avatars.map((avatar) => (
                                    <Card
                                        key={avatar.id}
                                        className={`cursor-pointer hover:shadow-lg transition-all ${
                                            formData.avatarStyle === avatar.id ? "border-2 border-indigo-500 shadow-lg" : ""
                                        }`}
                                        onClick={() => setFormData({ ...formData, avatarStyle: avatar.id as AvatarStyle })}
                                    >
                                        <CardContent className="p-6 text-center relative">
                                            {formData.avatarStyle === avatar.id && (
                                                <div className="absolute top-3 right-3">
                                                    <CheckCircle2 className="size-6 text-indigo-600" />
                                                </div>
                                            )}
                                            <div className="text-6xl mb-3">{avatar.emoji}</div>
                                            <h3 className="font-bold text-gray-900 mb-1">{avatar.name}</h3>
                                            <p className="text-sm text-gray-600">{avatar.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="dueDate">Due Date *</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                min={new Date().toISOString().split("T")[0]}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Deadline for candidate to complete the interview</p>
                        </div>

                        <div>
                            <Label htmlFor="minScore">Minimum Score Required (%)</Label>
                            <Input
                                id="minScore"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.minimumScore}
                                onChange={(e) => setFormData({ ...formData, minimumScore: Number(e.target.value) })}
                                required
                            />
                            <p className="text-xs text-gray-500">If the candidate scores below this, the application will be auto‑rejected.</p>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <h4 className="font-medium text-gray-900 mb-2">Locked Settings</h4>
                            <p className="text-sm text-gray-600">The candidate will not be able to change any settings. All are locked.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Ready to schedule?</h3>
                                <p className="text-sm text-gray-600">The candidate will be notified via email</p>
                              </div>
                              <Button type="submit" size="lg" className="bg-gradient-to-r from-purple-500 to-indigo-600">
                                  <Calendar className="mr-2 size-5" /> Schedule Interview
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
              </form>
          </div>
      );
  }