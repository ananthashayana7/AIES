'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { EngineeringAgent, AgentMessage } from '@/lib/ai/agent';

export default function AgentChat() {
    const { designIntent, setDesignIntent, runAgentSolver, generateGuidance, generateSimulation } = useAppStore();
    const [messages, setMessages] = useState<AgentMessage[]>([
        { role: 'assistant', content: 'I am Jarvis, your Engineering Agent. Describe a part or a problem.', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: AgentMessage = { role: 'user', content: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Process via Agent
        // Simulate network delay for "thinking" feel
        setTimeout(() => {
            const response = EngineeringAgent.process(userMsg.content, designIntent || {
                part_id: 'NEW',
                revision: '0',
                materials: ['Steel S235'],
                parameters: {},
                constraints: [],
                objectives: [],
                acceptance: { max_mass_g: 5000, safety_factor_min: 1.5 }
            });

            // Apply updates
            if (response.intentUpdate) {
                if (designIntent) {
                    setDesignIntent({ ...designIntent, ...response.intentUpdate });
                } else {
                    // Create new intent structure if none exists
                    setDesignIntent({
                        part_id: 'GEN-001',
                        revision: 'A',
                        materials: response.intentUpdate.materials || ['Steel S235'],
                        parameters: response.intentUpdate.parameters || {},
                        constraints: [],
                        objectives: [],
                        acceptance: { max_mass_g: 5000, safety_factor_min: 1.5 },
                        ...response.intentUpdate
                    });
                }
            }

            // Trigger Actions
            if (response.action === 'trigger_solver') {
                runAgentSolver();
            } else if (response.action === 'trigger_simulation') {
                generateSimulation();
                generateGuidance(); // Refresh geometry
            } else if (response.action === 'show_heatmap') {
                useAppStore.getState().setHeatmap(true);
            } else if (response.action === 'trigger_export') {
                window.dispatchEvent(new CustomEvent('EXPORT_STL_REQUESTED', { detail: { filename: designIntent?.part_id || 'design' } }));
            } else if (response.intentUpdate) {
                generateGuidance(); // Refresh geometry for any param change
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.text,
                timestamp: Date.now()
            }]);

            setIsTyping(false);
        }, 800);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="agent-chat">
            <div className="messages" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`message ${m.role}`}>
                        <div className="bubble">
                            {m.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="message assistant">
                        <div className="bubble typing">
                            <span>●</span><span>●</span><span>●</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="input-area">
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Jarvis (e.g. 'Make it lighter', 'Hold 10kN')..."
                />
                <button onClick={handleSend} disabled={isTyping || !input.trim()}>
                    ➤
                </button>
            </div>

            <style jsx>{`
                .agent-chat {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #000;
                    font-family: var(--font-sans);
                }

                .messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .message {
                    display: flex;
                }

                .message.user {
                    justify-content: flex-end;
                }

                .message.assistant {
                    justify-content: flex-start;
                }

                .bubble {
                    max-width: 80%;
                    padding: 10px 14px;
                    font-size: 12px;
                    line-height: 1.4;
                    position: relative;
                }

                .message.user .bubble {
                    background: #222;
                    color: #fff;
                    border-radius: 12px 12px 0 12px;
                }

                .message.assistant .bubble {
                    background: #0a1a2f;
                    color: #5599ff;
                    border: 1px solid #1e3a5f;
                    border-radius: 12px 12px 12px 0;
                }

                .typing {
                    display: flex;
                    gap: 4px;
                    padding: 12px 16px;
                }

                .typing span {
                    animation: blink 1.4s infinite both;
                    font-size: 8px;
                }

                .typing span:nth-child(2) { animation-delay: 0.2s; }
                .typing span:nth-child(3) { animation-delay: 0.4s; }

                @keyframes blink {
                    0% { opacity: 0.2; }
                    20% { opacity: 1; }
                    100% { opacity: 0.2; }
                }

                .input-area {
                    padding: 12px;
                    border-top: 1px solid #1a1a1a;
                    display: flex;
                    gap: 8px;
                    background: #050505;
                }

                textarea {
                    flex: 1;
                    background: #111;
                    border: none;
                    color: #fff;
                    padding: 8px;
                    font-size: 11px;
                    border-radius: 4px;
                    resize: none;
                    height: 40px;
                }

                textarea:focus { outline: none; background: #1a1a1a; }

                button {
                    background: #5599ff;
                    color: #000;
                    border: none;
                    width: 40px;
                    font-size: 14px;
                    cursor: pointer;
                    border-radius: 4px;
                }

                button:hover { background: #77b3ff; }
                button:disabled { background: #222; color: #444; cursor: default; }
            `}</style>
        </div>
    );
}
