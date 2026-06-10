'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import moment from 'moment-timezone';
import {
  Video,
  Ban,
  Calendar,
  Clock,
  MapPin,
  MessageSquareText,
  UserCircle2,
  Type,
  CalendarClock,
  ChevronDown,
  Users,
  History,
  RefreshCw,
} from 'lucide-react';
import InlineReschedule from './InlineReschedule';
import { toaster } from '@/utils/services/toast-service';
import RatingModal from '@/components/page/RatingModal';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Admin {
  _id: string;
  username: string;
  role: string;
  isActive: boolean;
}

interface Astrologer {
  _id: string;
  astrologerName: string;
  profileImage?: string;
}

interface Slot {
  _id: string;
  duration: number;
  fromTime: string;
  toTime: string;
  status: string;
}

interface RescheduleHistoryEntry {
  _id: string;
  rescheduledAt: string;
  rescheduledByAdminId: { _id: string; username: string } | null;
  previousDate: string;
  previousFromTime: string;
  previousToTime: string;
  previousSlotId: string;
}

interface Consultation {
  _id: string;
  customerId: string;
  astrologerId: Astrologer;
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  consultationType: string;
  consultationTopic: string;
  slotId: Slot;
  date: string;
  fromTime: string;
  toTime: string;
  status?: string;
  meetingId?: string;
  meetingPassword?: string;
  rescheduleCount?: number;
  lastRescheduledByAdminId?: { _id: string; username: string } | null;
  rescheduleHistory?: RescheduleHistoryEntry[];
}

interface ConsultationHistory {
  upcoming: Consultation[];
  completed: Consultation[];
  cancelled: Consultation[];
  expired: Consultation[];
  rescheduled_history: Consultation[];
}

interface RescheduleState {
  bookingId: string;
  duration_minutes: number;
  consultation_type: string;
  astrologerId: string;
  date: string;
  fromTime: string;
  toTime: string;
}

interface InfoLineProps {
  icon: React.ComponentType<{ size: number; className: string }>;
  label: string;
  value: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoLine = ({ icon: Icon, label, value }: InfoLineProps) => (
  <div className="flex items-start gap-2.5">
    <div className="mt-0.5 p-1.5 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg">
      <Icon size={16} className="text-red-600" />
    </div>
    <div className="text-sm text-gray-700 flex-1">
      <span className="font-semibold text-gray-900">{label}</span>
      <p className="text-gray-600 mt-0.5 capitalize">{value || '--'}</p>
    </div>
  </div>
);

const AdminDropdown = ({
  admins,
  selectedId,
  loading,
  onChange,
}: {
  admins: Admin[];
  selectedId: string;
  loading: boolean;
  onChange: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = admins.find((a) => a._id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-red-400 hover:text-red-600 transition-all duration-200 min-w-[180px] justify-between"
      >
        <span className="flex items-center gap-2">
          <Users size={15} className="text-red-500 shrink-0" />
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : selected ? (
            <span className="capitalize">{selected.username}</span>
          ) : (
            <span className="text-gray-400">Select Admin</span>
          )}
        </span>
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !loading && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          {admins.map((admin) => (
            <button
              key={admin._id}
              onClick={() => {
                onChange(admin._id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-red-50 hover:text-red-700 ${
                admin._id === selectedId
                  ? 'bg-red-50 text-red-700 font-bold'
                  : 'text-gray-700 font-medium'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  admin._id === selectedId ? 'bg-red-500' : 'bg-gray-300'
                }`}
              />
              <span className="capitalize">{admin.username}</span>
              {admin._id === selectedId && (
                <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Reschedule History Table ─────────────────────────────────────────────────

const RescheduleHistoryTable = ({ history, currentDate, currentFromTime, currentToTime }: { history: RescheduleHistoryEntry[]; currentDate: string; currentFromTime: string; currentToTime: string }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-4 border-t border-dashed border-red-200 pt-4">
      <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2">
        <History size={14} />
        Reschedule History ({history.length} time{history.length > 1 ? 's' : ''})
      </h4>
      <div className="space-y-2">
        {history.map((entry, idx) => (
          <div
            key={entry._id || idx}
            className="bg-red-50/60 border border-red-100 rounded-xl px-4 py-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                  #{idx + 1}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-400 text-[10px] uppercase font-semibold">Before</span>
                  <span className="font-semibold text-red-500">
                    {moment(entry.previousDate).format('DD MMM YYYY')} · {entry.previousFromTime} – {entry.previousToTime}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-[10px] uppercase font-semibold text-gray-400">After</span>
                  <span className="font-semibold text-green-600">
                    {/* next entry's previous = this entry's new; last entry's new = current booking slot */}
                    {idx + 1 < history.length
                      ? `${moment(history[idx + 1].previousDate).format('DD MMM YYYY')} · ${history[idx + 1].previousFromTime} – ${history[idx + 1].previousToTime}`
                      : `${moment(currentDate).format('DD MMM YYYY')} · ${currentFromTime} – ${currentToTime}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span>
                  By:{' '}
                  <span className="font-semibold text-gray-600 capitalize">
                    {entry.rescheduledByAdminId?.username || 'Customer'}
                  </span>
                </span>
                <span>·</span>
                <span>{moment(entry.rescheduledAt).format('DD MMM YYYY, hh:mm A')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const IST = (input?: any) => moment.tz(input || new Date(), 'Asia/Kolkata');

const TABS = ['upcoming', 'completed', 'cancelled', 'expired', 'rescheduled_history'];

const MyBooking = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('active') || 'upcoming';

  const [consultationHistory, setConsultationHistory] = useState<ConsultationHistory>({
    upcoming: [],
    completed: [],
    cancelled: [],
    expired: [],
    rescheduled_history: [],
  });
  const [loading, setLoading] = useState(true);
  const [joiningMeeting, setJoiningMeeting] = useState<string | null>(null);
  const [activeReschedule, setActiveReschedule] = useState<RescheduleState | null>(null);
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean; data: Consultation | null }>({
    isOpen: false,
    data: null,
  });

  // ── Admin state ──
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [selectedAdminId, setSelectedAdminId] = useState<string>(''); // whose bookings we're viewing
  const [loggedInAdminId, setLoggedInAdminId] = useState<string | null>(null); // who is actually logged in

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (selectedAdminId) {
      fetchConsultations(selectedAdminId);
    }
  }, [selectedAdminId, activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('hasReloaded') === 'true') {
      localStorage.removeItem('hasReloaded');
      window.location.reload();
    }
  }, []);

  const fetchAdmins = async () => {
    try {
      setAdminsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(
        `/api/admin/get-all-admins`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success && data.admins?.length > 0) {
        const activeAdmins: Admin[] = data.admins.filter((a: Admin) => a.isActive);
        setAdmins(activeAdmins);
        try {
          const meRes = await fetch(`/api/admin/me`, {
            method: 'GET',
            credentials: 'include',
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            const myId = meData?.userId ?? null;
            setLoggedInAdminId(myId); // ✅ store who is actually logged in
            const match = activeAdmins.find((a) => a._id === myId);
            setSelectedAdminId(match ? myId : activeAdmins[0]._id);
          } else {
            setSelectedAdminId(activeAdmins[0]._id);
          }
        } catch {
          setSelectedAdminId(activeAdmins[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
      toaster.error({ text: 'Failed to fetch admin list' });
    } finally {
      setAdminsLoading(false);
    }
  };

  const filterConsultationsByDate = (consultations: Consultation[]): ConsultationHistory => {
    const now = IST();
    const filtered: ConsultationHistory = {
      upcoming: [],
      completed: [],
      cancelled: [],
      expired: [],
      rescheduled_history: [],
    };

    consultations.forEach((c) => {
      const endDT = moment(`${c.date} ${c.toTime}`, 'YYYY-MM-DD hh:mm A').tz('Asia/Kolkata');

      // rescheduled tab — any consultation rescheduled at least once
      if (c.rescheduleCount && c.rescheduleCount > 0) {
        filtered.rescheduled_history.push(c);
      }

      if (c.status === 'cancelled') {
        filtered.cancelled.push(c);
      } else if (endDT.isBefore(now)) {
        filtered[c.status === 'completed' ? 'completed' : 'expired'].push(c);
      } else {
        filtered.upcoming.push(c);
      }
    });

    filtered.upcoming.sort((a, b) =>
      moment(`${a.date} ${a.fromTime}`, 'YYYY-MM-DD hh:mm A')
        .tz('Asia/Kolkata')
        .diff(moment(`${b.date} ${b.fromTime}`, 'YYYY-MM-DD hh:mm A').tz('Asia/Kolkata'))
    );

    return filtered;
  };

  const fetchConsultations = async (adminId: string) => {
    if (!adminId) return;
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const today = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
      const currentTime = moment().tz('Asia/Kolkata').format('HH:mm');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/get_consultations_by_adminId/all?createdByAdminId=${adminId}&currentDate=${today}&currentTime=${currentTime}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (data.success) {
        if (Array.isArray(data.consultations)) {
          setConsultationHistory(filterConsultationsByDate(data.consultations));
        } else {
          // API already grouped — rescheduled comes from API directly
          const sortedUpcoming = [...(data.consultations.upcoming || [])].sort((a, b) =>
            moment(`${a.date} ${a.fromTime}`, 'YYYY-MM-DD hh:mm A')
              .tz('Asia/Kolkata')
              .diff(moment(`${b.date} ${b.fromTime}`, 'YYYY-MM-DD hh:mm A').tz('Asia/Kolkata'))
          );
          setConsultationHistory({
            ...data.consultations,
            upcoming: sortedUpcoming,
            rescheduled: data.consultations.rescheduled_history || [],
          });
        }
      }
    } catch (err) {
      console.error('Error fetching consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminChange = (id: string) => {
    setSelectedAdminId(id);
    setActiveReschedule(null);
    setConsultationHistory({ upcoming: [], completed: [], cancelled: [], expired: [], rescheduled_history: [] });
  };

  const handleJoinConsultation = async (consultation: Consultation) => {
    const { consultationType, customerId, astrologerId, _id, meetingId, meetingPassword, slotId, date, fromTime, toTime } = consultation;

    if (consultationType === 'chat') {
      router.push(
        `/consultation/chat-consultation?customerId=${customerId}&astrologerId=${astrologerId._id}&consultationId=${_id}`
      );
    } else if (consultationType === 'videocall') {
      if (meetingId) {
        setJoiningMeeting(_id);
        try {
          const zoomUrl = `https://zoom.us/wc/join/${meetingId}${meetingPassword ? `?pwd=${meetingPassword}` : ''}`;
          const win = window.open(zoomUrl, 'ZoomMeeting', 'width=1280,height=720,menubar=no,toolbar=no');
          if (!win) { toaster.error({ text: 'Please allow popups for this site.' }); return; }
          toaster.success({ text: 'Meeting opened successfully' });
        } catch { toaster.error({ text: 'Failed to join meeting. Please try again.' }); }
        finally { setJoiningMeeting(null); }
      } else {
        toaster.error({ text: 'Meeting ID not found. Please contact Support.' });
      }
    } else if (consultationType === 'call') {
      setJoiningMeeting(_id);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const now = IST();
        const dateStr = moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD');
        const slotEndTime = moment.tz(`${dateStr} ${toTime}`, 'YYYY-MM-DD HH:mm', 'Asia/Kolkata');
        const secondsRemaining = slotEndTime.diff(now, 'seconds');
        let dur = secondsRemaining > 0 ? Math.ceil(secondsRemaining / 60) : 1;
        dur = Math.max(1, Math.min(dur, slotId?.duration || 15));

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers/initiate_call_with_exotel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ astrologerId: astrologerId._id, consultationId: _id, customerId, formId: _id, maxDuration: dur * 60 }),
        });
        const d = await res.json();
        if (d.success === false) toaster.info({ text: d.message });
        else toaster.success({ text: `Call sent! Duration: ${dur} min` });
      } catch { toaster.error({ text: 'Failed to initiate call. Please try again.' }); }
      finally { setJoiningMeeting(null); }
    }
  };

  const toggleReschedule = (data: Consultation) => {
    const isSame = activeReschedule?.bookingId === data._id;
    setActiveReschedule(
      isSame ? null : {
        bookingId: data._id,
        duration_minutes: data.slotId?.duration,
        consultation_type: data.consultationType,
        astrologerId: data.astrologerId?._id,
        date: data.date,
        fromTime: data.fromTime,
        toTime: data.toTime,
      }
    );
  };

  const renderAppointmentCard = (data: Consultation, type: string) => {
    const canReschedule = type === 'upcoming' || type === 'expired';
    const isRescheduleOpen = activeReschedule?.bookingId === data._id;
    const isRescheduledTab = type === 'rescheduled_history';

    return (
      <div
        key={data?._id}
        className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group ${
          isRescheduledTab ? 'border-red-200' : 'border-gray-200'
        }`}
      >
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:translate-x-12 group-hover:-translate-y-12 transition-transform duration-500 ${
          isRescheduledTab
            ? 'bg-gradient-to-br from-red-100/50 to-pink-100/50'
            : 'bg-gradient-to-br from-red-100/50 to-pink-100/50'
        }`} />

        <div className="relative z-10">
          {/* Card header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl shadow-md ${isRescheduledTab ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
                  <UserCircle2 size={20} className="text-white" />
                </div>
                <h3 className="text-gray-900 font-bold text-xl">{data?.fullName}</h3>
              </div>
              <div className="flex items-center gap-2 ml-6 text-sm">
                <span className="font-semibold text-gray-700">Astrologer:</span>
                <span className={`font-medium ${isRescheduledTab ? 'text-red-600' : 'text-red-600'}`}>
                  {data?.astrologerId?.astrologerName || 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-white text-xs font-bold px-4 py-2 rounded-full shadow-md flex items-center gap-2 whitespace-nowrap ${
                isRescheduledTab
                  ? 'bg-gradient-to-r from-red-500 to-red-700'
                  : 'bg-gradient-to-r from-red-500 to-red-700'
              }`}>
                <Calendar size={14} />
                {moment(data?.date).format('DD MMM YYYY')}
              </span>
              {/* ✅ Show reschedule count badge */}
              {data.rescheduleCount && data.rescheduleCount > 0 ? (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                  <RefreshCw size={11} />
                  Rescheduled {data.rescheduleCount}x
                  {/* {data.lastRescheduledByAdminId?.username && (
                    <span className="text-red-400 font-normal">
                      · by {data.lastRescheduledByAdminId.username}
                    </span>
                  )} */}
                </span>
              ) : null}
            </div>
          </div>

          {/* Info grid */}
          <div className="bg-gradient-to-br from-gray-50 to-red-50/30 rounded-xl p-5 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoLine icon={Clock} label="Date of Birth" value={moment(data?.dateOfBirth).format('DD MMM YYYY')} />
              <InfoLine icon={Clock} label="Time of Birth" value={data?.timeOfBirth} />
              <InfoLine icon={MapPin} label="Place of Birth" value={data?.placeOfBirth} />
              <InfoLine icon={Type} label="Consultation Type" value={data?.consultationType} />
              <InfoLine icon={MessageSquareText} label="Topic" value={data?.consultationTopic} />
              <InfoLine icon={Clock} label="Time Slot (IST)" value={`${data?.fromTime} - ${data?.toTime}`} />
            </div>
          </div>

          {/* Action buttons */}
          {(type === 'upcoming' || (isRescheduledTab && data.status !== 'cancelled' && data.status !== 'completed')) && (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => toggleReschedule(data)}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 shadow-md text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  isRescheduleOpen
                    ? 'bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white'
                }`}
              >
                <CalendarClock size={18} />
                {isRescheduleOpen ? 'Close' : 'Reschedule'}
              </button>
            </div>
          )}

          {type === 'expired' && (
            <div className="flex gap-3 justify-end">
              {/* <span className="bg-gray-200 text-gray-500 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
                <Clock size={16} /> Expired
              </span> */}
              <button
                onClick={() => toggleReschedule(data)}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 shadow-md text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  isRescheduleOpen
                    ? 'bg-gradient-to-r from-gray-500 to-gray-700 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white'
                }`}
              >
                <CalendarClock size={18} />
                {isRescheduleOpen ? 'Close' : 'Reschedule'}
              </button>
            </div>
          )}

          {type === 'cancelled' && (
            <div className="flex gap-3 justify-end">
              <span className="bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
                <Ban size={16} /> Cancelled
              </span>
            </div>
          )}

          {/* ✅ Reschedule history — shown in rescheduled tab */}
          {isRescheduledTab && data.rescheduleHistory && data.rescheduleHistory.length > 0 && (
            <RescheduleHistoryTable history={data.rescheduleHistory} currentDate={data.date} currentFromTime={data.fromTime} currentToTime={data.toTime} />
          )}

          {/* Inline Reschedule panel */}
          {isRescheduleOpen && activeReschedule && (
            <InlineReschedule
              astrologerId={activeReschedule.astrologerId}
              duration_minutes={activeReschedule.duration_minutes}
              consultation_type={activeReschedule.consultation_type}
              bookingId={activeReschedule.bookingId}
              ConsultantDate={activeReschedule.date}
              toTime={activeReschedule.toTime}
              currentFromTime={activeReschedule.fromTime}
              currentToTime={activeReschedule.toTime}
              rescheduledByAdminId={loggedInAdminId || null}  // ✅ always logged-in admin, not the one whose bookings we're viewing
              onClose={() => setActiveReschedule(null)}
              onSuccess={() => {
                setActiveReschedule(null);
                fetchConsultations(selectedAdminId);
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="px-5 py-6 pt-28 bg-gradient-to-br from-gray-50 to-red-50/30 min-h-screen">
        <article className="max-w-7xl mx-auto space-y-6">

          {/* Top bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-3 flex-wrap justify-center">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      router.push(`?active=${tab}`);
                      setActiveReschedule(null);
                    }}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 text-sm font-bold capitalize shadow-md transform hover:scale-105 ${
                      isActive
                        ? tab === 'rescheduled_history'
                          ? 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg'
                          : 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            <AdminDropdown
              admins={admins}
              selectedId={selectedAdminId}
              loading={adminsLoading}
              onChange={handleAdminChange}
            />
          </div>

          {/* Cards */}
          <div className="space-y-5">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200" />
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-red-500 border-r-red-700 absolute top-0 left-0" />
                </div>
              </div>
            ) : consultationHistory[activeTab as keyof ConsultationHistory]?.length > 0 ? (
              consultationHistory[activeTab as keyof ConsultationHistory].map((appt) =>
                renderAppointmentCard(appt, activeTab)
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-20 bg-white rounded-2xl shadow-sm">
                <div className={`p-6 rounded-full mb-4 ${activeTab === 'rescheduled_history' ? 'bg-gradient-to-br from-red-100 to-pink-100/50' : 'bg-gradient-to-br from-gray-100 to-red-100/50'}`}>
                  {activeTab === 'rescheduled_history'
                    ? <RefreshCw size={48} className="text-red-300" />
                    : <Video size={48} className="text-gray-400" />
                  }
                </div>
                <p className="mt-2 text-lg font-medium">No {activeTab} appointments found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {admins.find((a) => a._id === selectedAdminId)?.username
                    ? `No ${activeTab} consultations for "${admins.find((a) => a._id === selectedAdminId)?.username}"`
                    : `Your ${activeTab} consultations will appear here`}
                </p>
              </div>
            )}
          </div>
        </article>
      </section>

      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => {
          setRatingModal({ isOpen: false, data: null });
          fetchConsultations(selectedAdminId);
        }}
        consultation={ratingModal.data}
      />
    </>
  );
};

export default MyBooking;