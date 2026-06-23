'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { 
  Home, BookOpen, Images, Star, Target, Users, 
  BanknoteIcon, MessageSquare, Shield, Save, X,
  Upload, Plus, Trash2, CheckCircle, Loader2,
  ArrowLeft, Eye, AlertCircle
} from 'lucide-react';

// Zod validation import
import { validateTab } from "@/lib/pujaValidation";
// Tab Components
import BasicInfoTab from "@/components/puja/BasicInfoTab";
import DetailsTab from "@/components/puja/DetailsTab";
import ImagesTab from "@/components/puja/ImagesTab";
import BenefitsTab from "@/components/puja/BenefitsTab";
import WhyPerformTab from "@/components/puja/WhyPerformTab";
import WhoShouldBookTab from "@/components/puja/WhoShouldBookTab";
import PackagesTab from "@/components/puja/PackagesTab";
import TestimonialsTab from "@/components/puja/TestimonialsTab";
import FAQsTab from "@/components/puja/FAQsTab";

// Types
interface Category {
  _id: string;
  categoryName: string;
}

interface InputFieldDetail {
  categoryId: string;
  pujaName: string;
  pujaDay?: string;
  pujaVenue?: string;
  price: string;
  adminCommission: string;
  overview: string;
  whyPerform: string;
  pujaDetails: string;
  duration: string;
  inclusion?: string;
  mode: string;
  purpose: string;
  discountedPrice?: string;
  subTitle?: string;
}

interface ImageState {
  file: string;
  bytes: File | null;
  url: string;
}

interface PricingPackage {
  id: number;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  isPopular: boolean;
  features: string[];
  duration?: string;
  validity?: string;
}

interface Testimonial {
  id: number;
  highlight: string;
  quote: string;
  name: string;
  location: string;
  rating?: number;
  verified?: boolean;
  date?: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

// API Functions
const getPujaById = async (id: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/get_puja_by/${id}`);
    if (!response.ok) throw new Error('Failed to fetch puja');
    const data = await response.json();
    return data.data || data.puja;
  } catch (error) {
    console.error('Error fetching puja:', error);
    return null;
  }
};

const getCategories = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja/get_puja_category`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
};

const createPuja = async (formData: FormData) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/create_puja`, {
      method: 'POST',
      body: formData,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

const updatePuja = async (id: string, formData: FormData) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/puja-new/update-puja/${id}`, {
      method: 'PUT',
      body: formData,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Main Component
const AddPujaContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const mode = editId ? 'Edit' : 'Add';

  // State Management
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [pujaName, setPujaName] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const [mobileImage, setMobileImage] = useState<ImageState>({ file: '', bytes: null, url: '' });
  const [mobileImagePreview, setMobileImagePreview] = useState<string>('');
  // Main form state
  const [inputFieldDetail, setInputFieldDetail] = useState<InputFieldDetail>({
    categoryId: '',
    pujaName: '',
    pujaDay: '',
    pujaVenue: '',
    price: '',
    adminCommission: '',
    overview: '',
    whyPerform: '',
    pujaDetails: '',
    duration: '',
    mode: '',
    inclusion: '',
    purpose: '',
    discountedPrice : '',
    subTitle: ''
  });

  const [image, setImage] = useState<ImageState>({ 
    file: '', 
    bytes: null, 
    url: '' 
  });

  // Dynamic arrays
  const [benefits, setBenefits] = useState<string[]>(['']);
  
  const [whyYouShould, setWhyYouShould] = useState([
    { 
      _id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: '', 
      description: '', 
      icon: 'Target' 
    }
  ]);
  
  const [whoShouldBook, setWhoShouldBook] = useState<string[]>(['']);
  
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([
    { id: 1, title: '', price: 0, isPopular: false, features: [''] }
  ]);
  
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    { id: 1, highlight: '', quote: '', name: '', location: '' }
  ]);
  
  const [faqs, setFaqs] = useState<FAQ[]>([
    { id: 1, question: '', answer: '' }
  ]);

  // Gallery
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // Tabs
  const tabs = [
    { id: 0, label: 'Basic Info', icon: <Home className="w-4 h-4" /> },
    { id: 1, label: 'Details', icon: <BookOpen className="w-4 h-4" /> },
    { id: 2, label: 'Benefits', icon: <Star className="w-4 h-4" /> },
    { id: 3, label: 'Who Should Book', icon: <Users className="w-4 h-4" /> },
    { id: 4, label: 'Why Should You Perform', icon: <Target className="w-4 h-4" /> },
    { id: 5, label: 'Packages', icon: <BanknoteIcon className="w-4 h-4" /> },
    { id: 6, label: 'Testimonials', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 7, label: 'FAQs', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  // Validation function for current tab
  const validateCurrentTab = () => {
    let dataToValidate: any = {};

    switch (activeTab) {
      case 0: // Basic Info
        dataToValidate = {
          ...inputFieldDetail,
          mainImage: image
        };
        break;
      
      case 1: // Details
        dataToValidate = {
          pujaDetails: inputFieldDetail.pujaDetails,
          whyPerform: inputFieldDetail.whyPerform
        };
        break;
      
      case 2: // Benefits
        dataToValidate = { benefits };
        break;
      
      case 3: // Who Should Book
        dataToValidate = { whoShouldBook };
        break;
      
      case 4: // Why You Should
        dataToValidate = { whyYouShould };
        break;
      
      case 5: // Packages
        dataToValidate = { pricingPackages };
        break;
      
      case 6: // Testimonials (optional)
        dataToValidate = { testimonials };
        break;
      
      case 7: // FAQs (optional)
        dataToValidate = { faqs };
        break;
      
      default:
        return { success: true, errors: null };
    }

    const result = validateTab(activeTab, dataToValidate);
    
    if (!result.success && result.errors) {
      setValidationErrors(result.errors);
      
      // Create field errors map
      const errors: Record<string, string> = {};
      result.errors.forEach((err: any) => {
        // err.path is already a string from validateTab function
        errors[err.path] = err.message;
      });
      setFieldErrors(errors);
    } else {
      setValidationErrors([]);
      setFieldErrors({});
    }

    return result;
  };

  // Handle next tab
  const handleNextTab = () => {
    setHasAttemptedNext(true); // Mark that user tried to go next
    
    const validation = validateCurrentTab();

    
    if (validation.success) {
      setActiveTab(prev => Math.min(tabs.length - 1, prev + 1));
      setHasAttemptedNext(false); // Reset for next tab
      setFieldErrors({}); // Clear errors when moving to next tab
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log('Field errors should be:', fieldErrors);
    }
  };

  // Check if current tab is valid
  const isCurrentTabValid = () => {
    const validation = validateTab(activeTab, getCurrentTabData());
    return validation.success;
  };

  const getCurrentTabData = () => {
    switch (activeTab) {
      case 0:
        return { 
          categoryId: inputFieldDetail.categoryId,
          pujaName: inputFieldDetail.pujaName,
          price: inputFieldDetail.price,
          adminCommission: inputFieldDetail.adminCommission,
          overview: inputFieldDetail.overview,
          duration: inputFieldDetail.duration,
          mainImage: image 
        };
      case 1:
        return { pujaDetails: inputFieldDetail.pujaDetails, whyPerform: inputFieldDetail.whyPerform };
      case 2:
        return { benefits };
      case 3:
        return { whoShouldBook };
      case 4:
        return { whyYouShould };
      case 5:
        return { pricingPackages };
      case 6:
        return { testimonials };
      case 7:
        return { faqs };
      default:
        return {};
    }
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const categoriesData = await getCategories();
      setCategories(categoriesData);

      if (editId) {
        const pujaData = await getPujaById(editId);
        if (pujaData) {
          setPujaName(pujaData.title || pujaData.pujaName || '');
          setInputFieldDetail({
            categoryId: pujaData.categoryId || '',
            pujaName: pujaData.title || pujaData.pujaName || '',
            pujaDay: pujaData.pujaDay || '',
            pujaVenue: pujaData.pujaVenue || '',
            price: pujaData.price?.toString() || '',
            adminCommission: pujaData.adminCommission?.toString() || '',
            overview: pujaData.overview || '',
            whyPerform: pujaData.whyPerform || '',
            pujaDetails: pujaData.pujaDetails || '',
            duration: pujaData.duration || '',
            mode: pujaData.mode || '',
            inclusion: pujaData.inclusion || '',  
            purpose: pujaData.purpose || '',
            discountedPrice : pujaData.discountedPrice?.toString() || '',
            subTitle : pujaData.subTitle || ''
          });

          if ( pujaData.mainImage) {
            const imgUrl =  pujaData.mainImage;
            setImage({
              file: imgUrl,
              bytes: null,
              url: `${process.env.NEXT_PUBLIC_IMAGE_URL3}${imgUrl}`
            });
            setImagePreview(`${process.env.NEXT_PUBLIC_IMAGE_URL3}${imgUrl}`);
          }

          if (pujaData.whyYouShould && Array.isArray(pujaData.whyYouShould)) {
            const formattedWhyYouShould = pujaData.whyYouShould.map((item: any, index: number) => ({
              _id: item._id || `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
              title: item.title || '',
              description: item.description || '',
              icon: item.icon || 'Target'
            }));
            
            setWhyYouShould(formattedWhyYouShould.length > 0 ? formattedWhyYouShould : [
              { 
                _id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
                title: '', 
                description: '', 
                icon: 'Target' 
              }
            ]);
          }

          if (pujaData.benefits) {
            if (typeof pujaData.benefits === 'string') {
              const benefitsArray = pujaData.benefits.split(',').map((b: any) => b.trim()).filter((b: any) => b !== '');
              setBenefits(benefitsArray.length > 0 ? benefitsArray : ['']);
            } else if (Array.isArray(pujaData.benefits)) {
              setBenefits(pujaData.benefits.filter((b: any) => b && b.trim() !== ''));
            }
          }

          if (pujaData.whoShouldBook) {
            if (typeof pujaData.whoShouldBook === 'string') {
              const whoShouldBookArray = pujaData.whoShouldBook.split(',').map((w: any) => w.trim()).filter((w: any) => w !== '');
              setWhoShouldBook(whoShouldBookArray.length > 0 ? whoShouldBookArray : ['']);
            } else if (Array.isArray(pujaData.whoShouldBook)) {
              setWhoShouldBook(pujaData.whoShouldBook.filter((w: any) => w && w.trim() !== ''));
            }
          }

          if (pujaData.pricingPackages && pujaData.pricingPackages.length > 0) {
            const mappedPackages = pujaData.pricingPackages.map((pkg: any, index: number) => ({
              id: index + 1,
              title: pkg.title || '',
              price: pkg.price || 0,
              originalPrice: pkg.originalPrice,
              discount: pkg.discount,
              isPopular: pkg.isPopular || false,
              features: pkg.features || [],
              duration: pkg.duration,
              validity: pkg.validity
            }));
            setPricingPackages(mappedPackages);
          }

          if (pujaData.testimonials && pujaData.testimonials.length > 0) {
            const mappedTestimonials = pujaData.testimonials.map((testimonial: any, index: number) => ({
              id: index + 1,
              highlight: testimonial.highlight || '',
              quote: testimonial.quote || '',
              name: testimonial.name || '',
              location: testimonial.location || ''
            }));
            setTestimonials(mappedTestimonials);
          }

          if (pujaData.faqs && pujaData.faqs.length > 0) {
            const mappedFaqs = pujaData.faqs.map((faq: any, index: number) => ({
              id: index + 1,
              question: faq.question || '',
              answer: faq.answer || ''
            }));
            setFaqs(mappedFaqs);
          }

          if (pujaData.mobileImage) {
            const imgUrl = pujaData.mobileImage;
            setMobileImage({
              file: imgUrl,
              bytes: null,
              url: `${process.env.NEXT_PUBLIC_IMAGE_URL3}${imgUrl}`
            });
            setMobileImagePreview(`${process.env.NEXT_PUBLIC_IMAGE_URL3}${imgUrl}`);
          }
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [editId]);

  // Real-time validation on data change
  useEffect(() => {
    // Only validate if user has attempted to go next
    if (hasAttemptedNext) {
      validateCurrentTab();
    }
  }, [inputFieldDetail, image, benefits, whoShouldBook, whyYouShould, pricingPackages, testimonials, faqs, activeTab, hasAttemptedNext]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setInputFieldDetail(prev => ({ ...prev, [name]: checked }));
    } else {
      setInputFieldDetail(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // ✅ 3MB size validation
      if (file.size > 3 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, mainImage: 'Image size must be less than 3MB' }));
        e.target.value = '';
        return;
      }

      // Clear error if valid
      setFieldErrors(prev => ({ ...prev, mainImage: '' }));

      const previewUrl = URL.createObjectURL(file);
      setImage({
        file: file.name,
        bytes: file,
        url: previewUrl
      });
      setImagePreview(previewUrl);
    }
  };

  const handleMainImageUpload = (file: File, previewUrl: string) => {
  setImage({ file: file.name, bytes: file, url: previewUrl });
  setImagePreview(previewUrl);
};

const handleMobileImageUpload = (file: File, previewUrl: string) => {
  setMobileImage({ file: file.name, bytes: file, url: previewUrl });
  setMobileImagePreview(previewUrl);
};

  // Handle gallery images
  const handleGalleryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setGalleryImages(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addItem = <T extends { id?: number; _id?: string }>(
    array: T[],
    setArray: React.Dispatch<React.SetStateAction<T[]>>,
    template: Omit<T, 'id' | '_id'>
  ) => {
    if (array.length > 0 && 'id' in array[0] && typeof array[0].id === 'number') {
      const newId = array.length > 0 ? Math.max(...array.map(item => item.id || 0)) + 1 : 1;
      setArray([...array, { ...template, id: newId } as T]);
    } else {
      const uniqueId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setArray([...array, { ...template, _id: uniqueId } as T]);
    }
  };

  const updateItem = <T extends { id?: number; _id?: string }>(
    array: T[],
    setArray: React.Dispatch<React.SetStateAction<T[]>>,
    identifier: number | string,
    field: keyof T,
    value: any
  ) => {
    setArray(array.map(item => {
      if (item._id && item._id === identifier) {
        return { ...item, [field]: value };
      }
      if (item.id && item.id === identifier) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeItem = <T extends { id?: number; _id?: string }>(
    array: T[],
    setArray: React.Dispatch<React.SetStateAction<T[]>>,
    identifier: number | string
  ) => {
    if (array.length > 1) {
      setArray(array.filter(item => {
        const matches_id = item._id && item._id === identifier;
        const matches_id_numeric = item.id && item.id === identifier;
        return !(matches_id || matches_id_numeric);
      }));
    }
  };

  const updatePackageFeature = (packageId: number, featureIndex: number, value: string) => {
    setPricingPackages(packages => 
      packages.map(pkg => {
        if (pkg.id === packageId) {
          const newFeatures = [...pkg.features];
          newFeatures[featureIndex] = value;
          return { ...pkg, features: newFeatures };
        }
        return pkg;
      })
    );
  };

  const addPackageFeature = (packageId: number) => {
    setPricingPackages(packages => 
      packages.map(pkg => 
        pkg.id === packageId 
          ? { ...pkg, features: [...pkg.features, ''] }
          : pkg
      )
    );
  };

  const removePackageFeature = (packageId: number, featureIndex: number) => {
    setPricingPackages(packages => 
      packages.map(pkg => {
        if (pkg.id === packageId) {
          const newFeatures = pkg.features.filter((_, i) => i !== featureIndex);
          return { ...pkg, features: newFeatures.length > 0 ? newFeatures : [''] };
        }
        return pkg;
      })
    );
  };

  const handlePopularPackageChange = (packageId: number) => {
    setPricingPackages(packages => 
      packages.map(pkg => ({
        ...pkg,
        isPopular: pkg.id === packageId
      }))
    );
  };

  // Final validation before submit
  const validateAllTabs = () => {
    const validations = [
      { tab: 0, data: { ...inputFieldDetail, mainImage: image } },
      { tab: 1, data: { pujaDetails: inputFieldDetail.pujaDetails, whyPerform: inputFieldDetail.whyPerform } },
      { tab: 2, data: { benefits } },
      { tab: 3, data: { whoShouldBook } },
      { tab: 4, data: { whyYouShould } },
      { tab: 5, data: { pricingPackages } },
    ];

    for (const { tab, data } of validations) {
      const result = validateTab(tab, data);
      if (!result.success) {
        setActiveTab(tab);
        setValidationErrors(result.errors || []);
        
        Swal.fire({
          icon: 'error',
          title: `Please complete ${tabs[tab].label}`,
          html: `<div style="text-align: left;">${result.errors?.map((err: any) => 
            `<p style="margin: 8px 0;">• ${err.message}</p>`
          ).join('')}</div>`,
          confirmButtonColor: '#dc2626'
        });
        return false;
      }
    }
    return true;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAllTabs()) return;
    
    setSaving(true);

    try {
      const formData = new FormData();
      
      Object.entries(inputFieldDetail).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      if (mobileImage.bytes) {
        formData.append('mobileImage', mobileImage.bytes);
      }

      const benefitsArray = benefits.map(benefit => benefit.trim()).filter(benefit => benefit !== '');
      formData.append("benefits", JSON.stringify(benefitsArray));
      
      const whoShouldBookArray = whoShouldBook.map(item => item.trim()).filter(item => item !== '');
      formData.append("whoShouldBook", JSON.stringify(whoShouldBookArray));
      
      formData.append("whyYouShould", JSON.stringify(
        whyYouShould.map(item => ({
          title: item.title,
          description: item.description,
          icon: item.icon,
        }))
      ));
      
      formData.append("pricingPackages", JSON.stringify(pricingPackages));
      formData.append("testimonials", JSON.stringify(testimonials));
      formData.append("faqs", JSON.stringify(faqs));

      if (image.bytes) {
        formData.append("image", image.bytes);
      }

      galleryImages.forEach((img) => {
        formData.append("galleryImages", img);
      });

      let success;
      if (editId) {
        success = await updatePuja(editId, formData);
      } else {
        success = await createPuja(formData);
      }

      if (success) {
        Swal.fire({
          icon: 'success',
          title: `Puja ${editId ? 'Updated' : 'Created'} Successfully!`,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          router.push('/pooja');
        });
      } else {
        throw new Error(`Failed to ${editId ? 'update' : 'create'} puja`);
      }
    } catch (error) {
      Swal.fire('Error!', 'Something went wrong. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto mb-2" />
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    const props = {
      inputFieldDetail,
      setInputFieldDetail,
      handleInputChange,
      categories,
      benefits,
      setBenefits,
      whyYouShould,
      setWhyYouShould,
      whoShouldBook,
      setWhoShouldBook,
      pricingPackages,
      setPricingPackages,
      testimonials,
      setTestimonials,
      faqs,
      setFaqs,
      image,
      imagePreview,
      handleImageUpload,
      galleryImages,
      galleryPreviews,
      handleGalleryImages,
      removeGalleryImage,
      addItem,
      updateItem,
      removeItem,
      updatePackageFeature,
      addPackageFeature,
      removePackageFeature,
      handlePopularPackageChange,
      editId,
      fieldErrors,
      mobileImage,
      mobileImagePreview,
      handleMobileImageUpload,
      handleMainImageUpload,
    };
console.log("imaggggggggggggggggggggggggggggggggg", props.image.file)
    switch (activeTab) {
      case 0:
        return <BasicInfoTab {...props} />;
      case 1:
        return <DetailsTab {...props} />;
      case 2:
        return <BenefitsTab {...props} />;
      case 3:
        return <WhoShouldBookTab {...props} />;
      case 4:
        return <WhyPerformTab {...props} />;
      case 5:
        return <PackagesTab {...props} />;
      case 6:
        return <TestimonialsTab {...props} />;
      case 7:
        return <FAQsTab {...props} />;
      default:
        return <BasicInfoTab {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/pooja')}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">
                  {mode} Puja: {pujaName || 'New Puja'}
                </h1>
                <p className="text-red-100 mt-1">
                  Fill in all required details step by step
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL3}${image.file}`} 
                    alt="Puja" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => {
              const tabData = getCurrentTabData();
              const isValid = validateTab(tab.id, tabData).success;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap font-medium text-sm transition-colors border-b-2 relative ${
                    activeTab === tab.id
                      ? 'text-red-600 border-red-600 bg-red-50'
                      : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {/* {activeTab > tab.id && isValid && (
                    <CheckCircle className="w-4 h-4 text-green-500 absolute -top-1 -right-1" />
                  )} */}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            {renderTabContent()}
            
            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Step {activeTab + 1} of {tabs.length}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(prev => Math.max(0, prev - 1));
                    setValidationErrors([]);
                    setFieldErrors({});
                    setHasAttemptedNext(false); // Reset validation state
                  }}
                  disabled={activeTab === 0}
                  className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Previous
                </button>
                
                {activeTab < tabs.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextTab}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                  >
                    Next Step
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {editId ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editId ? 'Update Puja' : 'Create Puja'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Validation Errors - Below Navigation */}
            {/* REMOVED - No summary box needed */}
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component with Suspense
const AddPuja = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto mb-2" />
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    }>
      <AddPujaContent />
    </Suspense>
  );
};

export default AddPuja;