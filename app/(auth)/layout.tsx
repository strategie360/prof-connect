export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
          ProfConnect
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          La plateforme des enseignants de l&apos;Éducation nationale
        </p>
      </div>
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {children}
      </div>
    </div>
  )
}
