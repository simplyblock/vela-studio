import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { editor as monacoEditor } from 'monaco-editor'
import { useRef } from 'react'

interface SqlMonacoEditorProps {
  language?: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  options?: monacoEditor.IStandaloneEditorConstructionOptions
  onRun?: () => void
  onClose?: () => void
  className?: string
}

export default function SqlMonacoEditor({
  language = 'pgsql',
  value,
  onChange,
  autoFocus = false,
  options,
  onRun,
  onClose,
  className,
}: SqlMonacoEditorProps) {
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null)

  const handleMount: OnMount = (editor, monaco: Monaco) => {
    editorRef.current = editor

    if (onRun) {
      editor.addAction({
        id: 'run-query',
        label: 'Run Query',
        keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
        run: () => onRun(),
      })
    }

    if (onClose) {
      editor.addAction({
        id: 'close-editor',
        label: 'Close editor',
        keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyE],
        run: () => onClose(),
      })
    }

    if (autoFocus) {
      editor.focus()
    }
  }

  return (
    <Editor
      theme="supabase"
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      onMount={handleMount}
      options={{
        tabSize: 2,
        fontSize: 13,
        minimap: { enabled: false },
        wordWrap: 'on',
        lineNumbers: 'on',
        folding: false,
        padding: { top: 16 },
        lineNumbersMinChars: 3,
        ...options,
      }}
      className={className}
    />
  )
}