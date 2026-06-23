import { z } from 'zod';

// Tab 0: Basic Info Validation
export const basicInfoSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  pujaName: z.string().min(3, 'Puja name must be at least 3 characters'),
  price: z.string()
    .min(1, 'Price is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Price must be a positive number'
    }),
  adminCommission: z.string()
    .min(1, 'Admin commission is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
      message: 'Commission must be between 0 and 100'
    }),
  overview: z.string().min(10, 'Overview must be at least 10 characters'),
  duration: z.string().optional(),
  purpose: z.string().min(1, 'Purpose is required'),
  mode: z.string().min(1, 'Mode is required'),
  inclusion: z.string().min(1, 'Inclusion is required'),
  discountedPrice : z.string().optional(),
  subTitle: z.string().max(100, 'Subtitle cannot exceed 100 characters').optional(),
});

// Images Validation (part of Tab 0 in UI)
export const imagesSchema = z.object({
  mainImage: z.object({
    file: z.string().min(1, 'Main image is required'),
    bytes: z.any().nullable(),
    url: z.string()
  }).refine((img) => img.file.length > 0, {
    message: 'Main image is required'
  }),
});

// Tab 1: Details Validation
export const detailsSchema = z.object({
  pujaDetails: z.string().min(20, 'Puja details must be at least 20 characters'),
  whyPerform: z.string().min(20, 'Why perform section must be at least 20 characters'),
});

// Tab 2: Benefits Validation
export const benefitsSchema = z.object({
  benefits: z.array(z.string().min(1, 'Benefit cannot be empty'))
    .min(1, 'At least one benefit is required')
    .refine((arr) => arr.some(item => item.trim().length > 0), {
      message: 'At least one valid benefit is required'
    }),
});

// Tab 3: Who Should Book Validation
export const whoShouldBookSchema = z.object({
  whoShouldBook: z.array(z.string().min(1, 'Entry cannot be empty'))
    .min(1, 'At least one entry is required')
    .refine((arr) => arr.some(item => item.trim().length > 0), {
      message: 'At least one valid entry is required'
    }),
});

// Tab 4: Why You Should Validation
export const whyYouShouldSchema = z.object({
  whyYouShould: z.array(
    z.object({
      title: z.string().min(3, 'Title must be at least 3 characters'),
      description: z.string().min(10, 'Description must be at least 10 characters'),
      icon: z.string().min(1, 'Icon is required'),
      _id: z.string().optional(),
    })
  ).min(1, 'At least one reason is required'),
});

// Tab 5: Packages Validation
export const packagesSchema = z.object({
  pricingPackages: z.array(
    z.object({
      id: z.number(),
      title: z.string().min(3, 'Package title must be at least 3 characters'),
      price: z.number().min(1, 'Package price must be greater than 0'),
      isPopular: z.boolean(),
      features: z.array(z.string().min(1, 'Feature cannot be empty'))
        .min(1, 'At least one feature is required')
        .refine((arr) => arr.some(item => item.trim().length > 0), {
          message: 'At least one valid feature is required'
        }),
      originalPrice: z.number().optional(),
      discount: z.string().optional(),
      duration: z.string().optional(),
      validity: z.string().optional(),
    })
  ).min(1, 'At least one package is required'),
});

// Tab 6: Testimonials Validation (Optional)
export const testimonialsSchema = z.object({
  testimonials: z.array(
    z.object({
      id: z.number(),
      highlight: z.string().optional(),
      quote: z.string().min(10, 'Quote must be at least 10 characters'),
      name: z.string().min(2, 'Name must be at least 2 characters'),
      location: z.string().min(2, 'Location must be at least 2 characters'),
      rating: z.number().optional(),
      verified: z.boolean().optional(),
      date: z.string().optional(),
    })
  ).optional(),
});

// Tab 7: FAQs Validation (Optional)
export const faqsSchema = z.object({
  faqs: z.array(
    z.object({
      id: z.number(),
      question: z.string().min(5, 'Question must be at least 5 characters'),
      answer: z.string().min(10, 'Answer must be at least 10 characters'),
    })
  ).optional(),
});

// Combined validation for final submit
export const fullPujaSchema = z.object({
  ...basicInfoSchema.shape,
  ...detailsSchema.shape,
}).merge(benefitsSchema)
  .merge(whoShouldBookSchema)
  .merge(whyYouShouldSchema)
  .merge(packagesSchema);

// Helper function to validate specific tab
export const validateTab = (tabIndex: number, data: any) => {
  try {
    switch (tabIndex) {
      case 0: // Basic Info + Images (UI Tab 0)
        // First validate basic info
        const basicData = {
          categoryId: data.categoryId || '',
          pujaName: data.pujaName || '',
          price: data.price || '',
          adminCommission: data.adminCommission || '',
          overview: data.overview || '',
          duration: data.duration || '',
          purpose: data.purpose || '',
          mode: data.mode || '',
          inclusion: data.inclusion || '',
          discountedPrice: data.discountedPrice || '',
          subTitle: data.subTitle || ''
        };
        basicInfoSchema.parse(basicData);
        
        // Then validate main image
        if (data.mainImage) {
          imagesSchema.parse({ mainImage: data.mainImage });
        } else {
          throw new z.ZodError([{
            code: 'custom',
            path: ['mainImage', 'file'],
            message: 'Main image is required'
          }]);
        }
        return { success: true, errors: null };
      
      case 1: // Details (UI Tab 1)
        detailsSchema.parse(data);
        return { success: true, errors: null };
      
      case 2: // Benefits (UI Tab 2)
        benefitsSchema.parse(data);
        return { success: true, errors: null };
      
      case 3: // Who Should Book (UI Tab 3)
        whoShouldBookSchema.parse(data);
        return { success: true, errors: null };
      
      case 4: // Why You Should (UI Tab 4)
        whyYouShouldSchema.parse(data);
        return { success: true, errors: null };
      
      case 5: // Packages (UI Tab 5)
        packagesSchema.parse(data);
        return { success: true, errors: null };
      
      case 6: // Testimonials (UI Tab 6) - optional
        if (data.testimonials && data.testimonials.length > 0) {
          testimonialsSchema.parse(data);
        }
        return { success: true, errors: null };
      
      case 7: // FAQs (UI Tab 7) - optional
        if (data.faqs && data.faqs.length > 0) {
          faqsSchema.parse(data);
        }
        return { success: true, errors: null };
      
      default:
        return { success: true, errors: null };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { success: false, errors: [{ path: 'unknown', message: 'Validation failed' }] };
  }
};