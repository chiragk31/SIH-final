import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Languages, FileText, Image as ImageIcon, Loader2, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDIAN_LANGUAGES } from '@/constants/languages';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';

interface Document {
    id: string;
    title: string;
    description: string;
    file_url: string;
    content_type: 'document' | 'image';
    file_type?: string;
}

interface CourseDocumentsProps {
    documents: Document[];
    courseId: string;
}

export const CourseDocuments = ({ documents, courseId }: CourseDocumentsProps) => {
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [targetLang, setTargetLang] = useState<string>(i18n.language || 'en-IN');
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedUrl, setTranslatedUrl] = useState<string | null>(null);
    const [translatedImageUrl, setTranslatedImageUrl] = useState<string | null>(null);

    // Reset state when document changes
    useEffect(() => {
        if (documents.length > 0 && !selectedDoc) {
            setSelectedDoc(documents[0]);
        }
    }, [documents]);

    useEffect(() => {
        setTranslatedUrl(null);
        setTranslatedImageUrl(null);
        setIsTranslating(false);
    }, [selectedDoc]);

    const handleTranslate = async () => {
        if (!selectedDoc || targetLang === 'en-IN') return;

        setIsTranslating(true);
        try {
            if (selectedDoc.content_type === 'document' || selectedDoc.file_type === 'pdf') {
                // PDF Translation via Backend
                const response = await api.post('/documents/translate', {
                    document_id: selectedDoc.id,
                    target_language: targetLang
                });

                if (response.data.translated_pdf_url) {
                    setTranslatedUrl(response.data.translated_pdf_url);
                    toast({
                        title: 'Success',
                        description: 'Document translated successfully',
                    });
                }
            } else {
                // Image Translation via Backend Proxy (to n8n)

                // Fetch the SOURCE image blob first.
                // Note: Fetching from Cloudinary might require CORS mode if not configured, 
                // but usually Cloudinary allows GET. 'mode: cors' ensures we get a readable response.
                const imageResponse = await fetch(selectedDoc.file_url, { mode: 'cors' });
                if (!imageResponse.ok) throw new Error('Failed to fetch source image data');
                const imageBlob = await imageResponse.blob();

                const formData = new FormData();
                formData.append('file', imageBlob, 'image.jpg');
                formData.append('target_language', targetLang);

                // Use backend proxy
                // Important: We expect a binary blob response for the image
                const response = await api.post('/documents/translate-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    responseType: 'blob'
                });

                // Axios returns data in response.data which is the Blob
                const blob = response.data;
                const localUrl = URL.createObjectURL(blob);
                setTranslatedImageUrl(localUrl);
                toast({
                    title: 'Success',
                    description: 'Translated image received',
                });
            }
        } catch (error) {
            console.error('Translation failed:', error);
            toast({
                title: 'Error',
                description: 'Failed to translate content',
                variant: 'destructive',
            });
        } finally {
            setIsTranslating(false);
        }
    };

    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <FileText className="h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Documents Available</h3>
                <p>This course does not have any document resources yet.</p>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Main Content Viewer */}
            <div className="space-y-6">
                <Card className="glass-card border-white/20 dark:border-white/10 min-h-[600px] flex flex-col">
                    <CardContent className="p-0 flex-1 relative bg-gray-900/50 rounded-lg overflow-hidden flex items-center justify-center">
                        {selectedDoc && (
                            <>
                                {(selectedDoc.content_type === 'document' || selectedDoc.file_type === 'pdf') ? (
                                    <iframe
                                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(translatedUrl || selectedDoc.file_url)}&embedded=true`}
                                        className="w-full h-[800px] border-none"
                                        title="Document Viewer"
                                    />
                                ) : (
                                    <div className="relative w-full h-[600px] bg-black/50 flex items-center justify-center">
                                        <img
                                            src={translatedImageUrl || selectedDoc.file_url}
                                            alt={selectedDoc.title}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                        {!selectedDoc && (
                            <div className="text-muted-foreground p-8">Select a document to view</div>
                        )}
                    </CardContent>
                </Card>

                {/* Translation Controls */}
                {selectedDoc && (
                    <Card className="glass-card border-white/20 p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Languages className="h-5 w-5 text-primary" />
                                <span className="font-medium">Translate Content</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={targetLang} onValueChange={setTargetLang} disabled={isTranslating}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en-IN">Original (English)</SelectItem>
                                        {INDIAN_LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                {lang.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleTranslate}
                                    disabled={targetLang === 'en-IN' || isTranslating}
                                    className="min-w-[120px]"
                                >
                                    {isTranslating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Translating...
                                        </>
                                    ) : (
                                        'Translate'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Document List Sidebar */}
            <div className="space-y-4">
                <Card className="glass-card border-white/20 h-full max-h-[800px] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Resources
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {documents.map((doc) => (
                            <button
                                key={doc.id}
                                onClick={() => setSelectedDoc(doc)}
                                className={`w-full text-left p-3 rounded-lg transition-all border flex items-start gap-3
                                    ${selectedDoc?.id === doc.id
                                        ? 'bg-primary/10 border-primary/30'
                                        : 'hover:bg-white/5 border-transparent hover:border-white/10'
                                    }`}
                            >
                                <div className={`mt-1 bg-white/10 p-2 rounded-md ${selectedDoc?.id === doc.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {doc.content_type === 'document' ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${selectedDoc?.id === doc.id ? 'text-primary' : 'text-foreground'}`}>
                                        {doc.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {doc.description || 'No description'}
                                    </p>
                                </div>
                                {selectedDoc?.id === doc.id && (
                                    <ArrowRight className="h-4 w-4 text-primary mt-3" />
                                )}
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};
