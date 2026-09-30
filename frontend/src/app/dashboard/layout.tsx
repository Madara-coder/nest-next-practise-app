import { logout } from '@/app/actions/auth';
import { getCurrentUser } from '@/lib/session';
import { NavLinks } from './nav-links';

export default async function DashboardLayout({
  children,
}: LayoutProps<'/dashboard'>) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="px-5 py-4">
          <p className="text-lg font-bold tracking-tight">
            Trade<span className="text-indigo-600">Flow</span>
          </p>
          <p className="truncate text-xs text-slate-500">{user.tenant?.name}</p>
        </div>
        <NavLinks role={user.role} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
            <p className="text-xs text-slate-500">
              <span className="capitalize">{user.role}</span> · {user.email}
            </p>
          </div>
          <form action={logout}>
            <button className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
              Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
