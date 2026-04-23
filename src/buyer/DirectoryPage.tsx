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
      <section className="overflow-hidden rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,#eef6ff_0%,#ffffff_48%,#f3f9ff_100%)] text-slate-900 shadow-sm">
        <div className="grid gap-4 px-6 py-8 md:grid-cols-[1.25fr_0.9fr] md:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0f2a5e]">Directorio de proveedores</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#4f6b95] md:text-base">
              Selecciona un sector y encuentra proveedores disponibles con una navegacion simple.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <Card className="border-sky-100 bg-white/85 text-slate-900 shadow-none">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-600">Sectores</p>
                <p className="mt-2 text-3xl font-bold">{data?.length ?? 0}</p>
                <p className="mt-1 text-sm text-slate-600">Categorias disponibles para explorar.</p>
              </CardContent>
            </Card>
            <Card className="border-sky-100 bg-white/85 text-slate-900 shadow-none">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-600">Proveedores</p>
                <p className="mt-2 text-3xl font-bold">{totalSuppliers}</p>
                <p className="mt-1 text-sm text-slate-600">Perfiles agrupados por sector.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando sectores...</p>}
      {isError && <p className="text-sm text-destructive">No se pudo cargar el directorio.</p>}

      {!isLoading && !isError && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data ?? []).map((item) => (
            <Link
              key={item.sector}
              to={`/buyer/directory/${encodeURIComponent(item.sector)}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200"
            >
              <Building2 className="w-5 h-5 text-primary" />
              <p className="mt-3 text-lg font-semibold text-foreground">{item.sector}</p>
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
