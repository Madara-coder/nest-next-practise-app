export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            Trade<span className="text-indigo-600">Flow</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            B2B wholesale ordering for suppliers and their buyers
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
