import { Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getSupplierSectors } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

const DirectoryPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['supplier-sectors'],
    queryFn: getSupplierSectors,
  });
  const totalSuppliers = (data ?? []).reduce((acc, item) => acc + item.count, 0);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] bg-[linear-gradient(110deg,#1f20b7_0%,#3620b6_50%,#6235de_100%)] text-white shadow-[0_18px_44px_rgba(14,16,158,0.16)]">
        <div className="grid gap-6 px-5 py-6 sm:px-8 sm:py-8 md:grid-cols-[1.3fr_0.95fr] md:px-10 md:py-9 lg:px-12">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
              Red de abastecimiento
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white md:text-[3.1rem] md:leading-[1.04]">
              Directorio de proveedores
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/88">
              Selecciona un sector y encuentra proveedores disponibles con una navegacion simple.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <Card className="rounded-[26px] border-0 bg-[#6B49D8] text-white shadow-none">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/78">Sectores</p>
                <p className="mt-3 text-4xl font-bold text-white">{data?.length ?? 0}</p>
                <p className="mt-2 text-sm leading-6 text-white/78">Rubros listos para explorar.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[26px] border-0 bg-[#6B49D8] text-white shadow-none">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/78">Proveedores</p>
                <p className="mt-3 text-4xl font-bold text-white">{totalSuppliers}</p>
                <p className="mt-2 text-sm leading-6 text-white/78">Perfiles organizados por sector.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando sectores...</p>}
      {isError && <p className="text-sm text-destructive">No se pudo cargar el directorio.</p>}

      {!isLoading && !isError && (
        <div id="supplier-sectors" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data ?? []).map((item) => (
            <Link
              key={item.sector}
              to={`/buyer/directory/${encodeURIComponent(item.sector)}`}
              className="rounded-3xl border border-primary/15 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-secondary/25"
            >
              <Building2 className="w-5 h-5 text-[#b2eb4a]" />
              <p className="mt-3 text-lg font-medium text-foreground">{item.sector}</p>
              <p className="text-sm text-muted-foreground">
                {item.count} proveedor(es) en este sector
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectoryPage;
