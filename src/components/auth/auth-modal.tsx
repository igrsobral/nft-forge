import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Eye, EyeOff, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { login, register, requestPasswordReset } from '@/lib/api/account'
import { addFavorite } from '@/lib/api/commerce'
import { ApiError } from '@/lib/api/errors'
import { safeRedirect } from '@/lib/auth'
import { hrefWithAuth, pickAuth, type AuthMode } from '@/lib/auth-search'

const resumeFavoriteKey = 'nft-market:resume-favorite'

export function rememberFavorite(nftId: string): void {
  sessionStorage.setItem(resumeFavoriteKey, nftId)
}

export function takeFavoriteResume(nftId: string): boolean {
  if (sessionStorage.getItem(resumeFavoriteKey) !== nftId) return false
  sessionStorage.removeItem(resumeFavoriteKey)
  return true
}

export function useOpenAuth() {
  const navigate = useNavigate()
  return (mode: AuthMode, next?: string) => {
    void navigate({ href: hrefWithAuth(mode, next) })
  }
}

const inputClass =
  'h-11 w-full rounded-md border border-[#6a4332] bg-[#140d0a] px-3 text-sm text-foreground outline-none placeholder:text-[#c9a27a]/70 focus:border-primary focus:ring-1 focus:ring-primary'

export function AuthModal() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = useRouterState({
    select: (state) => pickAuth(state.location.search as Record<string, unknown>),
  })
  const mode = search.auth
  const open = Boolean(mode)

  function close() {
    void navigate({ href: hrefWithAuth(null), replace: true })
  }

  function setMode(nextMode: AuthMode) {
    void navigate({ href: hrefWithAuth(nextMode), replace: true })
  }

  async function finish() {
    const pendingFavorite = sessionStorage.getItem(resumeFavoriteKey)
    if (pendingFavorite) {
      sessionStorage.removeItem(resumeFavoriteKey)
      try {
        await addFavorite(pendingFavorite)
      } catch {
        sessionStorage.setItem(resumeFavoriteKey, pendingFavorite)
      }
    }
    await queryClient.invalidateQueries({ queryKey: ['session'] })
    await queryClient.invalidateQueries({ queryKey: ['cart'] })
    await queryClient.invalidateQueries({ queryKey: ['favorites'] })
    if (search.next) {
      window.location.assign(safeRedirect(search.next))
      return
    }
    close()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/75"
        className="gap-0 border-b-4 border-primary bg-[#24140f] p-0 text-foreground sm:max-w-[420px] max-lg:!inset-0 max-lg:!h-[100dvh] max-lg:!max-h-none max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:overflow-y-auto max-lg:!rounded-none max-lg:!border-0 max-lg:!bg-[#140d0a]"
        aria-describedby={undefined}
      >
        {mode ? (
          <AuthPanel mode={mode} onMode={setMode} onClose={close} onSuccess={() => void finish()} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function AuthPanel({
  mode,
  onMode,
  onClose,
  onSuccess,
}: {
  mode: AuthMode
  onMode: (mode: AuthMode) => void
  onClose: () => void
  onSuccess: () => void
}) {
  return (
    <div className="relative px-6 pt-6 pb-7">
      <p className="mb-6 text-center text-sm font-bold tracking-[0.2em] lg:hidden">KURIO</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-4 right-4 flex size-11 items-center justify-center text-[#c9a27a] hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <div className="mb-4 hidden items-center justify-center gap-3 lg:flex">
        <button
          type="button"
          aria-pressed={mode === 'login' || mode === 'forgot'}
          className={
            mode === 'login' || mode === 'forgot'
              ? 'font-bold text-primary'
              : 'text-foreground hover:text-primary'
          }
          onClick={() => onMode('login')}
        >
          Entrar
        </button>
        <span aria-hidden className="h-4 w-px bg-[#6a4332]" />
        <button
          type="button"
          aria-pressed={mode === 'signup'}
          className={
            mode === 'signup' ? 'font-bold text-primary' : 'text-foreground hover:text-primary'
          }
          onClick={() => onMode('signup')}
        >
          Criar conta
        </button>
      </div>
      <DialogTitle className="sr-only">
        {mode === 'signup' ? 'Criar conta' : mode === 'forgot' ? 'Redefinir senha' : 'Entrar'}
      </DialogTitle>
      {mode === 'signup' ? (
        <SignupForm onSuccess={onSuccess} />
      ) : mode === 'forgot' ? (
        <ForgotForm onBack={() => onMode('login')} />
      ) : (
        <LoginForm onForgot={() => onMode('forgot')} onSuccess={onSuccess} />
      )}
      {mode === 'login' ? (
        <button
          type="button"
          aria-label="Criar conta"
          className="mt-6 min-h-11 w-full text-center text-sm text-[#c9a27a] lg:hidden"
          onClick={() => onMode('signup')}
        >
          Novo na Kurio? <span className="text-primary">Crie uma conta</span>
        </button>
      ) : null}
      {mode === 'signup' ? (
        <button
          type="button"
          aria-label="Entrar"
          className="mt-6 min-h-11 w-full text-center text-sm text-[#c9a27a] lg:hidden"
          onClick={() => onMode('login')}
        >
          Já tem uma conta? <span className="text-primary">Entre</span>
        </button>
      ) : null}
    </div>
  )
}

function LoginForm({ onForgot, onSuccess }: { onForgot: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [pending, setPending] = useState(false)
  const field = (path: string) => error?.details.find((item) => item.path === path)?.message

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setPending(true)
        setError(null)
        void login({ email, password })
          .then(() => onSuccess())
          .catch((caught: unknown) => {
            setError(caught instanceof ApiError ? caught : null)
            setPending(false)
          })
      }}
    >
      <DialogDescription className="text-center text-[#c9a27a]">
        Entre para gerenciar sua carteira, coleção e perfil de criador.
      </DialogDescription>
      <Field id="login-email" label="E-mail" error={field('email')}>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          placeholder="contato@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
          aria-invalid={field('email') ? true : undefined}
          aria-describedby={field('email') ? 'login-email-error' : undefined}
        />
      </Field>
      <Field id="login-password" label="Senha" error={field('password')}>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          shown={show}
          onToggle={() => setShow((value) => !value)}
          onChange={setPassword}
          describedBy={field('password') ? 'login-password-error' : undefined}
          invalid={Boolean(field('password'))}
        />
      </Field>
      <div className="flex justify-end">
        <button type="button" className="text-sm text-primary hover:underline" onClick={onForgot}>
          Esqueceu a senha?
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-primary font-bold text-primary-foreground disabled:opacity-60"
      >
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
      <SocialRow />
    </form>
  )
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [pending, setPending] = useState(false)
  const field = (path: string) => error?.details.find((item) => item.path === path)?.message

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setPending(true)
        setError(null)
        void register({ username, email, password, confirmPassword })
          .then(() => onSuccess())
          .catch((caught: unknown) => {
            setError(caught instanceof ApiError ? caught : null)
            setPending(false)
          })
      }}
    >
      <DialogDescription className="text-center text-[#c9a27a]">
        Crie seu perfil de colecionador e conecte uma carteira quando quiser.
      </DialogDescription>
      <Field id="signup-username" label="Nome de usuário" error={field('username')}>
        <input
          id="signup-username"
          autoComplete="username"
          placeholder="Nome de usuário"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field id="signup-email" label="E-mail" error={field('email')}>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field id="signup-password" label="Senha" error={field('password')}>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          placeholder="Senha"
          value={password}
          shown={show}
          onToggle={() => setShow((value) => !value)}
          onChange={setPassword}
        />
      </Field>
      <Field id="signup-confirm" label="Confirmar senha" error={field('confirmPassword')}>
        <PasswordInput
          id="signup-confirm"
          autoComplete="new-password"
          placeholder="Confirmar senha"
          value={confirmPassword}
          shown={show}
          onToggle={() => setShow((value) => !value)}
          onChange={setConfirmPassword}
        />
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-primary font-bold text-primary-foreground disabled:opacity-60"
      >
        {pending ? 'Criando…' : 'Criar conta'}
      </button>
      <SocialRow />
    </form>
  )
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setPending(true)
        setError(null)
        void requestPasswordReset(email)
          .then(() => {
            toast.success('Se o e-mail existir, enviaremos um link para redefinir a senha.')
            onBack()
          })
          .catch((caught: unknown) => {
            setError(caught instanceof ApiError ? caught : null)
            setPending(false)
          })
      }}
    >
      <DialogDescription className="text-center text-[#c9a27a]">
        Informe o e-mail da conta. A demo só confirma o pedido, sem enviar uma mensagem real.
      </DialogDescription>
      <Field
        id="forgot-email"
        label="E-mail"
        error={error?.details.find((item) => item.path === 'email')?.message}
      >
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-primary font-bold text-primary-foreground disabled:opacity-60"
      >
        {pending ? 'Enviando…' : 'Enviar link'}
      </button>
      <button type="button" className="text-sm text-primary hover:underline" onClick={onBack}>
        Voltar para entrar
      </button>
    </form>
  )
}

function SocialRow() {
  return (
    <div className="mt-2 grid gap-2">
      <p className="text-center text-xs tracking-wide text-[#c9a27a] uppercase">Ou continue com</p>
      <SocialButton label="Continuar com Google" />
      <SocialButton label="Continuar com Facebook" />
    </div>
  )
}

function SocialButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex h-11 items-center justify-center gap-2 rounded-md border border-[#6a4332] text-sm text-foreground hover:border-primary"
      onClick={() => toast.error('Não disponível na demo.')}
    >
      <span aria-hidden className="text-xs font-bold text-primary">
        {label.includes('Google') ? 'G' : 'f'}
      </span>
      {label}
    </button>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1 text-left">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function PasswordInput({
  id,
  value,
  shown,
  placeholder,
  autoComplete,
  describedBy,
  invalid,
  onChange,
  onToggle,
}: {
  id: string
  value: string
  shown: boolean
  placeholder: string
  autoComplete: string
  describedBy?: string
  invalid?: boolean
  onChange: (value: string) => void
  onToggle: () => void
}) {
  return (
    <span className="relative block">
      <input
        id={id}
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} pr-11`}
      />
      <button
        type="button"
        aria-label={shown ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={onToggle}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-[#c9a27a]"
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </span>
  )
}
