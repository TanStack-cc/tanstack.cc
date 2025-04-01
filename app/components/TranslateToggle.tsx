import * as React from 'react'
import { twMerge } from 'tailwind-merge'
import { useNavigate } from '@tanstack/react-router'
import { MdTranslate } from 'react-icons/md'

export function TranslateToggle() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  
  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageSelect = (newLang: string) => {
    const currentPath = window.location.pathname
    const currentLang = currentPath.startsWith('/zh') ? 'zh' : 'en'
    const newPath = currentPath.replace(`/${currentLang}`, `/${newLang}`)
    
    navigate({ to: newPath })
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={twMerge(
          'w-10 h-10 flex items-center justify-center',
          'bg-gray-500/10 dark:bg-gray-800 rounded-lg',
          'hover:bg-gray-500/20 dark:hover:bg-gray-700',
          'transition-all duration-200',
          isOpen && 'bg-gray-500/20 dark:bg-gray-700'
        )}
      >
        <MdTranslate className="text-xl" />
      </button>

      {isOpen && (
        <div className={twMerge(
          'absolute bottom-12 right-0',
          'bg-white dark:bg-gray-800',
          'rounded-lg shadow-lg',
          'border border-gray-200 dark:border-gray-700',
          'overflow-hidden'
        )}>
          {[
            { label: 'English', value: 'en' },
            { label: '中文', value: 'zh' }
          ].map((lang) => (
            <button
              key={lang.value}
              onClick={() => handleLanguageSelect(lang.value)}
              className={twMerge(
                'w-full px-4 py-2 text-left',
                'hover:bg-gray-500/10 dark:hover:bg-gray-700',
                'transition-colors duration-200',
                window.location.pathname.startsWith(`/${lang.value}`) &&
                'bg-gray-500/10 dark:bg-gray-700'
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 