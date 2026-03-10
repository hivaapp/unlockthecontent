import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Twitter } from 'lucide-react';

export const ContactPage = () => {
    useEffect(() => {
        document.title = "Contact AdGate";
    }, []);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('General Question');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSent(true);
        }, 1000);
    };

    return (
        <div className="w-full min-h-screen bg-bg py-16 px-4">
            <div className="max-w-[500px] mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-[24px] font-black text-text mb-2">Contact Us</h1>
                    <p className="text-[14px] font-bold text-textMid">We typically respond within 24 hours.</p>
                </div>

                <div className="bg-white rounded-[16px] border border-border p-6 shadow-sm mb-8">
                    {isSent ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="text-[48px] mb-4">✅</div>
                            <h2 className="text-[20px] font-black text-success mb-2">Message sent!</h2>
                            <p className="text-[14px] font-bold text-textMid text-center">
                                We'll get back to you at {email} within 24 hours.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-[800] text-textMid uppercase tracking-wide">Your Name</label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-[48px] rounded-[10px] border border-border px-3 text-[14px] focus:outline-none focus:border-brand transition-colors"
                                />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-[800] text-textMid uppercase tracking-wide">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-[48px] rounded-[10px] border border-border px-3 text-[14px] focus:outline-none focus:border-brand transition-colors"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-[800] text-textMid uppercase tracking-wide">Subject</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full h-[48px] rounded-[10px] border border-border px-3 text-[14px] focus:outline-none focus:border-brand transition-colors appearance-none bg-white font-bold"
                                >
                                    <option>General Question</option>
                                    <option>Bug Report</option>
                                    <option>Payout Issue</option>
                                    <option>Custom Sponsor Help</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-[800] text-textMid uppercase tracking-wide">Message</label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full h-[120px] rounded-[10px] border border-border px-3 py-3 text-[14px] focus:outline-none focus:border-brand transition-colors resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-[52px] bg-brand text-white font-black text-[15px] rounded-[14px] mt-2 shadow-sm hover:bg-brand-hover transition-colors flex items-center justify-center disabled:opacity-70"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <h3 className="text-[13px] font-black text-textMid text-center uppercase tracking-wide mb-2">Or reach us directly</h3>
                    
                    <a href="mailto:hello@adgate.io" className="flex items-center gap-4 bg-white border border-border rounded-[14px] px-4 h-[44px] hover:bg-surfaceAlt transition-colors group">
                        <Mail size={18} className="text-textMid group-hover:text-text transition-colors" />
                        <span className="text-[14px] font-bold text-text">hello@adgate.io</span>
                    </a>
                    
                    <a href="#" className="flex items-center gap-4 bg-white border border-border rounded-[14px] px-4 h-[44px] hover:bg-surfaceAlt transition-colors group">
                        <Twitter size={18} className="text-textMid group-hover:text-text transition-colors" />
                        <span className="text-[14px] font-bold text-text">@adgate_io</span>
                    </a>
                    
                    <a href="#" className="flex items-center gap-4 bg-white border border-border rounded-[14px] px-4 h-[44px] hover:bg-surfaceAlt transition-colors group">
                        <MessageSquare size={18} className="text-textMid group-hover:text-text transition-colors" />
                        <span className="text-[14px] font-bold text-text">Join our server</span>
                    </a>
                </div>
            </div>
        </div>
    );
};
