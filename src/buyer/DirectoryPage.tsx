import { Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getSupplierSectors } from '@/lib/api';

const DirectoryPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['supplier-sectors'],
    queryFn: getSupplierSectors,
  });

  return (
    <div className="space-y-6">
      <section
        className="hero-brand relative overflow-hidden rounded-[28px] p-8 shadow-[var(--shadow-purple)]"
        style={{ background: 'var(--gradient-brand)' }}
      >
        <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute right-24 bottom-[-42px] h-32 w-32 rounded-full bg-secondary/10 blur-2xl" />
        <div className="hero-radial-light pointer-events-none absolute inset-y-0 right-0 w-[42%]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/85">
              Red de abastecimiento
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-primary-foreground lg:text-4xl">
              Directorio de proveedores
            </h1>
            <p className="max-w-xl text-base leading-7 text-primary-foreground/85 lg:text-lg">
              Selecciona un sector y encuentra proveedores disponibles con una navegacion simple.
            </p>
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
              <Building2 className="w-5 h-5 text-success-foreground" />
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
