import { z } from 'zod';

// ========== TAB 0: Basic Info Validation ==========
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
  discountedPrice: z.string().optional(),
  subTitle: z.string().max(100, 'Subtitle cannot exceed 100 characters').optional(),
  pujaDay: z.string().optional(),
  pujaVenue: z.string().optional(),
  templeLocation: z.string().optional(),
});

// ========== IMAGES Validation ==========
export const imagesSchema = z.object({
  mainImage: z.object({
    file: z.string().min(1, 'Main image is required'),
    bytes: z.any().nullable(),
    url: z.string()
  }).refine((img) => img.file.length > 0, {
    message: 'Main image is required'
  }),
  mobileImage: z.object({
    file: z.string().optional(),
    bytes: z.any().nullable(),
    url: z.string()
  }).optional(),
});

// ========== TAB 1: Details Validation ==========
export const detailsSchema = z.object({
  pujaDetails: z.string().min(20, 'Puja details must be at least 20 characters'),
  whyPerform: z.string().min(20, 'Why perform section must be at least 20 characters'),
});

// ========== TAB 2: Benefits Validation ==========
export const benefitsSchema = z.object({
  benefits: z.array(
    z.object({
      title: z.string().min(1, 'Benefit title is required'),
      description: z.string().optional(),
      icon: z.string().optional(),
      _id: z.string().optional(),
    })
  ).min(1, 'At least one benefit is required')
  .refine((arr) => arr.some(item => item.title?.trim().length > 0), {
    message: 'At least one valid benefit with a title is required'
  }),
});

// ========== TAB 3: Vedic Procedure Validation ==========
export const vedicProcedureSchema = z.object({
  vedicProcedureTitle: z.string().min(3, 'Vedic procedure title must be at least 3 characters'),
  vedicProcedureDescription: z.string().min(20, 'Vedic procedure description must be at least 20 characters'),
});

// ========== TAB 4: Who Should Book Validation ==========
export const whoShouldBookSchema = z.object({
  whoShouldBook: z.array(z.string().min(1, 'Entry cannot be empty'))
    .min(1, 'At least one entry is required')
    .refine((arr) => arr.some(item => item.trim().length > 0), {
      message: 'At least one valid entry is required'
    }),
});

// ========== TAB 5: Why You Should Validation ==========
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

// ========== TAB 6: Why Perform Reasons Validation ==========
export const whyPerformReasonsSchema = z.object({
  whyPerformReasons: z.array(
    z.object({
      title: z.string().min(3, 'Title must be at least 3 characters'),
      description: z.string().min(10, 'Description must be at least 10 characters'),
      icon: z.string().min(1, 'Icon is required'),
      _id: z.string().optional(),
    })
  ).min(1, 'At least one reason is required'),
});

// ========== TAB 7: Aashirwad Box Validation ==========
export const aashirwadBoxSchema = z.object({
  aashirwadBox: z.array(z.string().min(1, 'Item cannot be empty'))
    .min(1, 'At least one item is required')
    .refine((arr) => arr.some(item => item.trim().length > 0), {
      message: 'At least one valid item is required'
    }),
});

// ========== TAB 8: Ritual Process Validation ==========
export const ritualProcessSchema = z.object({
  ritualProcess: z.array(
    z.object({
      title: z.string().min(3, 'Step title must be at least 3 characters'),
      description: z.string().min(10, 'Step description must be at least 10 characters'),
      icon: z.string().optional(),
      stepNumber: z.number().min(1, 'Step number must be at least 1'),
      _id: z.string().optional(),
    })
  ).min(1, 'At least one step is required'),
});

// ========== TAB 9: Packages Validation ==========
export const packagesSchema = z.object({
  pricingPackages: z.array(
    z.object({
      id: z.number(),
      title: z.string().min(3, 'Package title must be at least 3 characters'),
      price: z.number().min(1, 'Package price must be greater than 0'),
      isPopular: z.boolean(),
      badge: z.string().optional(),
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

// ========== TAB 10: Testimonials Validation ==========
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

// ========== TAB 11: FAQs Validation ==========
export const faqsSchema = z.object({
  faqs: z.array(
    z.object({
      id: z.number(),
      question: z.string().min(5, 'Question must be at least 5 characters'),
      answer: z.string().min(10, 'Answer must be at least 10 characters'),
    })
  ).optional(),
});

// ========== TAB 12: About Validation ==========
export const aboutSchema = z.object({
  about: z.array(
    z.object({
      title: z.string().min(3, 'Title must be at least 3 characters'),
      content: z.string().min(20, 'Content must be at least 20 characters'),
      image: z.string().optional(),
      _id: z.string().optional(),
    })
  ).optional(),
});

// ========== Helper: Validate Tab ==========
export const validateTab = (tabIndex: number, data: any) => {
  try {
    switch (tabIndex) {
      case 0: // Basic Info
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
          subTitle: data.subTitle || '',
          pujaDay: data.pujaDay || '',
          pujaVenue: data.pujaVenue || '',
          templeLocation: data.templeLocation || '',
        };
        basicInfoSchema.parse(basicData);
        
        // Validate main image
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
      
      case 1: // Details
        detailsSchema.parse(data);
        return { success: true, errors: null };
      
      case 2: // Benefits
        benefitsSchema.parse(data);
        return { success: true, errors: null };
      
      case 3: // Vedic Procedure
        vedicProcedureSchema.parse({
          vedicProcedureTitle: data.vedicProcedureTitle || '',
          vedicProcedureDescription: data.vedicProcedureDescription || ''
        });
        return { success: true, errors: null };
      
      case 4: // Who Should Book
        whoShouldBookSchema.parse(data);
        return { success: true, errors: null };
      
      case 5: // Why You Should
        whyYouShouldSchema.parse(data);
        return { success: true, errors: null };
      
      case 6: // Why Perform Reasons
        whyPerformReasonsSchema.parse(data);
        return { success: true, errors: null };
      
      case 7: // Aashirwad Box
        aashirwadBoxSchema.parse(data);
        return { success: true, errors: null };
      
      case 8: // Ritual Process
        ritualProcessSchema.parse(data);
        return { success: true, errors: null };
      
      case 9: // Packages
        packagesSchema.parse(data);
        return { success: true, errors: null };
      
      case 10: // Testimonials (optional)
        if (data.testimonials && data.testimonials.length > 0) {
          testimonialsSchema.parse(data);
        }
        return { success: true, errors: null };
      
      case 11: // FAQs (optional)
        if (data.faqs && data.faqs.length > 0) {
          faqsSchema.parse(data);
        }
        return { success: true, errors: null };
      
      case 12: // About (optional)
        if (data.about && data.about.length > 0) {
          aboutSchema.parse(data);
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

// ========== Full Schema for Final Submit ==========
export const fullPujaSchema = z.object({
  ...basicInfoSchema.shape,
  ...detailsSchema.shape,
}).merge(benefitsSchema)
  .merge(whoShouldBookSchema)
  .merge(whyYouShouldSchema)
  .merge(whyPerformReasonsSchema)
  .merge(aashirwadBoxSchema)
  .merge(ritualProcessSchema)
  .merge(packagesSchema);