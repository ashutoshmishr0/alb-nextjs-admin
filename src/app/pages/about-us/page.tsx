'use client'
import React, { useState, useEffect } from 'react';
import { base_url } from '@/lib/api-routes';
import StaticPageEditor from '@/components/common/Addblogeditor';

const AboutUsPage: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const getEndpoint = `/api/admin/get-about-us`;
  const createEndpoint = `/api/admin/add-about-us`;

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
        setContent(data?.about?.description || '');
      } catch (error) {
        console.error('Error fetching about us:', error);
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
      title="About Us"
      initialContent={content}
      createEndpoint={createEndpoint}
      hasTypeSelector={false}
      loading={loading}
    />
    </div>
  );
};

export default AboutUsPage;
