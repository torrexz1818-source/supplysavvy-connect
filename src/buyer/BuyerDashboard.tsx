import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getPlatformStats } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { data: platformStats, isLoading: isStatsLoading, isError: isStatsError } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
  });

  const totalSectorUsers = (platformStats?.sectorBreakdown ?? []).reduce((acc, item) => acc + item.count, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[28px] p-8 mb-8 shadow-[0_20px_60px_rgba(33,63,145,0.22)]"
        style={{
          background:
            'linear-gradient(135deg, #1b3474 0%, #2d4ea6 50%, #365dc1 100%)',
        }}
      >
        <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute right-24 bottom-[-42px] h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_62%)]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
              Panel de comprador
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-primary-foreground lg:text-4xl">
              SUPPLY NEXU
            </h1>
            <p className="max-w-xl text-base leading-7 text-primary-foreground/85 lg:text-lg">
              SupplyNexu es una plataforma digital B2B especializada para compradores donde aprenden, comparten experiencias y automatizan sus procesos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:min-w-[240px]">
            <Button
              variant="secondary"
              onClick={() => navigate('/community')}
              className="h-11 rounded-xl bg-white text-[#18306b] font-semibold shadow-sm hover:bg-white/95"
            >
              Comunidad <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-white/20 bg-white/10 text-primary-foreground hover:bg-white/18"
              onClick={() => navigate('/contenido-educativo')}
            >
              <Play className="w-4 h-4 mr-1" /> Ir a contenido educativo
            </Button>
          </div>
        </div>
      </motion.div>

      {isStatsLoading && <p className="text-sm text-muted-foreground mb-6">Cargando estadisticas...</p>}
      {isStatsError && <p className="text-sm text-destructive mb-6">No se pudo cargar el dashboard.</p>}

      {platformStats && (
        <div className="space-y-6 mb-8">
          <section>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Resumen general de la plataforma</p>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total usuarios</p>
                <p className="text-3xl font-bold mt-1">{platformStats.totalUsers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Compradores</p>
                <p className="text-3xl font-bold mt-1">{platformStats.buyers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Proveedores</p>
                <p className="text-3xl font-bold mt-1">{platformStats.suppliers}</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usuarios por sector</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {platformStats.sectorBreakdown.map((item) => {
                  const widthPercent =
                    totalSectorUsers > 0 ? Math.max((item.count / totalSectorUsers) * 100, 2) : 0;

                  return (
                    <div key={item.sector} className="grid grid-cols-[130px_1fr_42px] items-center gap-3">
                      <span className="text-sm text-foreground">{item.sector}</span>
                      <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${widthPercent}%` }} />
                      </div>
                      <span className="text-sm text-foreground text-right">{item.count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ultimos registros</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="py-2 pr-4 font-semibold">Nombre</th>
                      <th className="py-2 pr-4 font-semibold">Empresa</th>
                      <th className="py-2 pr-4 font-semibold">Sector</th>
                      <th className="py-2 pr-0 font-semibold">Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformStats.latestUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border/60">
                        <td className="py-3 pr-4">{user.name}</td>
                        <td className="py-3 pr-4">{user.company}</td>
                        <td className="py-3 pr-4">{user.sector}</td>
                        <td className="py-3 pr-0">
                          <Badge
                            className={
                              user.role === 'buyer'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                : user.role === 'expert'
                                  ? 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            }
                          >
                            {user.role === 'buyer' ? 'Comprador' : user.role === 'expert' ? 'Experto Nexu' : 'Proveedor'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div >
  );
};

export default BuyerDashboard;
