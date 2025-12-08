import { useState } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { updateAvatar } from '@/services/auth';
import { useToast } from "@/hooks/use-toast";
import { Camera, User, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';

export const Settings = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const updatedUser = await updateAvatar(file);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast({
                title: "Profile Updated",
                description: "Your profile picture has been updated.",
            });

            // Reload to reflect changes globally
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            toast({
                title: "Update Failed",
                description: "Failed to upload image.",
                variant: "destructive"
            });
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const avatarUrl = user?.avatar_url
        ? (user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:8000${user.avatar_url}`)
        : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Header isAuthenticated={!!user} userType={user?.is_teacher ? 'teacher' : 'student'} userName={user?.full_name} />

            <div className="container mx-auto py-24 px-4 max-w-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={user?.is_teacher ? "/teacher/dashboard" : "/homepage"}><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <h1 className="text-3xl font-bold">{t('common.settings')}</h1>
                </div>

                <div className="grid gap-6">
                    {/* Profile Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Picture</CardTitle>
                            <CardDescription>Update your profile photo</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            <div className="relative group cursor-pointer mb-4">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200 dark:bg-slate-800">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="h-16 w-16 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                                <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                    <Camera className="h-8 w-8 text-white" />
                                </label>
                                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                            </div>
                            {isUploading && <div className="flex items-center text-sm text-blue-600"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</div>}
                        </CardContent>
                    </Card>

                    {/* Language Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('common.language')}</CardTitle>
                            <CardDescription>{t('common.selectLanguage')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-2">
                                <Label>{t('common.language')}</Label>
                                <LanguageSwitcher variant="list" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
