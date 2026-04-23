import { Newspaper } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const NewsAccessButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === '/novedades';

  return (
    <button
      type="button"
      onClick={() => navigate('/novedades')}
      className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
        isActive
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card hover:bg-muted'
      }`}
    >
      <Newspaper className="h-4 w-4" />
      Novedades
    </button>
  );
};

export default NewsAccessButton;
