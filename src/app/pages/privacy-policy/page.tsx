'use client'
import React, { useState, useEffect } from 'react';
import StaticPageEditor from '@/components/common/Addblogeditor';
import { base_url } from '@/lib/api-routes';

const PrivacyPolicyPage: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const getEndpoint = `/api/admin/get-privacy-policy`;
  const createEndpoint = `/api/admin/add-privacy-policy`;

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(getEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add auth token if needed
            // 'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        setContent(data?.privacyPolicy?.description || '');
      } catch (error) {
        console.error('Error fetching privacy policy:', error);
        setContent('');
      } finally {
        setLoading(false);
      } 
    };

    fetchData();
  }, []);

  return (
  <div className='p-4'>
    <StaticPageEditor
      title="Privacy Policy"
      initialContent={content}
      createEndpoint={createEndpoint}
      hasTypeSelector={false}
      loading={loading}
    />
    </div>
  );
};

export default PrivacyPolicyPage;
