'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import AstrologerForm from '@/components/AstrologerForm';
import EditAstrologer from '@/components/NewAstrologerEdit';

// Inner component that uses useSearchParams
function EditAstrologerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, message: '' });

  useEffect(() => {
    if (!id) {
      setSnack({ open: true, message: 'Astrologer ID is required.' });
      router.replace('/astrologer');
      return;
    }

    const fetchAstrologer = async () => {
      try {
        const res = await fetch(`/api/admin/astrologer_details_by_id`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ astrologerId: id }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch astrologer');
        }

        const result = await res.json();
        console.log('Fetched astrologer:', result);

        if (!result.success || !result.results) {
          throw new Error(result.message || 'No data returned');
        }

        setInitialData(result.results);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setSnack({ open: true, message: err.message || 'Error loading astrologer' });
        router.replace('/astrologer');
      } finally {
        setLoading(false);
      }
    };

    fetchAstrologer();
  }, [id, router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!initialData) return null;

  return (
    <>
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ open: false, message: '' })}
        message={snack.message}
      />

      <Box sx={{ p: 3, bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
        {/* <Typography variant="h5" gutterBottom>
          Edit Astrologer
        </Typography> */}

        {/* <AstrologerForm mode="Edit" initialData={initialData} onSnack={setSnack} /> */}
        <EditAstrologer />

      </Box>
    </>
  );
}

// Main component with Suspense boundary
export default function EditAstrologerPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    }>
      <EditAstrologerContent />
    </Suspense>
  );
}