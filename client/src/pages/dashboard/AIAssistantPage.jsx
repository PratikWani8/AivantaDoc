import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, MicOff, MessageSquare, ChevronRight, AlertCircle, Code, Table } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { aiApi } from '../../api/aiApi'
import { useLanguage } from '../../context/LanguageContext'
import { getErrorMessage } from '../../utils/helpers'

let recognition = null
try {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (SpeechRecognition) recognition = new SpeechRecognition()
} catch {}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 space-y-3 ${isUser ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-card'}`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

        {/* SQL */}
        {msg.sql && (
          <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <Code className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">SQL Query</span>
            </div>
            <pre className="p-3 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto bg-gray-50/50 dark:bg-gray-700/30">{msg.sql}</pre>
          </div>
        )}

        {/* Rows table */}
        {msg.rows && msg.rows.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <Table className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{msg.rows.length} rows</span>
            </div>
            <div className="overflow-x-auto max-h-48">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {Object.keys(msg.rows[0] || {}).map(k => (
                      <th key={k} className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {msg.rows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-2 text-gray-700 dark:text-gray-300">{String(v ?? '—')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights */}
        {msg.insights && msg.insights.length > 0 && (
          <ul className="space-y-1">
            {msg.insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                {typeof ins === 'string' ? ins : ins.text || JSON.stringify(ins)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

export default function AIAssistantPage() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const sendQuery = useCallback(async (query) => {
    if (!query.trim()) return
    const userMsg = { id: Date.now(), role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTranscript('')
    setLoading(true)
    try {
      const res = await aiApi.query({ query })
      const data = res.data?.data || res.data
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer || data.response || 'No response.',
        sql: data.sql,
        rows: Array.isArray(data.rows) ? data.rows : [],
        insights: Array.isArray(data.insights) ? data.insights : [],
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: getErrorMessage(err, t('common.error')),
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  }, [t])

  const startVoice = useCallback(() => {
    if (!recognition) return
    const langMap = { en: 'en-US', hi: 'hi-IN', mr: 'mr-IN' }
    const storedLang = localStorage.getItem('aivanta-lang') || 'en'
    recognition.lang = langMap[storedLang] || 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = (e) => {
      const t2 = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(t2)
    }
    recognition.onend = () => setRecording(false)
    recognition.start()
    setRecording(true)
  }, [])

  const stopVoice = useCallback(() => {
    recognition?.stop()
    setRecording(false)
  }, [])

  const suggestions = t('ai.suggestions')

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ai.heading')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('ai.sub')}</p>
      </div>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-6">
              <div className="w-14 h-14 bg-primary-50 dark:bg-primary-950 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">{t('ai.noMessages')}</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 text-center">{t('ai.noMessagesDesc')}</p>
              <div className="flex flex-col gap-2 w-full max-w-md">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendQuery(s)}
                    className="flex items-center gap-2.5 text-left px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-950 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} className="w-2 h-2 rounded-full bg-primary-400"
                      animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }} />
                  ))}
                  <span className="text-xs text-gray-400 ml-2">{t('ai.thinking')}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Transcript preview */}
        {transcript && (
          <div className="mx-4 mb-2 flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-2.5">
            <p className="flex-1 text-sm text-blue-700 dark:text-blue-400">{transcript}</p>
            <button onClick={() => sendQuery(transcript)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
              {t('ai.sendTranscript')}
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-4">
          <form onSubmit={e => { e.preventDefault(); sendQuery(input) }} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
            />
            {recognition && (
              <button
                type="button"
                onClick={recording ? stopVoice : startVoice}
                className={`p-2.5 rounded-xl border transition-colors ${recording ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                aria-label={recording ? t('ai.voiceStop') : t('ai.voiceStart')}
              >
                {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <Button type="submit" disabled={!input.trim() || loading} leftIcon={<Send className="w-4 h-4" />}>
              {t('ai.send')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
