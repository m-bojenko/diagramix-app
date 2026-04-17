import { type ReactNode, useCallback, useState } from 'react'

import { AppMessageContext, type MessageOptions } from './AppMessageContext'

type MessageState = MessageOptions & {
  cancelLabel?: string
  onResolve: (value: boolean) => void
  type: 'alert' | 'confirm'
}

export function AppMessageProvider({ children }: { children: ReactNode }) {
  const [messageState, setMessageState] = useState<MessageState | null>(null)

  const showMessage = useCallback((options: MessageOptions | string) => {
    const messageOptions = typeof options === 'string' ? { message: options } : options

    return new Promise<void>((resolve) => {
      setMessageState({
        confirmLabel: messageOptions.confirmLabel ?? 'Понятно',
        message: messageOptions.message,
        onResolve: () => resolve(),
        title: messageOptions.title ?? 'Сообщение',
        type: 'alert',
      })
    })
  }, [])

  const confirmMessage = useCallback((options: MessageOptions & { cancelLabel?: string }) => {
    return new Promise<boolean>((resolve) => {
      setMessageState({
        cancelLabel: options.cancelLabel ?? 'Отмена',
        confirmLabel: options.confirmLabel ?? 'Подтвердить',
        message: options.message,
        onResolve: resolve,
        title: options.title ?? 'Подтверждение',
        type: 'confirm',
      })
    })
  }, [])

  const closeMessage = (value: boolean) => {
    if (!messageState) {
      return
    }

    messageState.onResolve(value)
    setMessageState(null)
  }

  return (
    <AppMessageContext.Provider value={{ confirmMessage, showMessage }}>
      {children}
      {messageState ? (
        <div className="app-message-backdrop" role="presentation">
          <section
            className="app-message-dialog"
            role="dialog"
            aria-labelledby="app-message-title"
            aria-modal="true"
          >
            <h2 id="app-message-title">{messageState.title}</h2>
            <p>{messageState.message}</p>
            <div className={messageState.type === 'confirm' ? 'app-message-actions confirm' : 'app-message-actions'}>
              {messageState.type === 'confirm' ? (
                <button className="result-button" type="button" onClick={() => closeMessage(false)}>
                  {messageState.cancelLabel}
                </button>
              ) : null}
              <button
                className="result-button result-button-primary"
                type="button"
                onClick={() => closeMessage(true)}
              >
                {messageState.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AppMessageContext.Provider>
  )
}
