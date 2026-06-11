'use client'
import React, { useState, useEffect } from 'react';
import { base_url } from '@/lib/api-routes';
import StaticPageEditor from '@/components/common/Addblogeditor';

const TermsAndConditionsPage: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [type, setType] = useState<string>('Astrologer');
  const [loading, setLoading] = useState<boolean>(false);

  const getEndpoint = `/api/admin/get-terms-condition`;
  const createEndpoint = `/api/admin/add-terms-condition`;

  // Fetch data when type changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setContent(''); // Clear content before fetching new data
        console.log('Fetching data for type:', type); // Debug log
        
        const response = await fetch(getEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add auth token if needed
            // 'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ type }),
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        console.log('Received data:', data); // Debug log
        
        const description = data?.termsAndCondition?.description || '';
        console.log('Setting content, length:', description.length); // Debug log
        
        setContent(description);
      } catch (error) {
        console.error('Error fetching terms and conditions:', error);
        setContent('');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  const handleTypeChange = (newType: string) => {
    console.log('Type changed to:', newType); // Debug log
    setType(newType);
  };

  return (
    <div className='p-4'>

    <StaticPageEditor
      key={`${type}-${content.length}`} // Force re-render when type or content changes
      title="Terms And Conditions"
      initialContent={content}
      createEndpoint={createEndpoint}
      hasTypeSelector={true}
      selectedType={type}
      onTypeChange={handleTypeChange}
      loading={loading}
    />
    </div>
  );
};

export default TermsAndConditionsPage;

// import React from 'react'

// const page = () => {
//   return (
//     <div className='p-20'>
//       T&C under progress...........
//     </div>
//   )
// }

// export default page
