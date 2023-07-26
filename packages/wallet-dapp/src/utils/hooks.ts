import { useEffect } from 'react'

/**
 * Determines if click is within current ref
 * @param ref ref to current node (pointer to specific node)
 * @param handler on click handler
 */
export const useOnClickOutside = (ref: React.RefObject<HTMLDivElement>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler()
    }

    document.addEventListener('mousedown', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
    }
  }, [ref, handler])
}
