import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Link2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createExpertAppointment,
  getExpertAvailability,
  getExpertProfile,
  getExperts,
  getMyExpertAvailabilitySettings,
  getMyExpertAppointments,
  getMyExpertCalendarConnection,
  updateMyExpertAvailabilitySettings,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ExpertWeeklyAvailabilityItem } from '@/types';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getTomorrowInputValue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

const TIME_OPTIONS = Array.from({ length: 15 }, (_, index) =>
  `${String(index + 6).padStart(2, '0')}:00`,
);
const EMPTY_WEEKLY_AVAILABILITY: ExpertWeeklyAvailabilityItem[] = [
  { day: 'Lunes', enabled: true, slots: [{ id: 'lunes-1', startTime: '09:00', endTime: '17:00' }] },
  { day: 'Martes', enabled: true, slots: [{ id: 'martes-1', startTime: '09:00', endTime: '17:00' }] },
  { day: 'Miercoles', enabled: true, slots: [{ id: 'miercoles-1', startTime: '09:00', endTime: '17:00' }] },
  { day: 'Jueves', enabled: true, slots: [{ id: 'jueves-1', startTime: '09:00', endTime: '17:00' }] },
  { day: 'Viernes', enabled: true, slots: [{ id: 'viernes-1', startTime: '09:00', endTime: '17:00' }] },
  { day: 'Sabado', enabled: false, slots: [{ id: 'sabado-1', startTime: '09:00', endTime: '13:00' }] },
  { day: 'Domingo', enabled: false, slots: [{ id: 'domingo-1', startTime: '09:00', endTime: '13:00' }] },
];

const NexuExperts = () => {
  const navigate = useNavigate();
  const { id: routeExpertId } = useParams();
  const queryClient = useQueryClient();
  const { user, refreshMe } = useAuth();
  const [selectedExpertId, setSelectedExpertId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(getTomorrowInputValue);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [lastCreatedId, setLastCreatedId] = useState<string>('');
  const [weeklyAvailability, setWeeklyAvailability] = useState<ExpertWeeklyAvailabilityItem[]>(
    EMPTY_WEEKLY_AVAILABILITY,
  );
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isMeetingsOpen, setIsMeetingsOpen] = useState(true);

  const expertsQuery = useQuery({
    queryKey: ['experts'],
    queryFn: getExperts,
  });

  const appointmentsQuery = useQuery({
    queryKey: ['experts', 'appointments', 'mine'],
    queryFn: getMyExpertAppointments,
  });
  const myCalendarConnectionQuery = useQuery({
    queryKey: ['experts', 'me', 'calendar'],
    queryFn: getMyExpertCalendarConnection,
    enabled: Boolean(user),
  });
  const myAvailabilityQuery = useQuery({
    queryKey: ['experts', 'me', 'availability'],
    queryFn: getMyExpertAvailabilitySettings,
    enabled: user?.role === 'expert',
  });

  const expertProfileQuery = useQuery({
    queryKey: ['experts', selectedExpertId],
    queryFn: () => getExpertProfile(selectedExpertId),
    enabled: Boolean(selectedExpertId),
  });

  const availabilityQuery = useQuery({
    queryKey: ['experts', selectedExpertId, 'availability', selectedDate],
    queryFn: () => getExpertAvailability(selectedExpertId, selectedDate),
    enabled: Boolean(selectedExpertId && selectedDate),
  });

  useEffect(() => {
    if (routeExpertId) {
      setSelectedExpertId(routeExpertId);
      return;
    }

    if (!selectedExpertId && expertsQuery.data?.length) {
      setSelectedExpertId(expertsQuery.data[0].id);
    }
  }, [expertsQuery.data, routeExpertId, selectedExpertId]);

  useEffect(() => {
    setSelectedSlot('');
  }, [selectedDate, selectedExpertId]);

  useEffect(() => {
    if (myAvailabilityQuery.data?.weeklyAvailability?.length) {
      setWeeklyAvailability(myAvailabilityQuery.data.weeklyAvailability);
    }
  }, [myAvailabilityQuery.data]);

  const createAppointmentMutation = useMutation({
    mutationFn: createExpertAppointment,
    onSuccess: (result) => {
      setLastCreatedId(result.appointment.id);
      setTopic('');
      setSelectedSlot('');
      queryClient.invalidateQueries({ queryKey: ['experts', 'appointments', 'mine'] });
      queryClient.invalidateQueries({
        queryKey: ['experts', selectedExpertId, 'availability', selectedDate],
      });
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      queryClient.invalidateQueries({ queryKey: ['experts', selectedExpertId] });

      toast({
        title: 'Cita confirmada',
        description: result.emailWarning
          ? `La cita se creo, pero hubo un problema con el correo: ${result.emailWarning}`
          : 'La reunion ya fue creada con Google Calendar y Google Meet.',
      });
    },
    onError: (error) => {
      toast({
        title: 'No se pudo agendar',
        description: error instanceof Error ? error.message : 'Ocurrio un error inesperado.',
        variant: 'destructive',
      });
    },
  });
  const saveAvailabilityMutation = useMutation({
    mutationFn: updateMyExpertAvailabilitySettings,
    onSuccess: async (result) => {
      setWeeklyAvailability(result.weeklyAvailability);
      await refreshMe();
      queryClient.invalidateQueries({ queryKey: ['experts', 'me', 'availability'] });
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      queryClient.invalidateQueries({ queryKey: ['experts', user?.id] });
      toast({
        title: 'Disponibilidad actualizada',
        description: 'Tus dias y horarios ya estan visibles para los compradores.',
      });
    },
    onError: (error) => {
      toast({
        title: 'No se pudo guardar la disponibilidad',
        description: error instanceof Error ? error.message : 'Ocurrio un error inesperado.',
        variant: 'destructive',
      });
    },
  });

  const selectedExpert = expertsQuery.data?.find((expert) => expert.id === selectedExpertId);
  const dashboardItems = useMemo(() => appointmentsQuery.data?.items ?? [], [appointmentsQuery.data]);
  const isBuyer = user?.role === 'buyer';
  const isExpert = user?.role === 'expert';
  const isDetailView = Boolean(routeExpertId);
  const calendarConnected = Boolean(myCalendarConnectionQuery.data?.connected);
  const orderedMeetings = useMemo(() => {
    if (!dashboardItems.length) {
      return [];
    }

    if (!lastCreatedId) {
      return dashboardItems;
    }

    const latestCreated = dashboardItems.find((item) => item.id === lastCreatedId);
    const remaining = dashboardItems.filter((item) => item.id !== lastCreatedId);
    return latestCreated ? [latestCreated, ...remaining] : dashboardItems;
  }, [dashboardItems, lastCreatedId]);
  const handleAvailabilityChange = (
    day: string,
    key: 'enabled',
    value: boolean,
  ) => {
    setWeeklyAvailability((current) =>
      current.map((item) => (item.day === day ? { ...item, [key]: value } : item)),
    );
  };
  const handleSlotChange = (
    day: string,
    slotId: string,
    key: 'startTime' | 'endTime',
    value: string,
  ) => {
    setWeeklyAvailability((current) =>
      current.map((item) =>
        item.day === day
          ? {
              ...item,
              slots: item.slots.map((slot) =>
                slot.id === slotId ? { ...slot, [key]: value } : slot,
              ),
            }
          : item,
      ),
    );
  };
  const addSlot = (day: string) => {
    setWeeklyAvailability((current) =>
      current.map((item) =>
        item.day === day
          ? {
              ...item,
              enabled: true,
              slots: [
                ...item.slots,
                {
                  id: `${day.toLowerCase()}-${crypto.randomUUID()}`,
                  startTime: '09:00',
                  endTime: '13:00',
                },
              ],
            }
          : item,
      ),
    );
  };
  const removeSlot = (day: string, slotId: string) => {
    setWeeklyAvailability((current) =>
      current.map((item) =>
        item.day === day
          ? {
              ...item,
              slots:
                item.slots.length > 1
                  ? item.slots.filter((slot) => slot.id !== slotId)
                  : item.slots,
            }
          : item,
      ),
    );
  };
  const formatBuyerView = (item: ExpertWeeklyAvailabilityItem) => {
    if (!item.enabled || !item.slots.length) {
      return `${item.day}: no disponible`;
    }

    return `${item.day}: ${item.slots
      .map((slot) => `${slot.startTime} - ${slot.endTime}`)
      .join(' | ')}`;
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-[linear-gradient(135deg,#eef6ff_0%,#ffffff_38%,#e6f4ff_100%)]">
        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.4fr_0.9fr] lg:px-8">
          <div>
            <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">
              NEXU EXPERTS
            </Badge>
            <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Conecta con expertos del sector
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Descubre perfiles completos, valida disponibilidad en tiempo real, agenda tu cita y
              genera automaticamente tu reunion en Google Meet, con confirmacion directa a tu
              correo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="border-white/70 bg-white/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Expertos activos</CardDescription>
                <CardTitle className="text-3xl text-slate-900">
                  {expertsQuery.data?.length ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-white/70 bg-white/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription>Tus citas programadas</CardDescription>
                <CardTitle className="text-3xl text-slate-900">{dashboardItems.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-6">
        <Card className="overflow-hidden border-sky-100 bg-[linear-gradient(135deg,#eef6ff_0%,#ffffff_52%,#f4f9ff_100%)] text-slate-900 shadow-sm">
          <CardHeader>
            <CardDescription className="text-[#4f6b95]">Sincronizacion</CardDescription>
            <CardTitle className="text-xl text-[#0f2a5e]">Google Calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-[#cfe0ff] bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_65%,#edf5ff_100%)] p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  {calendarConnected ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e7ff] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2f6fed]">
                      <Sparkles className="h-3.5 w-3.5" />
                      Sincronizacion activa
                    </div>
                  ) : null}
                  <div>
                    <p className="text-lg font-semibold text-[#0f2a5e]">
                      Reuniones conectadas con Google Calendar
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#38527a]">
                      Cada cita crea el evento en Google Calendar y deja lista la sincronizacion para comprador y experto.
                    </p>
                  </div>
                </div>

                {isBuyer && !calendarConnected ? (
                  <button
                    type="button"
                    onClick={() => navigate('/calendar-setup')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f6ea8] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0d5f90]"
                  >
                    <Link2 className="h-4 w-4" />
                    Conecta tu Google calendario para poder agendar
                  </button>
                ) : null}
              </div>
            </div>

            {orderedMeetings.length ? (
              <div className="rounded-2xl border border-[#bfd6ff] bg-[#eef5ff] p-4">
                <button
                  type="button"
                  onClick={() => setIsMeetingsOpen((current) => !current)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#1a4fa3]">
                      <CheckCircle2 className="h-4 w-4" />
                      Mis reuniones
                    </div>
                    <p className="mt-1 text-sm text-[#0f2a5e]">
                      {orderedMeetings.length} reuniones guardadas en la plataforma
                    </p>
                  </div>
                  <ChevronDown
                    className={`mt-0.5 h-5 w-5 text-[#1a4fa3] transition-transform ${
                      isMeetingsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isMeetingsOpen ? (
                  <div className="mt-3 grid gap-3">
                    {orderedMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="rounded-2xl border border-[#d6e4fb] bg-white/80 p-4"
                      >
                        <div className="grid gap-2">
                          <p className="text-sm text-[#38527a]">Experto: {meeting.expertName}</p>
                          <p className="text-sm text-[#38527a]">Comprador: {meeting.buyerName}</p>
                          <p className="text-sm text-[#38527a]">
                            Fecha: {formatDateTime(meeting.startsAt)}
                          </p>
                          <p className="text-sm text-[#38527a]">Tema: {meeting.topic}</p>
                          <p className="text-sm text-[#38527a]">
                            Correo de confirmacion: {meeting.emailSent ? 'enviado' : 'pendiente'}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {meeting.googleMeetLink ? (
                            <a
                              href={meeting.googleMeetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full bg-[#0f2a5e] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              <Video className="h-3.5 w-3.5" />
                              Enlace de la reunion
                            </a>
                          ) : null}
                          {meeting.buyerGoogleCalendarHtmlLink || meeting.googleCalendarHtmlLink ? (
                            <a
                              href={
                                meeting.buyerGoogleCalendarHtmlLink ||
                                meeting.googleCalendarHtmlLink
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-[#b7ccf3] bg-white px-3 py-1.5 text-xs font-semibold text-[#0f2a5e]"
                            >
                              <CalendarDays className="h-3.5 w-3.5" />
                              Ver en tu Calendar
                            </a>
                          ) : null}
                        </div>
                        {!meeting.emailSent && meeting.emailError ? (
                          <p className="mt-3 text-xs text-amber-700">{meeting.emailError}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#38527a]">
                  Cuando confirmes una cita, aqui veras el resumen de lo coordinado y la trazabilidad de la sincronizacion.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {isExpert ? (
        <section className="grid gap-6">
          <Card className="border-slate-200">
            <button
              type="button"
              onClick={() => setIsAvailabilityOpen((current) => !current)}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  Configura tu disponibilidad semanal
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Define que dias atiendes y agrega uno o varios horarios por dia.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-sky-200 text-sky-700">
                  {weeklyAvailability.filter((item) => item.enabled).length} dias activos
                </Badge>
                <ChevronDown
                  className={`h-5 w-5 text-slate-500 transition-transform ${
                    isAvailabilityOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>
            {isAvailabilityOpen ? (
              <CardContent className="space-y-4 pt-0">
                {myAvailabilityQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando configuracion...</p>
                ) : (
                  <>
                    <div className="grid gap-3">
                      {weeklyAvailability.map((item) => (
                        <div
                          key={item.day}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={(event) =>
                                  handleAvailabilityChange(item.day, 'enabled', event.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300 text-sky-600"
                              />
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{item.day}</p>
                                <p className="text-xs text-slate-500">
                                  {item.enabled ? 'Disponible para citas' : 'No disponible'}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                                Vista comprador
                              </p>
                              <p className="mt-2 text-sm text-slate-700">{formatBuyerView(item)}</p>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {item.slots.map((slot) => (
                              <div
                                key={slot.id}
                                className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 md:grid-cols-[1fr_1fr_auto]"
                              >
                                <div>
                                  <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    Desde
                                  </label>
                                  <select
                                    value={slot.startTime}
                                    disabled={!item.enabled}
                                    onChange={(event) =>
                                      handleSlotChange(item.day, slot.id, 'startTime', event.target.value)
                                    }
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                                  >
                                    {TIME_OPTIONS.map((time) => (
                                      <option key={time} value={time}>
                                        {time}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                                    Hasta
                                  </label>
                                  <select
                                    value={slot.endTime}
                                    disabled={!item.enabled}
                                    onChange={(event) =>
                                      handleSlotChange(item.day, slot.id, 'endTime', event.target.value)
                                    }
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                                  >
                                    {TIME_OPTIONS.map((time) => (
                                      <option key={time} value={time}>
                                        {time}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    disabled={item.slots.length === 1}
                                    onClick={() => removeSlot(item.day, slot.id)}
                                    className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Quitar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => addSlot(item.day)}
                              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700"
                            >
                              <Plus className="h-4 w-4" />
                              Agregar horario
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        className="bg-slate-900 hover:bg-slate-800"
                        disabled={saveAvailabilityMutation.isPending}
                        onClick={() =>
                          saveAvailabilityMutation.mutate({
                            weeklyAvailability,
                          })
                        }
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {saveAvailabilityMutation.isPending
                          ? 'Guardando horarios...'
                          : 'Guardar disponibilidad'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            ) : null}
          </Card>
        </section>
      ) : null}

      <section className="grid gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Listado de expertos</CardTitle>
            <CardDescription>
              Cards modernas con experiencia, especialidad y acceso directo a agenda.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {expertsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando expertos...</p>
            ) : (
              expertsQuery.data?.map((expert) => (
                <button
                  key={expert.id}
                  type="button"
                  onClick={() => setSelectedExpertId(expert.id)}
                  className={`rounded-[24px] border p-4 text-left transition-all ${
                    selectedExpertId === expert.id
                      ? 'border-cyan-400 bg-cyan-50/70 shadow-md'
                      : 'border-slate-200 bg-white hover:border-cyan-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={expert.photo || 'https://placehold.co/160x160?text=Nexu'}
                      alt={expert.fullName}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{expert.fullName}</p>
                      <p className="text-xs text-slate-500">{expert.specialty}</p>
                      <p className="mt-1 text-xs text-slate-500">{expert.industry}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{expert.shortBio}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {expert.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="border-slate-200 text-slate-600">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{expert.experience}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/nexu-experts/${expert.id}`);
                      }}
                      className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Agendar
                    </button>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {isDetailView ? (
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Perfil del experto</CardTitle>
              <CardDescription>Vista detallada con disponibilidad y propuesta de valor.</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedExpertId || expertProfileQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando perfil...</p>
              ) : expertProfileQuery.data ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <img
                      src={expertProfileQuery.data.photo || 'https://placehold.co/320x320?text=Nexu'}
                      alt={expertProfileQuery.data.fullName}
                      className="h-28 w-28 rounded-[24px] object-cover"
                    />
                    <div className="space-y-2">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-900">
                          {expertProfileQuery.data.fullName}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {expertProfileQuery.data.professionalProfile}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-slate-900 text-white">
                          {expertProfileQuery.data.specialty}
                        </Badge>
                        <Badge variant="outline" className="border-cyan-200 text-cyan-700">
                          {expertProfileQuery.data.industry}
                        </Badge>
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                          {expertProfileQuery.data.upcomingMeetings} citas activas
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Experiencia
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {expertProfileQuery.data.experience}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Disponibilidad
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {expertProfileQuery.data.weeklyAvailability
                          .filter((item) => item.enabled)
                          .map(
                            (item) =>
                              `${item.day}: ${item.slots
                                .map((slot) => `${slot.startTime} - ${slot.endTime}`)
                                .join(' | ')}`,
                          )
                          .join(' | ') || 'Flexible'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">Descripcion profesional</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {expertProfileQuery.data.biography || expertProfileQuery.data.description}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Empresas</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {expertProfileQuery.data.companies || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Educacion</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {expertProfileQuery.data.education || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Logros</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {expertProfileQuery.data.achievements || 'No especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-900">Servicio ofrecido</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {expertProfileQuery.data.service || 'Servicio de consultoria y acompanamiento.'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Selecciona un experto para ver el detalle.</p>
              )}
            </CardContent>
          </Card>

          {isBuyer ? (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Agendar cita</CardTitle>
                <CardDescription>
                  Fecha, hora y descripcion del tema a tratar. Confirmacion automatica con Meet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Fecha</label>
                    <Input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                    />
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Experto seleccionado
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedExpert?.fullName || 'Selecciona un experto'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedExpert?.specialty || 'Sin especialidad'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Horarios disponibles</p>
                  {availabilityQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Consultando disponibilidad...</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availabilityQuery.data?.slots.map((slot) => (
                        <button
                          key={slot.startsAt}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.startsAt)}
                          className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                            selectedSlot === slot.startsAt
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : slot.available
                                ? 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {availabilityQuery.data?.weekday ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Disponibilidad consultada para {availabilityQuery.data.weekday}.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Descripcion del tema a tratar
                  </label>
                  <Textarea
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    rows={5}
                    placeholder="Describe el objetivo de la reunion, el contexto y las preguntas clave."
                  />
                </div>

                <Button
                  className="w-full bg-slate-900 hover:bg-slate-800"
                  disabled={
                    !selectedExpertId ||
                    !selectedSlot ||
                    !topic.trim() ||
                    createAppointmentMutation.isPending
                  }
                  onClick={() =>
                    createAppointmentMutation.mutate({
                      expertId: selectedExpertId,
                      startsAt: selectedSlot,
                      topic: topic.trim(),
                    })
                  }
                >
                  {createAppointmentMutation.isPending ? 'Confirmando cita...' : 'Confirmar cita'}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
        ) : null}
      </section>

    </div>
  );
};

export default NexuExperts;
