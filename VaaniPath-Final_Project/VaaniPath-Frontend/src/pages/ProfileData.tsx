import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, ArrowLeft, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Separator } from "@/components/ui/separator";

export const ProfileData = () => {
    const { user } = useAuth();

    // Construct avatar URL
    const avatarUrl = user?.avatar_url
        ? (user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:8000${user.avatar_url}`)
        : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Header isAuthenticated={!!user} userType={user?.is_teacher ? 'teacher' : 'student'} userName={user?.full_name} />

            <div className="container mx-auto py-24 px-4 max-w-3xl">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={user?.is_teacher ? "/teacher/dashboard" : "/homepage"}><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Profile Details</h1>
                    <Button className="ml-auto gap-2" asChild>
                        <Link to="/profile">
                            <Edit2 className="h-4 w-4" />
                            Edit Profile
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-8">
                    <Card className="glass-card border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-8">
                            <div className="flex flex-col items-center justify-center">
                                {/* Profile Image Display - Always Centered */}
                                <div className="relative mb-4">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200 dark:bg-slate-800">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="h-16 w-16 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-center">{user?.full_name}</h2>
                                <p className="text-muted-foreground text-center">{user?.email}</p>
                                <p className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mt-2 capitalize">{user?.is_teacher ? 'Teacher' : 'Student'}</p>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-8">
                            <div className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <DetailItem label="Full Name" value={user?.full_name} />
                                    <DetailItem label="Email Address" value={user?.email} />
                                    <DetailItem label="Contact Number" value={user?.contact_number} />
                                    <DetailItem label="Qualification" value={user?.qualification} />
                                    <DetailItem label="Specialization" value={user?.specialization} />
                                    <DetailItem label="Domain Expertise" value={user?.domain_expertise} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value }: { label: string, value?: string }) => (
    <div className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        <p className="text-lg font-medium border-b border-border/50 pb-2">{value || <span className="text-muted-foreground/40 italic">Not set</span>}</p>
    </div>
);
