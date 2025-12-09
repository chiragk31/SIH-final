import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Added import
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import { createCourse, uploadCourseThumbnail } from '@/services/courses';
import { Upload, X, BookOpen, Languages, Tag, Info, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWalkthrough } from '@/hooks/useWalkthrough';

import { INDIAN_LANGUAGES } from '@/constants/languages';

const CreateCourse = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isTeacher } = useAuth();
    const { startCreateCourseTour } = useWalkthrough();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        domain: '',
        source_language: 'en-IN',
        target_languages: INDIAN_LANGUAGES.filter(l => l.code !== 'en-IN').map(l => l.code),
    });

    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [hasAgreed, setHasAgreed] = useState(false);

    const domains = [
        'agriculture',
        'technology',
        'healthcare',
        'education',
        'business',
        'other',
    ];

    // Use INDIAN_LANGUAGES directly
    const languages = INDIAN_LANGUAGES;

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: 'File too large',
                    description: 'Thumbnail should be less than 5MB',
                    variant: 'destructive',
                });
                return;
            }

            setThumbnail(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLanguageToggle = (langCode: string) => {
        setFormData(prev => ({
            ...prev,
            target_languages: (prev.target_languages.includes(langCode as any)
                ? prev.target_languages.filter(l => l !== langCode)
                : [...prev.target_languages, langCode]) as any,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast({
                title: t('common.titleRequired'),
                description: t('common.enterTitle'),
                variant: 'destructive',
            });
            return;
        }

        if (!formData.domain) {
            toast({
                title: t('common.subjectRequired'),
                description: t('common.selectSubject'),
                variant: 'destructive',
            });
            return;
        }

        if (formData.target_languages.length === 0) {
            toast({
                title: t('common.languagesRequired'),
                description: t('common.selectOneLanguage'),
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsUploading(true);

            let thumbnailUrl = '';
            if (thumbnail) {
                thumbnailUrl = await uploadCourseThumbnail(thumbnail);
            }

            const courseData = {
                ...formData,
                thumbnail_url: thumbnailUrl || undefined,
            };

            const newCourse = await createCourse(courseData);

            toast({
                title: t('common.created'),
                description: t('common.createdSuccess', { title: newCourse.title }),
            });

            navigate(`/teacher/course/${newCourse.id}`);
        } catch (error: any) {
            console.error('Error creating course:', error);
            toast({
                title: t('common.failed'),
                description: error.response?.data?.detail || t('common.error'),
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    if (!isTeacher) {
        navigate('/teacherlogin');
        return null;
    }

    return (
        <div className="min-h-screen relative bg-background text-foreground transition-colors duration-300">
            <PremiumBackground />
            <Header isAuthenticated userType="teacher" />

            <div className="container px-4 py-12 lg:py-16 relative z-10 max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-md border border-primary/20">
                            <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <Button variant="outline" size="sm" onClick={startCreateCourseTour} className="ml-auto">
                            <Info className="mr-2 h-4 w-4" />
                            {t('common.guideMe')}
                        </Button>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground font-heading tracking-tight">
                        {t('common.createCourseTitle')}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        {t('common.createCourseSubtitle')}
                    </p>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Card className="glass-card border-white/20 dark:border-white/10 shadow-xl">
                        <CardHeader>
                            <CardTitle>{t('common.courseInfo')}</CardTitle>
                            <CardDescription>
                                {t('common.courseInfoDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Title */}
                                <div id="course-title-section" className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="title">{t('common.titleLabel')}</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Provide a clear, descriptive name for your course.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="title"
                                        placeholder={t('common.titlePlaceholder')}
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        className="bg-background/50"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="description">{t('common.description')}</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Summarize what students will learn. Keep it professional and engaging.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Textarea
                                        id="description"
                                        placeholder={t('common.descriptionPlaceholder')}
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        className="bg-background/50 min-h-[100px]"
                                        rows={4}
                                    />
                                </div>

                                {/* Subject */}
                                <div id="course-domain-section" className="space-y-2">
                                    <Label htmlFor="domain">{t('common.subject')}</Label>
                                    <Select
                                        value={formData.domain}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, domain: value })
                                        }
                                        required
                                    >
                                        <SelectTrigger className="bg-background/50">
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-primary" />
                                                <SelectValue placeholder={t('common.selectSubjectPlaceholder')} />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {domains.map((domain) => (
                                                <SelectItem key={domain} value={domain}>
                                                    {domain.charAt(0).toUpperCase() + domain.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Source Language */}
                                <div id="course-language-section" className="space-y-2">
                                    <Label htmlFor="source_language">{t('common.sourceLanguage')}</Label>
                                    <Select
                                        value={formData.source_language}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                source_language: value,
                                                target_languages: INDIAN_LANGUAGES
                                                    .filter(l => l.code !== value)
                                                    .map(l => l.code) as any
                                            })
                                        }
                                        required
                                    >
                                        <SelectTrigger className="bg-background/50">
                                            <div className="flex items-center gap-2">
                                                <Languages className="h-4 w-4 text-primary" />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {languages.map((lang) => (
                                                <SelectItem key={lang.code} value={lang.code}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Target Languages */}
                                <div className="space-y-2">
                                    <Label>{t('common.translationLanguages')}</Label>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {t('common.translationDesc')}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {languages
                                            .filter((lang) => lang.code !== formData.source_language)
                                            .map((lang) => (
                                                <Button
                                                    key={lang.code}
                                                    type="button"
                                                    variant={
                                                        formData.target_languages.includes(lang.code)
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() => handleLanguageToggle(lang.code as any)}
                                                    className="transition-all"
                                                >
                                                    {lang.name}
                                                </Button>
                                            ))}
                                    </div>
                                </div>

                                {/* Thumbnail */}
                                <div id="course-thumbnail-section" className="space-y-2">
                                    <Label>{t('common.thumbnailUpload')}</Label>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {t('common.thumbnailDesc')}
                                    </p>

                                    {thumbnailPreview ? (
                                        <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border-2 border-border">
                                            <img
                                                src={thumbnailPreview}
                                                alt="Thumbnail preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2"
                                                onClick={() => {
                                                    setThumbnail(null);
                                                    setThumbnailPreview('');
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <label className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors block max-w-md">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleThumbnailChange}
                                                className="hidden"
                                            />
                                            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                {t('common.clickUpload')}
                                                <br />
                                                {t('common.maxSize')}
                                            </p>
                                        </label>
                                    )}
                                </div>

                                {/* Guidelines Agreement */}
                                <div id="course-guidelines-section" className="bg-muted/30 p-4 rounded-xl border border-muted space-y-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm">{t('common.guidelines')}</h4>
                                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                {(t('common.guidelinesList', { returnObjects: true }) as string[]).map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 pt-2 border-t border-muted/50">
                                        <Checkbox 
                                            id="guidelines" 
                                            checked={hasAgreed}
                                            onCheckedChange={(checked) => setHasAgreed(checked as boolean)}
                                        />
                                        <Label 
                                            htmlFor="guidelines" 
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {t('common.agreeGuidelines')}
                                        </Label>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-4 pt-6 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate('/teacher/courses')}
                                        disabled={isUploading}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                    <Button id="create-course-submit" type="submit" disabled={isUploading || !hasAgreed} className="flex-1">
                                        {isUploading ? t('common.creating') : t('common.createCourse')}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default CreateCourse;
