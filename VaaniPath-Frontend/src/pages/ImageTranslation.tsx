
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, ArrowRight, Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PremiumBackground } from '@/components/ui/PremiumBackground';

const LANGUAGES = [
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
    { code: 'en', name: 'English' },
];

const API_BASE = 'http://localhost:8000/api/v1/image-translator';

const ImageTranslation = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [targetLang, setTargetLang] = useState<string>('hi');
    const [isProcessing, setIsProcessing] = useState(false);
    const [translatedUrl, setTranslatedUrl] = useState<string | null>(null);
    const [regionCount, setRegionCount] = useState<string | null>(null);
    const { toast } = useToast();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload an image file.",
                    variant: "destructive",
                });
                return;
            }
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setTranslatedUrl(null);
            setRegionCount(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setTranslatedUrl(null);
            setRegionCount(null);
        }
    };

    const handleGenerate = async () => {
        if (!selectedImage) return;

        setIsProcessing(true);
        setTranslatedUrl(null);

        try {
            const formData = new FormData();
            formData.append('image', selectedImage);
            formData.append('target_language', targetLang);
            formData.append('source_language', 'auto');

            const response = await fetch(`${API_BASE}/translate`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(err.detail || 'Translation failed');
            }

            const regions = response.headers.get('X-Text-Regions');
            setRegionCount(regions);

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setTranslatedUrl(url);

            toast({
                title: "Translation Complete!",
                description: `${regions} text region${regions !== '1' ? 's' : ''} translated successfully.`,
            });

        } catch (error: any) {
            toast({
                title: "Translation Failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!translatedUrl) return;
        const a = document.createElement('a');
        a.href = translatedUrl;
        a.download = `translated_${selectedImage?.name || 'image.png'}`;
        a.click();
    };

    const handleReset = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setTranslatedUrl(null);
        setRegionCount(null);
    };

    const langName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

    return (
        <div className="min-h-screen relative bg-background text-foreground transition-colors duration-300">
            <PremiumBackground />
            <Header />
            <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12 relative z-10 space-y-8">

                {/* Header */}
                <div className="text-center space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                    >
                        AI Image Translation
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
                    >
                        Upload any image with text and instantly translate it into Hindi, Marathi or English.
                    </motion.p>
                </div>

                <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                    <CardContent className="p-8 md:p-12">

                        {!translatedUrl ? (
                            <div className="flex flex-col items-center justify-center space-y-8">

                                {/* Upload Area */}
                                <div className="w-full max-w-xl">
                                    <label
                                        htmlFor="image-upload"
                                        onDrop={handleDrop}
                                        onDragOver={(e) => e.preventDefault()}
                                        className={`
                                            relative flex flex-col items-center justify-center w-full h-80
                                            border-2 border-dashed rounded-3xl cursor-pointer
                                            transition-all duration-300 ease-in-out
                                            ${previewUrl
                                                ? 'border-blue-500/50 bg-blue-50/10'
                                                : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/50'
                                            }
                                        `}
                                    >
                                        {previewUrl ? (
                                            <div className="relative w-full h-full flex items-center justify-center p-2">
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="max-h-full max-w-full object-contain rounded-2xl shadow-sm"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                                                    <p className="text-white font-medium">Click to change</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                                                    <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <p className="mb-2 text-xl font-semibold text-slate-700 dark:text-slate-200">
                                                    Click to upload or drag and drop
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    PNG, JPG or WEBP supported
                                                </p>
                                            </div>
                                        )}
                                        <input
                                            id="image-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                </div>

                                {/* Language Selector */}
                                <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Translate to
                                    </label>
                                    <div className="flex gap-3">
                                        {LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => setTargetLang(lang.code)}
                                                className={`
                                                    px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200
                                                    ${targetLang === lang.code
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-400'
                                                    }
                                                `}
                                            >
                                                {lang.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <Button
                                    size="lg"
                                    onClick={handleGenerate}
                                    disabled={!selectedImage || isProcessing}
                                    className="min-w-[220px] h-14 text-lg rounded-full shadow-lg hover:shadow-blue-500/25 transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center gap-2">
                                            <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Translating...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5" />
                                            Translate to {langName}
                                        </div>
                                    )}
                                </Button>

                                {isProcessing && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-sm text-slate-500 animate-pulse"
                                    >
                                        Running OCR and translating — may take 5–10 seconds...
                                    </motion.p>
                                )}
                            </div>

                        ) : (
                            // Result View
                            <div className="space-y-8 animate-in fade-in zoom-in duration-500">

                                {regionCount && (
                                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                                        ✓ {regionCount} text region{regionCount !== '1' ? 's' : ''} translated to <span className="font-semibold text-blue-500">{langName}</span>
                                    </p>
                                )}

                                <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                                    {/* Original */}
                                    <div className="flex-1 space-y-3 w-full max-w-lg">
                                        <h3 className="text-center font-semibold text-slate-500 uppercase tracking-wider text-sm">
                                            Original
                                        </h3>
                                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-950">
                                            <img
                                                src={previewUrl!}
                                                alt="Original"
                                                className="w-full object-contain"
                                            />
                                        </div>
                                    </div>

                                    <ArrowRight className="w-8 h-8 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" />

                                    {/* Translated */}
                                    <div className="flex-1 space-y-3 w-full max-w-lg">
                                        <h3 className="text-center font-semibold text-blue-500 uppercase tracking-wider text-sm">
                                            Translated ({langName})
                                        </h3>
                                        <div className="rounded-2xl overflow-hidden border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 bg-white dark:bg-slate-950">
                                            <img
                                                src={translatedUrl}
                                                alt="Translated"
                                                className="w-full object-contain"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap justify-center gap-4 pt-4">
                                    <Button
                                        onClick={handleDownload}
                                        className="rounded-full px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Image
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="rounded-full px-8"
                                        onClick={handleReset}
                                    >
                                        Translate Another Image
                                    </Button>
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
            <Footer />
        </div>
    );
};

export default ImageTranslation;


// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import { Upload, ArrowRight, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import { useToast } from '@/components/ui/use-toast';
// import { Header } from '@/components/Header';
// import { Footer } from '@/components/Footer';
// import { PremiumBackground } from '@/components/ui/PremiumBackground';

// const ImageTranslation = () => {
//     const [selectedImage, setSelectedImage] = useState<File | null>(null);
//     const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [result, setResult] = useState<{ original: string; translated: string } | null>(null);
//     const { toast } = useToast();

//     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (e.target.files && e.target.files[0]) {
//             const file = e.target.files[0];
//             if (!file.type.startsWith('image/')) {
//                 toast({
//                     title: "Invalid file type",
//                     description: "Please upload an image file.",
//                     variant: "destructive",
//                 });
//                 return;
//             }
//             setSelectedImage(file);
//             setPreviewUrl(URL.createObjectURL(file));
//             setResult(null);
//         }
//     };

//     const handleGenerate = () => {
//         if (!selectedImage) return;

//         setIsProcessing(true);

//         // Simulate API call/processing
//         setTimeout(() => {
//             setIsProcessing(false);
//             setResult({
//                 original: previewUrl!,
//                 translated: '/mock-translation-result.jpg' // Hardcoded mock image
//             });
//             toast({
//                 title: "Translation Complete",
//                 description: "Your image has been successfully translated.",
//             });
//         }, 5000);
//     };

//     return (
//         <div className="min-h-screen relative bg-background text-foreground transition-colors duration-300">
//             <PremiumBackground />
//             <Header />
//             <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12 relative z-10 space-y-8">

//                 {/* Header Section */}
//                 <div className="text-center space-y-4">
//                     <motion.h1
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
//                     >
//                         AI Image Translation
//                     </motion.h1>
//                     <motion.p
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: 0.1 }}
//                         className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
//                     >
//                         Upload text-heavy images and instantly mock-translate them into your preferred language with our advanced AI.
//                     </motion.p>
//                 </div>

//                 {/* content */}
//                 <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
//                     <CardContent className="p-8 md:p-12">

//                         {!result ? (
//                             <div className="flex flex-col items-center justify-center space-y-8">

//                                 {/* Upload Area */}
//                                 <div className="w-full max-w-xl">
//                                     <label
//                                         htmlFor="image-upload"
//                                         className={`
//                        relative flex flex-col items-center justify-center w-full h-80
//                        border-3 border-dashed rounded-3xl cursor-pointer
//                        transition-all duration-300 ease-in-out
//                        ${previewUrl
//                                                 ? 'border-blue-500/50 bg-blue-50/10'
//                                                 : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/50'
//                                             }
//                      `}
//                                     >
//                                         {previewUrl ? (
//                                             <div className="relative w-full h-full flex items-center justify-center p-2">
//                                                 <img
//                                                     src={previewUrl}
//                                                     alt="Preview"
//                                                     className="max-h-full max-w-full object-contain rounded-2xl shadow-sm"
//                                                 />
//                                                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
//                                                     <p className="text-white font-medium">Click to change</p>
//                                                 </div>
//                                             </div>
//                                         ) : (
//                                             <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
//                                                 <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
//                                                     <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
//                                                 </div>
//                                                 <p className="mb-2 text-xl font-semibold text-slate-700 dark:text-slate-200">
//                                                     Click to upload or drag and drop
//                                                 </p>
//                                                 <p className="text-sm text-slate-500 dark:text-slate-400">
//                                                     SVG, PNG, JPG or GIF (max. 800x400px)
//                                                 </p>
//                                             </div>
//                                         )}
//                                         <input
//                                             id="image-upload"
//                                             type="file"
//                                             className="hidden"
//                                             accept="image/*"
//                                             onChange={handleImageChange}
//                                         />
//                                     </label>
//                                 </div>

//                                 {/* Action Button */}
//                                 <Button
//                                     size="lg"
//                                     onClick={handleGenerate}
//                                     disabled={!selectedImage || isProcessing}
//                                     className="min-w-[200px] h-14 text-lg rounded-full shadow-lg hover:shadow-blue-500/25 transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
//                                 >
//                                     {isProcessing ? (
//                                         <div className="flex items-center gap-2">
//                                             <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                                             Processing...
//                                         </div>
//                                     ) : (
//                                         <div className="flex items-center gap-2">
//                                             <Sparkles className="w-5 h-5" />
//                                             Generate Translation
//                                         </div>
//                                     )}
//                                 </Button>

//                                 {isProcessing && (
//                                     <motion.p
//                                         initial={{ opacity: 0 }}
//                                         animate={{ opacity: 1 }}
//                                         className="text-sm text-slate-500 animate-pulse"
//                                     >
//                                         Analyzing image and translating text...
//                                     </motion.p>
//                                 )}
//                             </div>
//                         ) : (
//                             <div className="space-y-8 animate-in fade-in zoom-in duration-500">
//                                 <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
//                                     {/* Original */}
//                                     <div className="flex-1 space-y-3 w-full max-w-lg">
//                                         <h3 className="text-center font-semibold text-slate-500 uppercase tracking-wider text-sm">Original Image</h3>
//                                         <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg group bg-white dark:bg-slate-950">
//                                             <img
//                                                 src={result.original}
//                                                 alt="Original"
//                                                 className="w-full h-full object-contain"
//                                             />
//                                         </div>
//                                     </div>

//                                     <ArrowRight className="w-8 h-8 text-slate-400 rotate-90 md:rotate-0 flex-shrink-0" />

//                                     {/* Translated */}
//                                     <div className="flex-1 space-y-3 w-full max-w-lg">
//                                         <h3 className="text-center font-semibold text-blue-500 uppercase tracking-wider text-sm">Translated Output</h3>
//                                         <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 group bg-white dark:bg-slate-950">
//                                             <img
//                                                 src={result.translated}
//                                                 alt="Translated"
//                                                 className="w-full h-full object-contain"
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div className="flex justify-center pt-8">
//                                     <Button
//                                         variant="outline"
//                                         className="rounded-full px-8"
//                                         onClick={() => {
//                                             setResult(null);
//                                             setSelectedImage(null);
//                                             setPreviewUrl(null);
//                                         }}
//                                     >
//                                         Translate Another Image
//                                     </Button>
//                                 </div>
//                             </div>
//                         )}

//                     </CardContent>
//                 </Card>
//             </div>
//             <Footer />
//         </div>
//     );
// };

// export default ImageTranslation;
