import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function VerifyPage() {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
          <Mail className="w-7 h-7 text-blue-600" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        Vérifiez votre email
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Un lien de confirmation a été envoyé à votre adresse email professionnelle.
        Cliquez sur ce lien pour activer votre compte.
      </p>

      <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-left space-y-1 mb-6">
        <p>• Vérifiez votre boîte de réception et vos spams</p>
        <p>• Le lien expire dans 24 heures</p>
        <p>• Il peut prendre quelques minutes à arriver</p>
      </div>

      <Link
        href="/login"
        className="text-sm text-blue-600 hover:underline"
      >
        Retour à la connexion
      </Link>
    </div>
  )
}
