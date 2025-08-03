import { LoginForm } from '@/components/auth/login-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - SmartStake',
  description: 'Sign in to your SmartStake account to track your betting performance',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">SmartStake</h1>
          <p className="text-slate-400">Welcome back! Sign in to your account.</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-6">
          <LoginForm />
        </div>
        
        <div className="text-center mt-6">
          <p className="text-slate-400 text-sm">
            Don't have an account?{' '}
            <a 
              href="/register" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign up for free trial
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}