import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/services/auth';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Camera, User, Save, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';

export const Profile = () => {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        contact_number: '',
        qualification: '',
        specialization: '',
        domain_expertise: '',
    });

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Sync user data to form when user loads
    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                contact_number: user.contact_number || '',
                qualification: user.qualification || '',
                specialization: user.specialization || '',
                domain_expertise: user.domain_expertise || '',
            });
        }
    }, [user]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting profile update...", formData);
        setIsLoading(true);
        try {
            console.log("Calling API...");
            const updatedUser = await updateProfile({
                ...formData,
                profile_image: profileImage
            });
            console.log("Profile updated successfully", updatedUser);

            // Update local storage
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast({
                title: t('profile.profileUpdated'),
                description: t('profile.profileSaved'),
            });

            // Refresh user data and navigate
            console.log("Refreshing user context...");
            await refreshUser();
            console.log("Navigating to profile-data...");
            navigate('/profile-data');

        } catch (error) {
            console.error("Profile update failed:", error);
            toast({
                title: t('profile.updateFailed'),
                description: t('profile.failedMessage'),
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Construct initial avatar URL
    const currentAvatarUrl = previewUrl || (user?.avatar_url
        ? (user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:8000${user.avatar_url}`)
        : null);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Header isAuthenticated={!!user} userType={user?.is_teacher ? 'teacher' : 'student'} userName={user?.full_name} />

            <div className="container mx-auto py-24 px-4 max-w-3xl">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={user?.is_teacher ? "/teacher/dashboard" : "/homepage"}><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
                </div>

                <div className="grid gap-8">
                    <Card className="glass-card border-white/20 dark:border-white/10 shadow-xl">
                        <CardHeader>
                            <CardTitle>{t('profile.personalInfo')}</CardTitle>
                            <CardDescription>{t('profile.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Profile Image */}
                                <div className="flex flex-col items-center justify-center mb-6">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200 dark:bg-slate-800">
                                            {currentAvatarUrl ? (
                                                <img src={currentAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="h-16 w-16 text-slate-400" />
                                                </div>
                                            )}
                                        </div>
                                        <label htmlFor="profile-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                            <Camera className="h-8 w-8 text-white" />
                                        </label>
                                        <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{t('profile.uploadPhoto')}</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Fields */}
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">{t('auth.fullName')}</Label>
                                        <Input
                                            id="full_name"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter your name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t('auth.emailAddress')}</Label>
                                        <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                                    </div>

                                    {/* Editable Fields */}
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_number">{t('profile.contactNumber')}</Label>
                                        <Input
                                            id="contact_number"
                                            name="contact_number"
                                            value={formData.contact_number}
                                            onChange={handleInputChange}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="qualification">{t('profile.qualification')}</Label>
                                        <Input
                                            id="qualification"
                                            name="qualification"
                                            value={formData.qualification}
                                            onChange={handleInputChange}
                                            placeholder="e.g. B.Tech, Ph.D"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="specialization">{t('profile.specialization')}</Label>
                                        <Input
                                            id="specialization"
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Computer Science"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="domain_expertise">{t('profile.domainExpertise')}</Label>
                                        <Input
                                            id="domain_expertise"
                                            name="domain_expertise"
                                            value={formData.domain_expertise}
                                            onChange={handleInputChange}
                                            placeholder="e.g. AI/ML, Web Development"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        {t('profile.saveChanges')}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
