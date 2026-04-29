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
      className={`inline-flex h-9 items-center gap-2 rounded-md border px-2 text-sm font-medium transition-colors sm:px-3 ${
        isActive
          ? 'border-[#0E109E]/35 bg-[#0E109E]/10 text-[#0E109E]'
          : 'border-border bg-card text-[#0E109E] hover:bg-[#0E109E]/10 hover:text-[#0E109E] active:bg-[#0E109E]/15'
      }`}
      aria-label="Abrir novedades"
    >
      <Newspaper className="h-4 w-4" />
      <span className="hidden sm:inline">Novedades</span>
    </button>
  );
};

export default NewsAccessButton;
