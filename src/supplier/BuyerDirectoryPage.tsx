import {
  Building2,
  Factory,
  HeartPulse,
  Landmark,
  Layers3,
  ShoppingCart,
  Truck,
  Wrench,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getBuyerSectors } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

const sectorIcons: Record<string, typeof Building2> = {
  Retail: ShoppingCart,
  Manufactura: Factory,
  ManufacturaIndustrial: Factory,
  Tecnologia: Layers3,
  Salud: HeartPulse,
  Logistica: Truck,
  Construccion: Wrench,
  Finanzas: Landmark,
  General: Building2,
};

function getSectorIcon(sector: string) {
  const normalized = sector.replace(/\s+/g, '');
  return sectorIcons[sector] ?? sectorIcons[normalized] ?? Building2;
}

const BuyerDirectoryPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['buyer-sectors'],
    queryFn: getBuyerSectors,
  });
  const totalBuyers = (data ?? []).reduce((acc, item) => acc + item.count, 0);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,#eef6ff_0%,#ffffff_48%,#f3f9ff_100%)] text-slate-900 shadow-sm">
        <div className="grid gap-4 px-6 py-8 md:grid-cols-[1.25fr_0.9fr] md:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0f2a5e]">Directorio de compradores</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#4f6b95] md:text-base">
              Explora compradores agrupados por sector con el mismo lenguaje visual del resto del modulo.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <Card className="border-sky-100 bg-white/85 text-slate-900 shadow-none">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-600">Sectores</p>
                <p className="mt-2 text-3xl font-bold">{data?.length ?? 0}</p>
                <p className="mt-1 text-sm text-slate-600">Rubros listos para explorar.</p>
              </CardContent>
            </Card>
            <Card className="border-sky-100 bg-white/85 text-slate-900 shadow-none">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-600">Compradores</p>
                <p className="mt-2 text-3xl font-bold">{totalBuyers}</p>
                <p className="mt-1 text-sm text-slate-600">Perfiles organizados por sector.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando sectores...</div>
      )}

      {isError && (
        <div className="text-sm text-destructive">
          No se pudo cargar el directorio de compradores.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data ?? []).map((item) => {
            const Icon = getSectorIcon(item.sector);

            return (
              <Link
                key={item.sector}
                to={`/supplier/directory/${encodeURIComponent(item.sector)}`}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200"
              >
                <Icon className="w-5 h-5 text-emerald-700" />
                <p className="mt-3 text-lg font-semibold text-foreground">{item.sector}</p>
                <p className="text-sm text-muted-foreground">
                  {item.count} comprador(es) en este sector
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BuyerDirectoryPage;
