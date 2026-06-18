import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { Badge } from '../types/badge';

interface BadgeNotificationProps {
    badge: Badge | null;
    onClose: () => void;
}

export function BadgeNotification({ badge, onClose }: BadgeNotificationProps) {
    useEffect(() => {
        if (badge) {
            const timer = setTimeout(() => {
                onClose();
            }, 8000); 
            return () => clearTimeout(timer);
        }
    }, [badge, onClose]);

    if (!badge) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
            >
                <Card className="p-6 shadow-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50">
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X className="size-4 text-gray-500" />
                    </button>
                    <div className="flex items-start gap-4">
                        <div className="size-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                            {badge.iconUrl ? (
                                <img src={badge.iconUrl} alt={badge.name} className="size-8 object-contain" />
                            ) : (
                                <Trophy className="size-8 text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">New Badge Unlocked!</span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg">{badge.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                            <Button
                                variant="link"
                                className="p-0 h-auto text-indigo-600 mt-2"
                                onClick={() => {
                                    onClose();
                                    const settingsTab = document.querySelector('[value="badges"]') as HTMLElement;
                                    if (settingsTab) settingsTab.click();
                                }}
                            >
                                View in Settings →
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}