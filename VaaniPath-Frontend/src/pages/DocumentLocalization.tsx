import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, ArrowRight, Sparkles, Download, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PremiumBackground } from '@/components/ui/PremiumBackground';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const SOURCE_LANGUAGES = [
    { code: 'auto', name: 'Auto Detect' },
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
];

const TARGET_LANGUAGES = [
    { code: 'hi', name: 'Hindi (हिंदी)' },
    { code: 'mr', name: 'Marathi (मराठी)' },
];

const API_BASE = 'http://localhost:8000/api/v1/document-translator';

export interface TranslationHistory {
    id: string;
    fileName: string;
    language: string;
    date: string;
    status: string;
    blobUrl: string;
}

const DocumentLocalization = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sourceLang, setSourceLang] = useState<string>('auto');
    const [targetLang, setTargetLang] = useState<string>('hi');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [history, setHistory] = useState<TranslationHistory[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const stored = localStorage.getItem('doc_translations');
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse doc_translations", e);
            }
        }
    }, []);

    const saveToHistory = (newItem: TranslationHistory) => {
        const updated = [newItem, ...history].slice(0, 10);
        setHistory(updated);
        localStorage.setItem('doc_translations', JSON.stringify(updated));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                setErrorMsg("Please upload a PDF file.");
                return;
            }
            if (file.size > 20 * 1024 * 1024) {
                setErrorMsg("File size exceeds 20 MB limit.");
                return;
            }
            setSelectedFile(file);
            setErrorMsg(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setErrorMsg("Please upload a PDF file.");
                return;
            }
            if (file.size > 20 * 1024 * 1024) {
                setErrorMsg("File size exceeds 20 MB limit.");
                return;
            }
            setSelectedFile(file);
            setErrorMsg(null);
        }
    };

    const triggerDownload = (url: string, filename: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleGenerate = async () => {
        if (!selectedFile) return;

        setIsProcessing(true);
        setErrorMsg(null);

        try {
            const formData = new FormData();
            formData.append('document', selectedFile);
            formData.append('target_language', targetLang);
            formData.append('source_language', sourceLang);

            const response = await fetch(`${API_BASE}/translate`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(err.detail || 'Translation failed');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const originalName = selectedFile.name.replace(/\.[^/.]+$/, "");
            const langSuffix = targetLang === 'hi' ? 'hindi' : 'marathi';
            const newFileName = `${originalName}_translated_${langSuffix}.pdf`;

            triggerDownload(url, newFileName);

            toast({
                title: "Translation Complete!",
                description: `Document successfully translated to ${TARGET_LANGUAGES.find(l => l.code === targetLang)?.name}.`,
            });
            
            // Save to history
            saveToHistory({
                id: Date.now().toString(),
                fileName: newFileName,
                language: TARGET_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang,
                date: new Date().toLocaleString(),
                status: 'Success',
                blobUrl: url
            });

        } catch (error: any) {
            setErrorMsg(error.message || "Something went wrong. Please try again.");
            toast({
                title: "Translation Failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

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
                        Document Localization
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
                    >
                        Upload any PDF and get it translated to Hindi or Marathi, preserving the original layout
                    </motion.p>
                </div>

                <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                        <div className="flex flex-col items-center justify-center space-y-8">
                            
                            {/* Upload Area */}
                            <div className="w-full max-w-xl">
                                <label
                                    htmlFor="document-upload"
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    className={`
                                        relative flex flex-col items-center justify-center w-full h-64
                                        border-2 border-dashed rounded-3xl cursor-pointer
                                        transition-all duration-300 ease-in-out
                                        ${selectedFile
                                            ? 'border-blue-500/50 bg-blue-50/10 dark:bg-blue-900/10'
                                            : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/50'
                                        }
                                    `}
                                >
                                    {selectedFile ? (
                                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                                            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-700 dark:text-slate-200">{selectedFile.name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity rounded-3xl">
                                                <p className="text-slate-800 dark:text-white font-medium bg-white/80 dark:bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Click to change file</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 space-y-4">
                                            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                                                    Drop your PDF here, or click to browse
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                                    Supports any PDF · Max 20 MB
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        id="document-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                    />
                                </label>

                                {errorMsg && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 flex items-center gap-2 text-destructive font-medium bg-destructive/10 p-3 rounded-lg"
                                    >
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{errorMsg}</span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Options Row */}
                            <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-2xl justify-center pt-2">
                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Source Language
                                    </label>
                                    <select 
                                        value={sourceLang}
                                        onChange={(e) => setSourceLang(e.target.value)}
                                        className="h-12 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {SOURCE_LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <ArrowRight className="w-6 h-6 text-slate-400 hidden sm:block mt-6" />

                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Translate To
                                    </label>
                                    <select 
                                        value={targetLang}
                                        onChange={(e) => setTargetLang(e.target.value)}
                                        className="h-12 px-4 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    >
                                        {TARGET_LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <Button
                                size="lg"
                                onClick={handleGenerate}
                                disabled={!selectedFile || isProcessing}
                                className="min-w-[240px] h-14 text-lg rounded-full shadow-lg hover:shadow-blue-500/25 transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 mt-4"
                            >
                                {isProcessing ? (
                                    <div className="flex items-center gap-2">
                                        <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Translating...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        Translate Document
                                    </div>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Translations Section */}
                <div className="pt-8 w-full max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <FileText className="w-6 h-6 text-purple-500" />
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Recent Translations</h2>
                    </div>
                    
                    <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm overflow-hidden">
                        {history.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 border-b-slate-200 dark:bg-slate-800/50 dark:border-b-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <TableHead className="font-semibold px-4">File name</TableHead>
                                            <TableHead className="font-semibold">Language</TableHead>
                                            <TableHead className="font-semibold">Date & Time</TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                            <TableHead className="font-semibold text-right px-4">Download</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((item) => (
                                            <TableRow key={item.id} className="border-b-slate-100 dark:border-b-slate-800/50">
                                                <TableCell className="font-medium px-4">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-slate-400" />
                                                        <span className="truncate max-w-[200px] block" title={item.fileName}>
                                                            {item.fileName}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.language}</TableCell>
                                                <TableCell className="text-slate-500 dark:text-slate-400 text-sm">{item.date}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        {item.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right px-4">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => triggerDownload(item.blobUrl, item.fileName)}
                                                        className="h-8 w-8 p-0"
                                                        title="Download again"
                                                    >
                                                        <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                                <p>No translations yet</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DocumentLocalization;
