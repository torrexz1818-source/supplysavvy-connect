import { FormEvent, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useParams, useSearchParams } from 'react-router-dom';
import { createConversation, getBuyerById, getBuyersBySector, getConversationByPair, sendConversationMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useHighlight } from '@/hooks/useHighlight';

import { Card, CardContent } from '@/components/ui/card';

const SectorBuyers = () => {
  const navigate = useNavigate();
  const { sector: sectorParam = '' } = useParams();
  const [searchParams] = useSearchParams();
  const sector = decodeURIComponent(sectorParam);
  const { user } = useAuth();
  const highlightedId = searchParams.get('highlight');
  useHighlight(highlightedId);

  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  const buyersQuery = useQuery({
    queryKey: ['buyers-by-sector', sector],
    queryFn: () => getBuyersBySector(sector),
    enabled: Boolean(sector),
  });

  const selectedBuyerQuery = useQuery({
    queryKey: ['buyer-profile', selectedBuyerId],
    queryFn: () => getBuyerById(selectedBuyerId ?? ''),
    enabled: Boolean(selectedBuyerId),
  });

  const selectedBuyer = useMemo(
    () => buyersQuery.data?.find((buyer) => buyer.id === selectedBuyerId) ?? null,
    [buyersQuery.data, selectedBuyerId],
  );

  const onSendMessage = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedBuyerId || !message.trim() || !user?.id) {
      return;
    }

    setIsSending(true);
    setFeedback('');

    try {
      const existing = await getConversationByPair(selectedBuyerId, user.id);
      const conversation = existing ?? await createConversation({
        toUserId: selectedBuyerId,
      });

      await sendConversationMessage(conversation.id, { message: message.trim() });
      setMessage('');
      setContactOpen(false);
      setSelectedBuyerId(null);
      navigate(`/mensajes?conversationId=${conversation.id}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo enviar el mensaje.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-[linear-gradient(110deg,#1f20b7_0%,#3620b6_50%,#6235de_100%)] text-white shadow-[0_18px_44px_rgba(14,16,158,0.16)]">
        <div className="grid gap-6 px-5 py-6 sm:px-8 sm:py-8 md:grid-cols-[1.25fr_0.9fr] md:px-10 md:py-9 lg:px-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Compradores del sector {sector}</h1>
            <p className="mt-3 text-sm text-white/88 md:text-base">
              Revisa perfiles y conecta con compradores activos usando el mismo estilo visual del modulo.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <Card className="border-0 bg-[#6B49D8] text-white shadow-none">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/78">Resultados</p>
                <p className="mt-2 text-3xl font-bold text-white">{buyersQuery.data?.length ?? 0}</p>
                <p className="mt-1 text-sm text-white/78">Compradores cargados para este sector.</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-[#6B49D8] text-white shadow-none">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/78">Sector</p>
                <p className="mt-2 text-lg font-bold text-white">{sector}</p>
                <p className="mt-1 text-sm text-white/78">Vista agrupada para prospeccion comercial.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {buyersQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Cargando compradores...</p>
      )}

      {buyersQuery.isError && (
        <p className="text-sm text-destructive">
          No se pudo cargar el listado de compradores para este sector.
        </p>
      )}

      {!!feedback && (
        <p className="text-sm text-success-foreground bg-success/15 border border-success/25 rounded-md px-3 py-2">
          {feedback}
        </p>
      )}

      <div className="space-y-3">
        {(buyersQuery.data ?? []).map((buyer) => {
          return (
            <article
              id={`item-${buyer.id}`}
              key={buyer.id}
              className="rounded-3xl border border-primary/15 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <p className="text-base font-medium text-foreground">
                  {buyer.name} · {buyer.company}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{buyer.description}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-[#0E109E]/10 text-[#0E109E]">
                    {buyer.sector}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-[#0E109E]/10 text-[#0E109E]">
                    {buyer.location}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full ${
                      buyer.isActiveBuyer
                        ? 'bg-destructive/10 text-destructive border border-destructive/20'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}
                  >
                    {buyer.isActiveBuyer ? 'Comprador activo' : 'Estado pendiente'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBuyerId(buyer.id)}
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60"
                >
                  Ver perfil
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {selectedBuyerId && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-[#0E109E]/35 backdrop-blur-[1px]"
            onClick={() => {
              setSelectedBuyerId(null);
              setContactOpen(false);
            }}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l-4 border-[#0E109E] bg-white p-6 text-[#0E109E] shadow-[-18px_0_42px_rgba(14,16,158,0.18)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#0E109E]/10 pb-4">
              <h2 className="text-xl font-semibold">Perfil del comprador</h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedBuyerId(null);
                  setContactOpen(false);
                }}
                className="rounded-full p-2 text-[#0E109E] transition-colors hover:bg-[#0E109E]/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedBuyerQuery.isLoading && (
              <p className="text-sm text-muted-foreground mt-4">Cargando perfil...</p>
            )}

            {selectedBuyerQuery.isError && (
              <p className="text-sm text-destructive mt-4">No se pudo cargar el perfil.</p>
            )}

            {selectedBuyerQuery.data && (
              <div className="mt-5 space-y-4 rounded-2xl bg-[rgba(14,16,158,0.06)] p-4 shadow-[0_10px_24px_rgba(14,16,158,0.08)]">
                <p className="text-sm leading-6"><span className="font-semibold">Nombre:</span> {selectedBuyerQuery.data.name}</p>
                <p className="text-sm leading-6"><span className="font-semibold">Empresa:</span> {selectedBuyerQuery.data.company}</p>
                <p className="text-sm leading-6"><span className="font-semibold">Sector:</span> {selectedBuyerQuery.data.sector}</p>
                <p className="text-sm"><span className="font-medium">Ubicación:</span> {selectedBuyerQuery.data.location}</p>
                <p className="rounded-2xl bg-white p-4 text-sm leading-6 text-[#0E109E]/80">{selectedBuyerQuery.data.description}</p>

                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="mt-1 inline-flex rounded-full bg-[#B2EB4A] px-5 py-2.5 text-sm font-semibold text-[#0E109E] shadow-[0_10px_20px_rgba(178,235,74,0.22)] transition-colors hover:bg-[#c6f36f]"
                >
                  Contactar
                </button>
              </div>
            )}

            {contactOpen && selectedBuyer && (
              <div className="mt-5 rounded-2xl bg-[rgba(14,16,158,0.06)] p-4 shadow-[0_10px_24px_rgba(14,16,158,0.08)]">
                <h3 className="font-semibold text-sm">Enviar mensaje a {selectedBuyer.company}</h3>
                <form onSubmit={onSendMessage} className="mt-3 space-y-3">
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="w-full min-h-[120px] rounded-2xl border-0 bg-white px-3 py-2 text-sm text-[#0E109E] outline-none shadow-inner focus:ring-2 focus:ring-[rgba(14,16,158,0.18)]"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !message.trim()}
                    className="inline-flex rounded-full bg-[#B2EB4A] px-5 py-2 text-sm font-semibold text-[#0E109E] transition-colors hover:bg-[#c6f36f] disabled:opacity-60"
                  >
                    {isSending ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </form>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default SectorBuyers;
