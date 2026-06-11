/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Calendar, Clock, Phone, Video, Plus, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

import ConsultationForm, { CustomerSession, FormOutput } from '@/components/form/consultationForm';
import { toaster } from '@/utils/services/toast-service';
import { AstrologerData, User as UserType } from '../types';
import DatePicker from './DatePicker';
import DatePickerSpecial from './DatePickerSpecial';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface ConsultationPrice {
  price: number;
  duration: { slotDuration: number };
  consultationType: string;
}

interface AvailableSlot {
  fromTime: string;
  toTime: string;
  duration: number;
  _id?: string;
  status?: string;
}

interface SlotsApiResponse {
  SlotDate: string;
  SlotTimeByDuration: { [key: string]: AvailableSlot[] };
}

interface DurationCount {
  duration: number;
  count: number;
  label: string;
}

interface AvailableSlotsApiResponse {
  success: boolean;
  message: string;
  totalSlots: number;
  availableDurations: number[];
  durationCounts: DurationCount[];
  requestedDate: string;
  requestedTime: string;
  minimumTime: string;
  dateRange: { from: string; to: string };
  slots: AvailableSlot[];
}

interface SessionType {
  title: string;
  value: 'videocall' | 'call' | 'chat';
  icon: React.ReactNode;
}

interface ModalData {
  price: number | null;
  consultation_type: 'videocall' | 'call' | 'chat';
  duration_minutes: string;
  selectedDate: string | null;
  selectedSlot: AvailableSlot | null;
}

// New Slot creation form state
interface NewSlotForm {
  fromDate: string;
  toDate: string;
  fromTime: string;
  toTime: string;
}

interface SlotDuration {
  slotDuration: number;
  _id?: string;
}

interface SlotDuration {
  slotDuration: number;
  _id?: string;
}

interface BookingSectionProps {
  astrologerId: string;
  astrologerData: AstrologerData;
  currentUser: UserType | null;
  onLoginRequired: () => void;
  consultationPrices: ConsultationPrice[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getAvailableSessionTypes = (astrologerData: AstrologerData): SessionType[] => {
  const all: SessionType[] = [
    { title: 'Video Call', value: 'videocall', icon: <Video size={24} /> },
    { title: 'Voice Call', value: 'call', icon: <Phone size={24} /> },
  ];
  return all.filter((t) => {
    if (t.value === 'videocall') return astrologerData.video_call_status !== 'offline';
    if (t.value === 'call') return astrologerData.call_status !== 'offline';
    return true;
  });
};

const formatTime = (time: string): string => {
  const [h, m] = time.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const SlotBookingSection: React.FC<BookingSectionProps> = ({
  astrologerId,
  astrologerData,
  consultationPrices,
}): React.ReactElement => {

  const router = useRouter();

  const isSpecialAstrologer = astrologerData?.hasSpecialPricing === true;
  const SPECIAL_PRICING_CONFIG: Record<string, number> = astrologerData?.specialPricingRates ?? {};
  const getSpecialPrice = (dur: number): number | null => SPECIAL_PRICING_CONFIG[String(dur)] ?? null;
  const web_urls = process.env.NEXT_PUBLIC_IMAGE_URL;
  // today must be client-only — avoids SSR/client date mismatch (hydration error)
  const [today, setToday] = useState('');
  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const sessionTypes = getAvailableSessionTypes(astrologerData);

  // ── Customer / form state ─────────────────────────────────────
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [consultationFormData, setConsultationFormData] = useState<FormOutput | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // ── Pricing ───────────────────────────────────────────────────
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [globalOfferPrice, setGlobalOfferPrice] = useState<number | null>(null);
  const [checkingNewCustomer, setCheckingNewCustomer] = useState(false);
  const [isUrgentBooking, setIsUrgentBooking] = useState(false);

  // ── Slot fetching ─────────────────────────────────────────────
  const [slotsData, setSlotsData] = useState<SlotsApiResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [hasFutureSlots, setHasFutureSlots] = useState<boolean | null>(null);
  const [availableDurations, setAvailableDurations] = useState<number[]>([]);
  const [loadingDurations, setLoadingDurations] = useState(false);
  const [durationCounts, setDurationCounts] = useState<DurationCount[]>([]);

  // ── New Slot Creation panel ───────────────────────────────────
  const [showCreateSlotPanel, setShowCreateSlotPanel] = useState(false);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [createSlotResult, setCreateSlotResult] = useState<{ type: 'success' | 'error'; message: string; count?: number } | null>(null);
  const [newSlotForm, setNewSlotForm] = useState<NewSlotForm>({
    fromDate: '',
    toDate: '',
    fromTime: '',
    toTime: '',
  });

  // ── Durations from API (for create panel) ─────────────────────
  const [slotDurationsFromApi, setSlotDurationsFromApi] = useState<SlotDuration[]>([]);
  const [createDuration, setCreateDuration] = useState<number | null>(null);

  // ── Fetch slot durations for create panel on mount ──────────────
  useEffect(() => {
    const fetchDurations = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const res = await fetch(`/api/admin/get_slots_duration`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        const durations: SlotDuration[] = data.slots || data || [];
        setSlotDurationsFromApi(durations);
        if (durations.length > 0) setCreateDuration(durations[0].slotDuration);
      } catch {
        // silently fail — panel falls back to currentDuration
      }
    };
    fetchDurations();
  }, []);

  // ── Modal data ────────────────────────────────────────────────
  const getCorrectPrice = (durationSlot: number): number => {
    const base = consultationPrices.find((p) => p.duration.slotDuration === durationSlot);
    if (!base) return 199;
    if (isUrgentBooking) return base.price;
    if (isSpecialAstrologer) {
      const sp = getSpecialPrice(durationSlot);
      if (sp !== null) return sp;
    }
    const candidates: number[] = [];
    const offerPrices = astrologerData?.firstTimeOfferPrices ?? [];
    if (isNewCustomer && astrologerData?.GoWithCustomPricings === true && offerPrices.length > 0) {
      const offer = offerPrices.find((o: any) => o.duration.slotDuration === durationSlot);
      if (offer) candidates.push(offer.price);
    }
    if (
      isNewCustomer &&
      astrologerData?.useGlobalFirstTimeOfferPrice === true &&
      astrologerData?.GoWithCustomPricings === false &&
      offerPrices.length === 0 &&
      durationSlot === 15 &&
      globalOfferPrice !== null
    ) {
      candidates.push(globalOfferPrice);
    }
    candidates.push(base.price);
    return Math.min(...candidates);
  };

  const [modalData, setModalData] = useState<ModalData>(() => {
    const defaultType = sessionTypes[0]?.value ?? 'videocall';
    if (!consultationPrices?.length) {
      return { price: null, consultation_type: defaultType, duration_minutes: '30min', selectedDate: null, selectedSlot: null };
    }
    const minSlot = consultationPrices.reduce((min, item) =>
      (item?.duration?.slotDuration ?? 0) < (min?.duration?.slotDuration ?? 0) ? item : min
    );
    const defaultDur = isSpecialAstrologer ? 30 : (minSlot?.duration?.slotDuration ?? 15);
    const defaultPrice = isSpecialAstrologer ? (getSpecialPrice(defaultDur) ?? minSlot?.price ?? 199) : (minSlot?.price ?? 199);
    return { price: defaultPrice, consultation_type: defaultType, duration_minutes: `${defaultDur}min`, selectedDate: null, selectedSlot: null };
  });

  const hasCheckedAvailability = useRef(false);
  const paymentCheckInterval = useRef<NodeJS.Timeout | null>(null);
  // Ref to always hold latest selectedSlot — avoids stale closure in handleDirectBooking
  const selectedSlotRef = useRef<AvailableSlot | null>(null);

  // Keep ref in sync — declared after modalData so no TS2448 error
  useEffect(() => {
    selectedSlotRef.current = modalData.selectedSlot;
  }, [modalData.selectedSlot]);

  // ── Sync price on dependency change ──────────────────────────
  useEffect(() => {
    if (!consultationPrices.length) return;
    const dur = parseInt(modalData.duration_minutes.replace('min', ''));
    const correct = getCorrectPrice(dur);
    if (modalData.price !== correct) setModalData((p) => ({ ...p, price: correct }));
  }, [isSpecialAstrologer, isUrgentBooking, modalData.duration_minutes, consultationPrices, isNewCustomer, globalOfferPrice]);

  // ── Sync session type ─────────────────────────────────────────
  useEffect(() => {
    if (!sessionTypes.length) return;
    const ok = sessionTypes.some((t) => t.value === modalData.consultation_type);
    if (!ok) setModalData((p) => ({ ...p, consultation_type: sessionTypes[0].value }));
  }, [sessionTypes, modalData.consultation_type]);

  // ── Check new customer ────────────────────────────────────────
  useEffect(() => {
    if (!customerSession?.customerId) return;
    const check = async () => {
      setCheckingNewCustomer(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/check-new-customer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: customerSession.customerId, offerPriceActive: true }),
        });
        const data = await res.json();
        if (data.success && data.isNewCustomer) {
          setIsNewCustomer(true);
          if (data.hasOfferPrice) setGlobalOfferPrice(data.offerPrice);
        } else {
          setIsNewCustomer(false);
        }
      } catch {
        setIsNewCustomer(false);
      } finally {
        setCheckingNewCustomer(false);
      }
    };
    check();
  }, [customerSession?.customerId]);

  useEffect(() => {
    return () => { if (paymentCheckInterval.current) clearInterval(paymentCheckInterval.current); };
  }, []);

  // ── Check available durations ─────────────────────────────────
  const checkAvailableDurations = async () => {
    if (!astrologerId || hasCheckedAvailability.current) return;
    setLoadingDurations(true);
    hasCheckedAvailability.current = true;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/slots/available?astrologerId=${astrologerId}&date=${moment().format('YYYY-MM-DD')}&time=${moment().format('HH:mm')}`
      );
      const data: AvailableSlotsApiResponse = await res.json();
      if (res.ok && data.success) {
        setAvailableDurations(data.availableDurations ?? []);
        setDurationCounts(data.durationCounts ?? []);
        setHasFutureSlots(data.totalSlots > 0);
        if (data.availableDurations?.length) {
          const cur = parseInt(modalData.duration_minutes.replace('min', ''));
          if (!data.availableDurations.includes(cur)) {
            const first = data.availableDurations[0];
            const match = consultationPrices.find((p) => p.duration.slotDuration === first);
            if (match) {
              let fp = match.price;
              if (isSpecialAstrologer && !isUrgentBooking) {
                const sp = getSpecialPrice(first);
                if (sp !== null) fp = sp;
              }
              setModalData((p) => ({ ...p, duration_minutes: `${first}min`, price: fp }));
            }
          }
        }
      } else {
        setHasFutureSlots(false);
      }
    } catch {
      setHasFutureSlots(false);
    } finally {
      setLoadingDurations(false);
    }
  };

  useEffect(() => { checkAvailableDurations(); }, [astrologerId]);

  // ── Fetch slots for a date ────────────────────────────────────
  const fetchSlots = async (date: string) => {
    if (!astrologerId || !date) return;
    setLoadingSlots(true);
    setSlotsError(null);
    setShowAllSlots(false);
    try {
      const duration = parseInt(modalData.duration_minutes.replace('min', ''));
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/get_slots_gen/${astrologerId}/by-date?currentDate=${new Date().toLocaleDateString('en-CA')}&duration=${duration}&currentTime=${moment().format('HH:mm')}&date=${date}`
      );
      const data: SlotsApiResponse = await res.json();
      if (res.ok && data.SlotTimeByDuration) {
        const key = `${duration}min`;
        let slots = data.SlotTimeByDuration[key] ?? [];
        const todayObj = new Date();
        const [y, m, d] = date.split('-').map(Number);
        if (todayObj.toDateString() === new Date(y, m - 1, d).toDateString()) {
          const minMins = todayObj.getHours() * 60 + todayObj.getMinutes() + 15;
          slots = slots.filter((s) => {
            const [h, mi] = s.fromTime.split(':').map(Number);
            return h * 60 + mi >= minMins;
          });
        }
        setSlotsData({ ...data, SlotTimeByDuration: { ...data.SlotTimeByDuration, [key]: slots } });
      } else {
        setSlotsError('Failed to fetch available slots');
      }
    } catch {
      setSlotsError('Network error while fetching slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Re-fetch on duration/date changes
  useEffect(() => {
    const ctrl = new AbortController();
    let active = true;
    const run = async () => {
      if (!astrologerId || !modalData.selectedDate || !hasFutureSlots) return;
      setLoadingSlots(true);
      setSlotsError(null);
      setShowAllSlots(false);
      try {
        const duration = parseInt(modalData.duration_minutes.replace('min', ''));
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/get_slots_gen/${astrologerId}/by-date?currentDate=${new Date().toLocaleDateString('en-CA')}&duration=${duration}&currentTime=${moment().format('HH:mm')}&date=${modalData.selectedDate}`,
          { signal: ctrl.signal }
        );
        if (!active) return;
        const data: SlotsApiResponse = await res.json();
        if (!active) return;
        if (res.ok && data.SlotTimeByDuration) {
          const key = `${duration}min`;
          let slots = data.SlotTimeByDuration[key] ?? [];
          const todayObj = new Date();
          const [y, m, d] = modalData.selectedDate.split('-').map(Number);
          if (todayObj.toDateString() === new Date(y, m - 1, d).toDateString()) {
            const minMins = todayObj.getHours() * 60 + todayObj.getMinutes() + 15;
            slots = slots.filter((s) => {
              const [h, mi] = s.fromTime.split(':').map(Number);
              return h * 60 + mi >= minMins;
            });
          }
          if (active) setSlotsData({ ...data, SlotTimeByDuration: { ...data.SlotTimeByDuration, [key]: slots } });
        } else {
          if (active) setSlotsError('Failed to fetch available slots');
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError' && active) setSlotsError('Network error');
      } finally {
        if (active) setLoadingSlots(false);
      }
    };
    run();
    return () => { active = false; ctrl.abort(); };
  }, [modalData.selectedDate, modalData.duration_minutes, hasFutureSlots, astrologerId]);

  // ─────────────────────────────────────────────────────────────
  // NEW SLOT CREATION
  // ─────────────────────────────────────────────────────────────

  const handleCreateSlot = async () => {
    const { fromDate, toDate, fromTime, toTime } = newSlotForm;
    const durToUse = createDuration ?? parseInt(modalData.duration_minutes.replace('min', ''));
    console.log('[CreateSlot] durToUse:', durToUse, '| createDuration:', createDuration);
    if (!fromDate || !toDate || !fromTime || !toTime) {
      setCreateSlotResult({ type: 'error', message: 'Please fill all slot creation fields.' });
      return;
    }
    if (!durToUse) {
      setCreateSlotResult({ type: 'error', message: 'Please select a duration.' });
      return;
    }

    setIsCreatingSlot(true);
    setCreateSlotResult(null);

    try {
      const duration = durToUse;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/astrologer/create_slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ astrologerId, duration, fromDate, toDate, fromTime, toTime }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Reset create form and close panel immediately
        setNewSlotForm({ fromDate: '', toDate: '', fromTime: '', toTime: '' });
        setShowCreateSlotPanel(false);
        setCreateSlotResult(null);

        // The newly created slots are in data.slots array
        // Pick the first available slot from the created slots
        const createdSlots: AvailableSlot[] = (data.slots || []).map((s: any) => ({
          _id:      s._id?.toString() || s.id?.toString() || '',
          fromTime: s.fromTime,
          toTime:   s.toTime,
          duration: s.duration,
          status:   s.status || 'available',
        }));

        console.log('[CreateSlot] createdSlots:', createdSlots);
        console.log('[CreateSlot] first slot _id:', createdSlots[0]?._id);

        if (createdSlots.length > 0) {
          // Inject newly created slots into slotsData so they show in grid
          const durKey = `${durToUse}min`;
          setSlotsData((prev) => {
            const existing = prev?.SlotTimeByDuration?.[durKey] ?? [];
            const merged = [...existing, ...createdSlots];
            return {
              SlotDate: modalData.selectedDate ?? newSlotForm.fromDate,
              SlotTimeByDuration: {
                ...(prev?.SlotTimeByDuration ?? {}),
                [durKey]: merged,
              },
            };
          });

          // Also update booking duration to match the newly created slot duration
          const durMinStr = `${durToUse}min`;
          const matchingPrice = consultationPrices.find((p) => p.duration.slotDuration === durToUse);
          const firstSlot = createdSlots[0];

          if (!firstSlot?._id) {
            console.warn('[CreateSlot] WARNING: slot _id is empty!', firstSlot);
            toaster.error({ text: 'Slot created but ID missing. Please select slot manually.' });
            // Fallback: re-fetch slots
            hasCheckedAvailability.current = false;
            setHasFutureSlots(null);
            await checkAvailableDurations();
            if (modalData.selectedDate) await fetchSlots(modalData.selectedDate);
            return;
          }

          console.log('[CreateSlot] Auto-selecting slot:', firstSlot._id);

          setModalData((p) => ({
            ...p,
            duration_minutes: durMinStr,
            price: matchingPrice ? getCorrectPrice(durToUse) : p.price,
            selectedSlot: firstSlot,
            selectedDate: modalData.selectedDate ?? newSlotForm.fromDate,
          }));

          // Open consultation form immediately
          setShowConsultationForm(true);
        } else {
          // No slot objects returned — fallback: re-fetch for the selected date
          hasCheckedAvailability.current = false;
          setHasFutureSlots(null);
          await checkAvailableDurations();
          if (modalData.selectedDate) await fetchSlots(modalData.selectedDate);
        }
      } else {
        const errMsg = data.message || 'Failed to create slots.';
        setCreateSlotResult({ type: 'error', message: errMsg });
        toaster.error({ text: errMsg });
      }
    } catch (err: any) {
      const errMsg = err.message || 'Network error. Please try again.';
      setCreateSlotResult({ type: 'error', message: errMsg });
      toaster.error({ text: errMsg });
    } finally {
      setIsCreatingSlot(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // BOOKING
  // ─────────────────────────────────────────────────────────────

  const handleDirectBooking = async () => {
    // Use ref to get latest slot — avoids stale closure after slot creation without re-render
    const activeSlot = selectedSlotRef.current ?? modalData.selectedSlot;
    console.log('[Booking] activeSlot:', activeSlot?._id);

    if (!activeSlot?._id) { toaster.info({ text: 'Please select a slot first' }); return; }
    if (!customerSession) { toaster.error({ text: 'Please login with customer phone number first' }); return; }
    if (!isFormValid)     { toaster.error({ text: 'Please fill all required customer details' }); return; }

    setIsBooking(true);

    let createdByAdminId: string | null = null;
    try {
      const adminRes = await fetch(`/api/admin/me`, { method: 'GET', credentials: 'include' });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        createdByAdminId = adminData?.userId ?? null;
      }
    } catch (e) {
      console.warn('Admin fetch failed:', e);
    }

    Swal.fire({
      title: 'Booking Consultation',
      html: '<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#980d0d] mx-auto"></div><p class="mt-2">Please wait...</p>',
      allowOutsideClick: false,
      showConfirmButton: false,
    });

    try {
      const payload = {
        customerId: customerSession.customerId,
        astrologerId,
        createdByAdminId,
        slotId: activeSlot._id,
        consultationType: modalData.consultation_type,
        email: consultationFormData?.email?.trim() || customerSession.email?.trim() || '',
        fullName: consultationFormData?.fullName ?? customerSession.customerName,
        mobileNumber: consultationFormData?.mobileNumber ?? customerSession.phoneNumber,
        dateOfBirth: consultationFormData?.dateOfBirth ?? '',
        timeOfBirth: consultationFormData?.timeOfBirth ?? '',
        placeOfBirth: consultationFormData?.placeOfBirth ?? '',
        gender: consultationFormData?.gender ?? '',
        latitude: consultationFormData?.latitude ?? 0,
        longitude: consultationFormData?.longitude ?? 0,
        consultationTopic: consultationFormData?.consultationTopic ?? 'Astrology Consultation',
        couponCode: '',
        meetingId: '',
        meetingPassword: '',
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/book_without_payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      Swal.close();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Booking Confirmed!',
          text: 'Consultation has been booked successfully.',
          confirmButtonColor: '#980d0d',
        });
        router.push('/my-booking');
      } else {
        throw new Error(data.message ?? 'Booking failed');
      }
    } catch (err: any) {
      Swal.close();
      toaster.error({ text: err.message ?? 'Booking failed. Please try again.' });
    } finally {
      setIsBooking(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────────────────────

  const getFilteredPrices = (): ConsultationPrice[] => {
    const sorted = [...consultationPrices].sort((a, b) => a.price - b.price);
    if (!availableDurations?.length) return sorted;
    return sorted.filter((p) => availableDurations.includes(p.duration.slotDuration));
  };

  const getAvailableSlots = (): AvailableSlot[] =>
    slotsData?.SlotTimeByDuration?.[modalData.duration_minutes] ?? [];

  const getDisplaySlots = (): AvailableSlot[] => {
    const all = getAvailableSlots().filter((s) => s.status === 'available');
    return showAllSlots ? all : all.slice(0, 8);
  };

  const hasValidCustomer = !!customerSession?.customerId;
  const isBookDisabled = !(selectedSlotRef.current?._id ?? modalData.selectedSlot?._id) || !isFormValid || !hasValidCustomer;
  const displaySlots = getDisplaySlots();
  const allAvailableSlots = getAvailableSlots().filter((s) => s.status === 'available');
  const hasMoreSlots = allAvailableSlots.length > 8;
  const filteredPrices = getFilteredPrices();
  const currentDuration = parseInt(modalData.duration_minutes.replace('min', ''));

  // ─────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────

  if (loadingDurations) {
    return (
      <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px] flex items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#980d0d]" />
        <span className="text-gray-600">Checking availability...</span>
      </div>
    );
  }

  if (!sessionTypes.length) {
    return (
      <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px]">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Consultation Modes Available</h3>
          <p className="text-gray-500">This astrologer is not available for any call type right now.</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="lg:border rounded-xl lg:p-6 bg-white shadow-sm min-h-[600px]">

      {/* ── Header ── */}
      <div className="flex justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-[#980d0d] mb-1">Book Your Consultation</h2>
          <p className="text-sm text-gray-500 hidden lg:block">
            Get personalized astrological guidance in simple steps
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {astrologerData.profileImage ? (
            <img
              src={`${web_urls}${astrologerData.profileImage}`}
              alt={astrologerData.astrologerName}
              className="w-12 h-12 object-cover object-top rounded-full hover:scale-105 transition-transform cursor-pointer"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#980d0d]/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#980d0d]" />
            </div>
          )}
          <span className="text-xs text-gray-500 hidden lg:block">{astrologerData.astrologerName}</span>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── Urgent / Normal toggle for special astrologer ── */}
        {isSpecialAstrologer && (
          <div className="inline-flex rounded-lg border-2 border-gray-300 bg-white p-1">
            {(['Normal', 'Urgent'] as const).map((label) => {
              const urgent = label === 'Urgent';
              const active = isUrgentBooking === urgent;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (active) return;
                    setIsUrgentBooking(urgent);
                    setModalData((p) => {
                      const dur = parseInt(p.duration_minutes.replace('min', ''));
                      const price = urgent
                        ? (consultationPrices.find((cp) => cp.duration.slotDuration === dur)?.price ?? 199)
                        : (getSpecialPrice(dur) ?? SPECIAL_PRICING_CONFIG[String(dur)] ?? 199);
                      return { ...p, selectedDate: null, selectedSlot: null, price };
                    });
                  }}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${active ? 'bg-[#980d0d] text-white shadow-md' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 1 — Session Type
        ══════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">1</div>
            <h3 className="text-base font-semibold text-gray-800">Select Session Type</h3>
          </div>
          <div className="grid gap-3 grid-cols-4">
            {sessionTypes.map((item) => (
              <button
                key={item.value}
                onClick={() => setModalData((p) => ({ ...p, consultation_type: item.value }))}
                disabled={isBooking}
                className={`flex flex-col items-center justify-center gap-2 px-4 p-3 rounded-lg border-2 transition-all disabled:opacity-50 ${
                  modalData.consultation_type === item.value
                    ? 'bg-[#980d0d] text-white border-[#980d0d] shadow-md'
                    : 'border-gray-300 text-gray-600 hover:border-[#980d0d] hover:bg-red-50'
                }`}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 2 — Duration
        ══════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">2</div>
            <h3 className="text-base font-semibold text-gray-800">Choose Duration</h3>
          </div>
          {filteredPrices.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {filteredPrices.map((slot, idx) => {
                const selected = modalData.duration_minutes === `${slot.duration.slotDuration}min`;
                const displayPrice = getCorrectPrice(slot.duration.slotDuration);
                const hasDiscount = displayPrice < slot.price;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setModalData((p) => ({
                        ...p,
                        price: getCorrectPrice(slot.duration.slotDuration),
                        duration_minutes: `${slot.duration.slotDuration}min`,
                        selectedSlot: null,
                      }));
                    }}
                    disabled={isBooking}
                    className={`flex flex-col items-center justify-center px-4 p-1 rounded-lg border-2 transition-all text-sm disabled:opacity-50 ${
                      selected
                        ? 'bg-[#980d0d] text-white border-[#980d0d] shadow-md'
                        : 'border-gray-300 text-gray-700 hover:border-[#980d0d] hover:bg-green-50'
                    }`}
                  >
                    <span className="font-bold text-lg">{slot.duration.slotDuration} Min</span>
                    {hasDiscount && !isUrgentBooking && (
                      <span className="text-xs line-through opacity-75">₹{slot.price.toLocaleString('en-IN')}</span>
                    )}
                    <span className="font-semibold">₹{displayPrice.toLocaleString('en-IN')}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">No duration slots available</p>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 3 — Date & Time
        ══════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <h3 className="text-base font-semibold text-gray-800">Select Date & Time Slot</h3>
            </div>
            {!isUrgentBooking && isSpecialAstrologer && (
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg inline-flex items-center gap-2 w-fit text-xs sm:text-sm font-medium text-amber-700">
                ⚠️ Waiting Period: 30 Days
              </div>
            )}
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Choose Date</label>
            {isSpecialAstrologer ? (
              <DatePickerSpecial
                selectedDate={modalData.selectedDate}
                astrologerId={astrologerId}
                onDateSelect={(date) => {
                  setModalData((p) => ({ ...p, selectedDate: date, selectedSlot: null }));
                  setShowAllSlots(false);
                  fetchSlots(date);
                }}
                setSlotsError={setSlotsError}
                duration={currentDuration}
                isUrgentMode={isUrgentBooking}
              />
            ) : (
              <DatePicker
                selectedDate={modalData.selectedDate}
                astrologerId={astrologerId}
                onDateSelect={(date) => {
                  setModalData((p) => ({ ...p, selectedDate: date, selectedSlot: null }));
                  setShowAllSlots(false);
                  fetchSlots(date);
                }}
                setSlotsError={setSlotsError}
                duration={currentDuration}
              />
            )}
          </div>

          {/* Time slots area */}
          {modalData.selectedDate && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Available Time Slots</label>
                <span className="text-sm text-gray-500">{moment(modalData.selectedDate).format('DD MMM YYYY')}</span>
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center gap-2 py-6 bg-gray-50 rounded-lg text-gray-500 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#980d0d]" />
                  Loading available times...
                </div>
              ) : slotsError ? (
                <div className="text-center py-6 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 mb-2">Failed to load slots</p>
                  <button
                    onClick={() => modalData.selectedDate && fetchSlots(modalData.selectedDate)}
                    className="px-4 py-2 bg-[#980d0d] text-white rounded-md text-sm hover:bg-[#7a0a0a]"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* ── Slot grid ── */}
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">

                    {/* Existing available slots */}
                    {displaySlots.map((slot, idx) => {
                      const selected =
                        modalData.selectedSlot?.fromTime === slot.fromTime &&
                        modalData.selectedSlot?.toTime === slot.toTime;
                      return (
                        <button
                          key={`${slot.fromTime}-${idx}`}
                          onClick={() => {
                            setModalData((p) => ({ ...p, selectedSlot: slot }));
                            setShowConsultationForm(true);
                            setShowCreateSlotPanel(false);
                          }}
                          className={`px-3 py-3 rounded-lg text-sm font-semibold border-2 transition-all ${
                            selected
                              ? 'bg-[#980d0d] text-white border-[#980d0d] shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-[#980d0d] hover:bg-red-50'
                          }`}
                        >
                          <div className="text-center font-bold">{formatTime(slot.fromTime)}</div>
                        </button>
                      );
                    })}

                    {/* ✚ Add New Slot button — always visible inside the grid */}
                    <button
                      onClick={() => {
                        const opening = !showCreateSlotPanel;
                        setShowCreateSlotPanel(opening);
                        if (opening) {
                          // Pre-fill fromDate & toDate with selected date
                          setNewSlotForm((f) => ({
                            ...f,
                            fromDate: modalData.selectedDate || today,
                            toDate: modalData.selectedDate || today,
                          }));
                          // Reset to first available duration
                          if (slotDurationsFromApi.length > 0) {
                            setCreateDuration(slotDurationsFromApi[0].slotDuration);
                          } else {
                            setCreateDuration(currentDuration);
                          }
                        }
                        setCreateSlotResult(null);
                      }}
                      className={`px-3 py-3 rounded-lg text-sm font-semibold border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${
                        showCreateSlotPanel
                          ? 'bg-[#980d0d]/10 border-[#980d0d] text-[#980d0d]'
                          : 'bg-white border-gray-300 text-gray-500 hover:border-[#980d0d] hover:text-[#980d0d] hover:bg-red-50'
                      }`}
                      title="Create a new slot"
                    >
                      {showCreateSlotPanel ? <X size={18} /> : <Plus size={18} />}
                      <span className="text-xs">{showCreateSlotPanel ? 'Cancel' : 'New Slot'}</span>
                    </button>

                  </div>

                  {/* Show more / less */}
                  {hasMoreSlots && !showAllSlots && (
                    <button
                      onClick={() => setShowAllSlots(true)}
                      className="w-full py-2 text-sm text-[#980d0d] font-medium hover:bg-red-50 rounded-lg border border-dashed border-[#980d0d]"
                    >
                      + {allAvailableSlots.length - 8} More Slots
                    </button>
                  )}
                  {hasMoreSlots && showAllSlots && (
                    <button
                      onClick={() => setShowAllSlots(false)}
                      className="w-full py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-dashed border-gray-400"
                    >
                      Show Less
                    </button>
                  )}

                  {displaySlots.length === 0 && !showCreateSlotPanel && (
                    <p className="text-center text-sm text-gray-500 pt-1">
                      No slots for this date. Click <strong>+ New Slot</strong> to create one.
                    </p>
                  )}
                </>
              )}

              {/* ══════════════════════════════════════════════════════
                  NEW SLOT CREATION PANEL — inline, below grid
              ══════════════════════════════════════════════════════ */}
              {showCreateSlotPanel && (
                <div className="mt-3 p-4 bg-orange-50 border-2 border-dashed border-[#980d0d]/40 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#980d0d]" />
                    <h4 className="text-sm font-bold text-[#980d0d]">Create New Slot</h4>
                  </div>

                  {/* Duration selector — from API */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Select Duration</label>
                    <div className="flex flex-wrap gap-2">
                      {(slotDurationsFromApi.length > 0
                        ? slotDurationsFromApi
                        : [{ slotDuration: 15 }, { slotDuration: 30 }, { slotDuration: 45 }]
                      ).map((d) => (
                        <button
                          key={d.slotDuration}
                          type="button"
                          onClick={() => {
                            setCreateDuration(d.slotDuration);
                            setCreateSlotResult(null);
                            // Recalculate toTime if fromTime already set
                            if (newSlotForm.fromTime) {
                              const [h, m] = newSlotForm.fromTime.split(':').map(Number);
                              const totalMins = h * 60 + m + d.slotDuration;
                              const th = Math.floor(totalMins / 60) % 24;
                              const tm = totalMins % 60;
                              const autoTo = `${String(th).padStart(2, '0')}:${String(tm).padStart(2, '0')}`;
                              setNewSlotForm((f) => ({ ...f, toTime: autoTo }));
                            }
                          }}
                          disabled={isCreatingSlot}
                          className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                            createDuration === d.slotDuration
                              ? 'bg-[#980d0d] text-white border-[#980d0d]'
                              : 'border-gray-300 text-gray-600 hover:border-[#980d0d] hover:bg-red-50'
                          }`}
                        >
                          {d.slotDuration} Min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Result banner */}
                  {createSlotResult && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                      createSlotResult.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {createSlotResult.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                      <span>{createSlotResult.message}</span>
                    </div>
                  )}

                  {/* Date range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">From Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                          type="date"
                          min={today}
                          value={newSlotForm.fromDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewSlotForm((f) => ({
                              ...f,
                              fromDate: val,
                              toDate: f.toDate && f.toDate < val ? val : f.toDate,
                            }));
                            setCreateSlotResult(null);
                          }}
                          disabled={isCreatingSlot}
                          className="w-full pl-8 pr-2 py-2 text-xs border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#980d0d] transition-colors disabled:opacity-50 disabled:bg-gray-50 text-gray-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">To Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                          type="date"
                          min={newSlotForm.fromDate || today}
                          value={newSlotForm.toDate}
                          onChange={(e) => { setNewSlotForm((f) => ({ ...f, toDate: e.target.value })); setCreateSlotResult(null); }}
                          disabled={isCreatingSlot || !newSlotForm.fromDate}
                          className="w-full pl-8 pr-2 py-2 text-xs border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#980d0d] transition-colors disabled:opacity-50 disabled:bg-gray-50 text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Time range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Start Time</label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                          type="time"
                          value={newSlotForm.fromTime}
                          onChange={(e) => {
                            const from = e.target.value;
                            // Auto-calculate toTime based on createDuration
                            let autoTo = '';
                            if (from && createDuration) {
                              const [h, m] = from.split(':').map(Number);
                              const totalMins = h * 60 + m + createDuration;
                              // Cap at 23:59 but allow multi-hour durations
                              const th = Math.floor(totalMins / 60) % 24;
                              const tm = totalMins % 60;
                              autoTo = `${String(th).padStart(2, '0')}:${String(tm).padStart(2, '0')}`;
                            }
                            setNewSlotForm((f) => ({ ...f, fromTime: from, ...(autoTo ? { toTime: autoTo } : {}) }));
                            setCreateSlotResult(null);
                          }}
                          disabled={isCreatingSlot}
                          className="w-full pl-8 pr-2 py-2 text-xs border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#980d0d] transition-colors disabled:opacity-50 disabled:bg-gray-50 text-gray-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">End Time</label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                          type="time"
                          value={newSlotForm.toTime}
                          onChange={(e) => { setNewSlotForm((f) => ({ ...f, toTime: e.target.value })); setCreateSlotResult(null); }}
                          disabled={isCreatingSlot}
                          className="w-full pl-8 pr-2 py-2 text-xs border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#980d0d] transition-colors disabled:opacity-50 disabled:bg-gray-50 text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    {createDuration
                      ? <><strong>{createDuration} min</strong> slots will be generated between start and end time.</>
                      : 'Please select a duration above.'}
                  </p>

                  <button
                    onClick={handleCreateSlot}
                    disabled={isCreatingSlot || !newSlotForm.fromDate || !newSlotForm.toDate || !newSlotForm.fromTime || !newSlotForm.toTime || !createDuration}
                    className="w-full py-2.5 bg-[#980d0d] text-white rounded-lg text-sm font-semibold hover:bg-[#7a0a0a] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingSlot ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating Slots...</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Create & Add Slots</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No slots + no date selected */}
          {hasFutureSlots === false && !modalData.selectedDate && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-medium">No Future Slots Available</p>
              <p className="text-gray-500 text-sm mt-1">Select a date and click <strong>+ New Slot</strong> to create one.</p>
              <button
                onClick={() => { hasCheckedAvailability.current = false; checkAvailableDurations(); }}
                className="mt-4 px-4 py-2 bg-[#980d0d] text-white rounded-lg text-sm hover:bg-[#7a0a0a] transition-colors"
              >
                Refresh Availability
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 4 — Customer Details
        ══════════════════════════════════════════════════════ */}
        {showConsultationForm && (selectedSlotRef.current?._id ?? modalData.selectedSlot?._id) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#980d0d] text-white flex items-center justify-center text-sm font-bold">4</div>
              <h3 className="text-base font-semibold text-gray-800">Customer Details</h3>
            </div>
            <ConsultationForm
              onFormDataChange={(data: FormOutput) => setConsultationFormData(data)}
              onValidationChange={(valid: boolean) => setIsFormValid(valid)}
              onCustomerSessionChange={(session: CustomerSession | null) => {
                setCustomerSession(session);
                if (!session) {
                  setIsFormValid(false);
                  setIsNewCustomer(false);
                  setGlobalOfferPrice(null);
                }
              }}
              astrologerId={astrologerId}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            Book Button
        ══════════════════════════════════════════════════════ */}
        {showConsultationForm && (selectedSlotRef.current?._id ?? modalData.selectedSlot?._id) && (
          <div className="mt-2">
            <button
              onClick={handleDirectBooking}
              disabled={isBookDisabled || isBooking}
              className="w-full py-3 border-2 border-dashed border-[#980d0d] text-[#980d0d] rounded-lg font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {isBooking ? 'Booking...' : 'Book Consultation'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-1">
              Click to confirm and book the consultation
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default SlotBookingSection;