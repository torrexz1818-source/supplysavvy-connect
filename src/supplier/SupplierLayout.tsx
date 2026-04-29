import { useEffect, useState } from 'react';
import { BookOpen, Bot, BriefcaseBusiness, Building2, ChevronLeft, ChevronRight, FileText, LayoutDashboard, LogOut, Menu, MessageCircle, Newspaper, Shield, Store, Users } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import NotificationBell from '@/components/NotificationBell';
import MessageBell from '@/components/MessageBell';
import NewsAccessButton from '@/components/NewsAccessButton';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const supplierNavItems = [
  { to: '/supplier/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { to: '/supplier/directory', label: 'Directorio de compradores', icon: Building2 },
  { to: '/supplier/sale', label: 'Liquidaciones', icon: FileText },
];

const buyerNavItems = [
  { to: '/buyer/dashboard', label: 'Inicio comprador', icon: LayoutDashboard },
  { to: '/community', label: 'Comunidad', icon: MessageCircle },
  {
    to: '/contenido-educativo',
    label: 'Contenido educativo',
    icon: BookOpen,
    children: [
      { to: '/empleabilidad', label: 'Empleabilidad', icon: BriefcaseBusiness },
      { to: '/nexu-experts', label: 'Nodus Experts', icon: Users },
    ],
  },
  { to: '/buyer/sale', label: 'Liquidaciones', icon: FileText },
  { to: '/nexu-ia', label: 'Nodus IA', icon: Bot },
  { to: '/buyer/directory', label: 'Directorio de proveedores', icon: Building2 },
];

const SupplierLayout = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const roleBadge = isAdmin
    ? {
        label: 'Administrador',
        icon: Shield,
        className: 'bg-destructive/20 border border-destructive/30 text-white/90',
      }
    : {
        label: 'Proveedor',
        icon: Store,
        className: 'bg-[#B2EB4A]/10 border border-[#B2EB4A] text-[#B2EB4A]',
      };

  const navSections = isAdmin
    ? [
        {
          title: 'Administrador',
          items: [
            { to: '/admin/dashboard', label: 'Panel administrativo', icon: Shield },
            { to: '/novedades', label: 'Novedades', icon: Newspaper },
          ],
        },
        { title: 'Comprador', items: buyerNavItems },
        { title: 'Proveedor', items: supplierNavItems },
      ]
    : [{ title: '', items: supplierNavItems }];

  const isActive = (path: string) => {
    if (path === '/supplier/directory') {
      return (
        location.pathname === '/supplier/directory' ||
        location.pathname.startsWith('/supplier/directory/')
      );
    }

    if (path === '/buyer/directory') {
      return (
        location.pathname === '/buyer/directory' ||
        location.pathname.startsWith('/buyer/directory/') ||
        location.pathname.startsWith('/buyer/supplier/')
      );
    }

    if (path === '/community') {
      return location.pathname === '/community' || location.pathname.startsWith('/post/');
    }

    if (path === '/buyer/sale') {
      return location.pathname === '/buyer/sale' || location.pathname.startsWith('/buyer/sale/');
    }

    if (path === '/publicaciones') {
      return (
        location.pathname === '/publicaciones' ||
        location.pathname.startsWith('/publicaciones/')
      );
    }

    if (path === '/supplier/sale') {
      return location.pathname === '/supplier/sale' || location.pathname.startsWith('/supplier/sale/');
    }

    if (path === '/empleabilidad') {
      return location.pathname === '/empleabilidad';
    }

    if (path === '/contenido-educativo') {
      return (
        location.pathname === '/contenido-educativo' ||
        location.pathname.startsWith('/post/') ||
        location.pathname === '/empleabilidad' ||
        location.pathname === '/nexu-experts' ||
        location.pathname.startsWith('/nexu-experts/')
      );
    }

    if (path === '/nexu-ia') {
      return location.pathname === '/nexu-ia' || location.pathname.startsWith('/nexu-ia/');
    }

    return location.pathname === path;
  };

  useEffect(() => {
    const applyResponsiveSidebarState = () => {
      const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

      if (isTablet) {
        setCollapsed(true);
      } else if (isDesktop) {
        setCollapsed(false);
      }
    };

    applyResponsiveSidebarState();
    window.addEventListener('resize', applyResponsiveSidebarState);

    return () => window.removeEventListener('resize', applyResponsiveSidebarState);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderSidebarContent = (onNavigate?: () => void, isCollapsed = false) => (
    <>
      <div className={cn('border-b border-white/15 py-4', isCollapsed ? 'px-2 text-center' : 'px-4')}>
        <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'justify-between gap-3')}>
          <p className={cn('font-bold tracking-tight', isCollapsed ? 'text-sm' : 'text-xl')}>{isCollapsed ? 'BN' : 'BUYER NODUS'}</p>
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 text-white/90 transition-colors hover:bg-white/10 md:inline-flex"
            aria-label={isCollapsed ? 'Expandir menú' : 'Achicar menú'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <span className={cn('mt-3 items-center gap-1 rounded-full text-xs font-medium', roleBadge.className, isCollapsed ? 'inline-flex px-2 py-2' : 'inline-flex px-2.5 py-1')}>
          <roleBadge.icon className="w-3 h-3" />
          {!isCollapsed && roleBadge.label}
        </span>
      </div>

      <nav className={cn('flex-1 space-y-2 overflow-y-auto py-3', isCollapsed ? 'px-2' : 'px-3')}>
        {navSections.map((section) => (
          <div key={section.title || 'default'} className="space-y-0.5">
            {section.title && !isCollapsed && (
              <p className="px-3 pb-1 text-[11px] uppercase tracking-wide text-white/55">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              item.children ? (
                <div key={item.label} className="space-y-1">
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex min-h-11 items-center rounded-lg py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${
                      isActive(item.to)
                        ? isAdmin ? 'sidebar-link-active' : 'supplier-sidebar-link-active'
                        : 'sidebar-link'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="min-w-0 truncate">{item.label}</span>}
                  </NavLink>
                  <div className={cn('space-y-1', isCollapsed ? 'mt-1' : 'ml-4 border-l border-white/10 pl-3')}>
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={onNavigate}
                        title={isCollapsed ? child.label : undefined}
                        className={`flex min-h-11 items-center rounded-lg py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${
                          isActive(child.to)
                            ? isAdmin ? 'sidebar-link-active' : 'supplier-sidebar-link-active'
                            : 'sidebar-link'
                        }`}
                      >
                        <child.icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="min-w-0 truncate">{child.label}</span>}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex min-h-11 items-center rounded-lg py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${
                    isActive(item.to)
                      ? isAdmin ? 'sidebar-link-active' : 'supplier-sidebar-link-active'
                      : 'sidebar-link'
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="min-w-0 truncate">{item.label}</span>}
                </NavLink>
              )
            ))}
          </div>
        ))}
      </nav>

      <div className={cn('mt-auto flex-shrink-0 border-t border-white/10 py-3', isCollapsed ? 'px-2 text-center' : 'px-4')}>
        {!isCollapsed && <p className="text-xs text-white/65">Sesion iniciada</p>}
        <p className={cn('font-medium truncate', isCollapsed ? 'text-xs' : 'text-sm')}>
          {isCollapsed ? (user?.fullName?.slice(0, 2).toUpperCase() ?? 'PR') : (user?.fullName ?? 'Proveedor')}
        </p>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            handleLogout();
          }}
          className={cn('mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/20 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10', isCollapsed ? 'w-11 px-0' : 'w-full px-3')}
          aria-label={isCollapsed ? 'Cerrar sesion' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && 'Cerrar sesion'}
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen app-shell overflow-hidden">
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-screen flex-col overflow-hidden sidebar-shell md:flex',
          collapsed ? 'w-20' : 'w-72',
        )}
        style={{ transition: 'width 0.25s ease' }}
      >
        {renderSidebarContent(undefined, collapsed)}
      </aside>

      <main
        className={cn(
          'h-screen min-w-0 overflow-y-auto',
          collapsed ? 'md:ml-20' : 'md:ml-72',
          'ml-0',
        )}
        style={{ transition: 'margin 0.25s ease' }}
      >
        <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-6 sm:py-6 2xl:max-w-[1440px]">
          <div className="sticky top-3 z-40 mb-5 flex justify-center sm:justify-end">
            <div className="topbar-shell relative flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-3 sm:w-fit sm:gap-3 sm:px-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted md:hidden"
                    aria-label="Abrir menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="sidebar-shell flex w-[86vw] max-w-[320px] flex-col overflow-hidden p-0 text-white">
                  <SheetTitle className="sr-only">Menu principal</SheetTitle>
                  {renderSidebarContent(() => setMobileMenuOpen(false), false)}
                </SheetContent>
              </Sheet>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground sm:hidden">
                {user?.fullName ?? 'Proveedor'}
              </span>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <MessageBell />
              <NotificationBell />
              <NewsAccessButton />
              </div>
            </div>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SupplierLayout;
