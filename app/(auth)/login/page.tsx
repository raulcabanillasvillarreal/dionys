import { LoginForm } from '@/components/shared/login-form'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dionys CRM</h1>
          <p className="text-gray-500 mt-1 text-sm">Sistema de gestión corporativa</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Iniciar sesión</h2>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Hotel · Importaciones · Club
        </p>
      </div>
    </main>
  )
}
