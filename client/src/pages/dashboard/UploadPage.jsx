import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../../components/ui/Button'
import { documentApi } from '../../api/documentApi'
import { useLanguage } from '../../context/LanguageContext'

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
}

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

const STAGES = [
  'uploading',
  'processing',
  'extracting',
  'analyzing',
  'completed',
]

function ProgressStage({ stage, current }) {
  const { t } = useLanguage()

  const stageKeys = {
    uploading: 'upload.uploading',
    processing: 'upload.processing',
    extracting: 'upload.extracting',
    analyzing: 'upload.analyzing',
    completed: 'upload.completed',
  }

  const idx = STAGES.indexOf(stage)
  const curIdx = STAGES.indexOf(current)

  const done = curIdx > idx
  const active = curIdx === idx

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          done
            ? 'bg-green-500'
            : active
              ? 'bg-primary-600'
              : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        {done ? (
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        ) : (
          <span className="text-xs font-bold text-white">
            {idx + 1}
          </span>
        )}
      </div>

      <span
        className={`text-sm ${
          active
            ? 'font-semibold text-gray-900 dark:text-white'
            : done
              ? 'text-gray-400 line-through'
              : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {t(stageKeys[stage])}
      </span>
    </div>
  )
}

export default function UploadPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [stage, setStage] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const pollingRef = useRef(null)

  // Cleanup polling when component unmounts
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    setFile(null)
    setStage(null)
    setUploadProgress(0)
    setResult(null)
    setError(null)
  }, [])

  const pollStatus = useCallback(async (docId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await documentApi.getStatus(docId)

        const data = res.data?.data || res.data
        const status = (data.status || '').toUpperCase()

        console.log('DOCUMENT STATUS:', status, data)

        if (status === 'PROCESSING') {
          setStage('processing')
        } else if (status === 'EXTRACTING') {
          setStage('extracting')
        } else if (status === 'ANALYZING') {
          setStage('analyzing')
        } else if (status === 'COMPLETED') {
          setStage('completed')
          setResult(data)

          clearInterval(pollingRef.current)
          pollingRef.current = null
        } else if (status === 'FAILED') {
          setError(
            data.error ||
              data.message ||
              'Document processing failed.'
          )

          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      } catch (err) {
        console.error(
          'STATUS ERROR:',
          err.response?.data || err.message
        )

        // Keep polling silently.
      }
    }, 2000)
  }, [])

  const startUpload = useCallback(
    async (selectedFile) => {
      if (!selectedFile) {
        setError('Please select a document file.')
        return
      }

      setError(null)
      setResult(null)
      setStage('uploading')
      setUploadProgress(0)

      // IMPORTANT:
      // Use selectedFile, not the React `file` state.
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Debug
      console.log('Uploading file:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
      })

      try {
        const res = await documentApi.upload(
          formData,
          (event) => {
            if (event.total) {
              const progress = Math.round(
                (event.loaded / event.total) * 100
              )

              setUploadProgress(progress)
            }
          }
        )

        console.log('UPLOAD RESPONSE:', res.data)

        const data = res.data?.data || res.data

        const docId =
          data?._id ||
          data?.id ||
          data?.documentId

        setUploadProgress(100)
        setStage('processing')

        if (docId) {
          pollStatus(docId)
        } else {
          setStage('completed')
          setResult(data)
        }
      } catch (err) {
        console.error('UPLOAD ERROR:', err)

        console.error(
          'SERVER ERROR:',
          JSON.stringify(
            err.response?.data,
            null,
            2
          )
        )

        const serverError = err.response?.data?.error

        const message =
          serverError?.message ||
          err.response?.data?.message ||
          err.message ||
          'Upload failed.'

        setError(message)
        setStage(null)
      }
    },
    [pollStatus]
  )

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections,
  } = useDropzone({
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    multiple: false,
    disabled: !!stage,

    onDropAccepted: (acceptedFiles) => {
      const selectedFile = acceptedFiles[0]

      if (!selectedFile) {
        return
      }

      setFile(selectedFile)

      // Pass the actual selected file directly.
      startUpload(selectedFile)
    },
  })

  const rejected = fileRejections[0]?.errors[0]

  const resultDocId =
    result?._id ||
    result?.id ||
    result?.documentId

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('upload.heading')}
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('upload.sub')}
        </p>
      </div>

      {/* Dropzone */}
      {!stage && (
        <div
          {...getRootProps()}
          className={`
            relative flex flex-col items-center justify-center
            rounded-2xl border-2 border-dashed
            px-8 py-16 cursor-pointer
            transition-all duration-200
            ${
              isDragActive
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950 rounded-2xl flex items-center justify-center mb-5">
            <Upload className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>

          <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            {isDragActive
              ? t('upload.dropHere')
              : t('upload.dropHere')}
          </p>

          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            {t('upload.orClick')}
          </p>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('upload.formats')}
          </p>

          {rejected && (
            <p className="mt-3 text-xs text-red-500">
              {rejected.message}
            </p>
          )}
        </div>
      )}

      {/* Processing */}
      <AnimatePresence>
        {stage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-8"
          >
            {/* File information */}
            {file && (
              <div className="flex items-center gap-3 mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>

                  <p className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {stage !== 'completed' && (
                  <button
                    type="button"
                    onClick={reset}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Upload progress */}
            {stage === 'uploading' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5 text-xs text-gray-500">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>

                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${uploadProgress}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Processing stages */}
            <div className="space-y-4 mb-6">
              {STAGES.map((currentStage) => (
                <ProgressStage
                  key={currentStage}
                  stage={currentStage}
                  current={stage}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />

                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Completed */}
            {stage === 'completed' && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                {resultDocId && (
                  <Button
                    leftIcon={
                      <FileText className="w-4 h-4" />
                    }
                    onClick={() =>
                      navigate(
                        `/dashboard/documents/${resultDocId}`
                      )
                    }
                  >
                    {t('upload.viewDocument')}
                  </Button>
                )}

                <Button
                  variant="secondary"
                  leftIcon={
                    <RefreshCw className="w-4 h-4" />
                  }
                  onClick={reset}
                >
                  {t('upload.uploadAnother')}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}