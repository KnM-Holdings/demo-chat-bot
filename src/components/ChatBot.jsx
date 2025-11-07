import React, { useState, useRef, useEffect } from 'react'
import { generateThreadId, createThread, processMessage } from '../services/langgraphService'
import './ChatBot.css'

const ChatBot = () => {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState(null)
    const messagesEndRef = useRef(null)
    const currentStreamingMessageRef = useRef(null)
    const threadIdRef = useRef(null)
    const flagRef = useRef(false)
    const initThreadCalledRef = useRef(false)

    useEffect(() => {
        // Chỉ chạy 1 lần duy nhất
        if (initThreadCalledRef.current) return
        initThreadCalledRef.current = true

        // Flag để tránh gọi nhiều lần
        let isMounted = true

        // Generate thread ID (UUID)
        threadIdRef.current = generateThreadId()

        // Create thread
        const initThread = async () => {
            if (!isMounted) return

            try {
                setError(null) // Clear previous error
                await createThread(threadIdRef.current)
            } catch (error) {
                // Chỉ hiển thị thông báo lỗi đơn giản
                setError('Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối.')
                console.error('Error creating thread:', error)
            }
        }

        initThread()

        // Cleanup function
        return () => {
            isMounted = false
        }
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')
        setIsLoading(true)
        setIsStreaming(true)

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])

        // Add placeholder for bot response
        const botMessageId = `bot-${Date.now()}`
        setMessages(prev => [...prev, { role: 'assistant', content: '', id: botMessageId, streaming: true }])
        currentStreamingMessageRef.current = botMessageId

        try {
            setError(null) // Clear previous error
            await processMessage({
                threadId: threadIdRef.current,
                inputHuman: {
                    messages: [{
                        role: 'human',
                        content: userMessage
                    }]
                },
                onMessage: updateStreamingMessage,
                flagRef: flagRef
            })
        } catch (error) {
            // Chỉ hiển thị thông báo lỗi đơn giản
            setError('Không thể gửi tin nhắn. Vui lòng thử lại.')
            console.error('Error sending message:', error)
            setMessages(prev => prev.map(msg =>
                msg.id === botMessageId
                    ? { ...msg, content: '❌ Không thể gửi tin nhắn. Vui lòng thử lại.', streaming: false }
                    : msg
            ))
        } finally {
            setIsLoading(false)
            setIsStreaming(false)
            // Mark message as not streaming - ẩn cursor
            if (currentStreamingMessageRef.current) {
                const messageId = currentStreamingMessageRef.current
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, streaming: false }
                        : msg
                ))
                currentStreamingMessageRef.current = null
            }
        }
    }


    const updateStreamingMessage = (content) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === currentStreamingMessageRef.current) {
                // Append content if streaming, or replace if new
                return {
                    ...msg,
                    content: msg.streaming ? (msg.content + content) : content,
                    streaming: true
                }
            }
            return msg
        }))
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleDismissError = () => {
        setError(null)
    }

    return (
        <div className="chatbot-container">
            {error && (
                <div className="error-banner">
                    <div className="error-content">
                        <span className="error-icon">⚠️</span>
                        <span className="error-message">{error}</span>
                    </div>
                    <button className="error-dismiss" onClick={handleDismissError}>✕</button>
                </div>
            )}
            <div className="chatbot-header">
                <h1>LangGraph Chatbot</h1>
                <div className="status-indicator">
                    {isStreaming && <span className="pulse">Đang trả lời...</span>}
                </div>
            </div>

            <div className="chatbot-messages">
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <p>Xin chào! Tôi là chatbot. Hãy bắt đầu cuộc trò chuyện.</p>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
                    >
                        <div className="message-content">
                            {message.content}
                            {message.streaming && <span className="cursor">|</span>}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input-container">
                <textarea
                    className="chatbot-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn của bạn..."
                    rows="1"
                    disabled={isLoading}
                />
                <button
                    className="send-button"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                >
                    {isLoading ? '⏳' : '📤'}
                </button>
            </div>
        </div>
    )
}

export default ChatBot

