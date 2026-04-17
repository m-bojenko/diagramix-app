import { createContext, useContext } from 'react'

export type MessageOptions = {
  confirmLabel?: string
  message: string
  title?: string
}

export type AppMessageContextValue = {
  confirmMessage: (options: MessageOptions & { cancelLabel?: string }) => Promise<boolean>
  showMessage: (options: MessageOptions | string) => Promise<void>
}

export const AppMessageContext = createContext<AppMessageContextValue | null>(null)

export function useAppMessage() {
  const context = useContext(AppMessageContext)

  if (!context) {
    throw new Error('useAppMessage must be used inside AppMessageProvider')
  }

  return context
}
