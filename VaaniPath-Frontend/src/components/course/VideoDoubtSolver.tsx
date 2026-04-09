
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, Send, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoDoubtSolverProps {
    videoId: string;
    lang: string;
}

export const VideoDoubtSolver = ({ videoId, lang }: VideoDoubtSolverProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        if (!question.trim()) return;

        setIsSending(true);
        setAnswer(null);

        try {
            // Direct call to n8n webhook as requested
            const response = await fetch('https://zaiddd.app.n8n.cloud/webhook/doubt-solver', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    video_id: videoId,
                    lang: lang,
                    question: question,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get answer');
            }

            // Safely handle both JSON and Text responses
            const textData = await response.text();

            let replyText = "No answer received.";
            try {
                // Try to parse as JSON first
                const data = JSON.parse(textData);

                if (data && typeof data === 'object') {
                    // Check common fields
                    replyText = data.text || data.output || data.answer || data.reply || data.response || JSON.stringify(data);

                    // If it's a specific format where the whole object is relevant but no clear field found
                    // And we just stringified it, maybe try to be cleaner if it's single key
                    if (replyText.startsWith('{') && Object.keys(data).length === 1) {
                        const singleValue = Object.values(data)[0];
                        if (typeof singleValue === 'string') {
                            replyText = singleValue;
                        }
                    }
                } else {
                    // Initial JSON parse wasn't an object (e.g. quoted string "Hello")
                    replyText = String(data);
                }
            } catch (e) {
                // Text response (not JSON)
                replyText = textData;
            }

            setAnswer(replyText);

        } catch (error) {
            console.error('Doubt solver error:', error);
            toast({
                title: 'Error',
                description: 'Failed to get an answer. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSending(false);
        }
    };

    const resetChat = () => {
        setQuestion('');
        setAnswer(null);
    };

    return (
        <Card className="glass-card border-purple-500/20 bg-card/40 backdrop-blur-xl shadow-xl mt-6">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 shadow-inner">
                        <HelpCircle className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                            Ask a Doubt
                        </h3>
                    </div>
                </div>

                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Have a question about this video? Ask our AI assistant instantly.
                </p>

                {!isOpen ? (
                    <Button
                        onClick={() => setIsOpen(true)}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.01]"
                    >
                        Ask a Doubt
                    </Button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                    >
                        {!answer ? (
                            <div className="relative space-y-3">
                                <Textarea
                                    placeholder="Type your question here..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="min-h-[120px] pr-4 resize-none bg-background/50 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all text-base rounded-xl"
                                />
                                <div className="flex justify-end gap-3">
                                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="hover:bg-white/5">
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSend}
                                        disabled={isSending || !question.trim()}
                                        className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25"
                                    >
                                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        Send
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">YOUR QUESTION</p>
                                    <p className="text-foreground text-sm leading-relaxed px-1">{question}</p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/10 rounded-xl p-5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500/50 to-blue-500/50" />

                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                            <HelpCircle className="h-3.5 w-3.5 text-white" />
                                        </div>
                                        <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                                            AI Answer
                                        </span>
                                    </div>
                                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm pl-1">{answer}</p>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={resetChat}
                                    className="w-full border-white/10 hover:bg-white/5 hover:text-purple-400 transition-colors"
                                >
                                    Ask Another Question
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
};
