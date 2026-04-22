import { Message, Product, RoutineStep, UserProfile } from './types';

const CONSULTATION_FLOW = [
  {
    question: "Welcome to Youth Renew Concierge! I'm here to help you build your perfect skincare routine. Let's start - what's your skin type? (dry, oily, combination, normal, or sensitive)",
    extractKey: 'skinType',
  },
  {
    question: "Great! Now, what are your main skin concerns? For example: fine lines, dark spots, acne, dullness, or uneven texture.",
    extractKey: 'concerns',
  },
  {
    question: "What are your skincare goals? (e.g., anti-aging, brightening, hydration, clear skin)",
    extractKey: 'goals',
  },
  {
    question: "Last question - what's your age range? This helps me recommend age-appropriate ingredients. (20s, 30s, 40s, 50s+)",
    extractKey: 'age',
  },
];

// Actual Youth Renew products with correct prices
const PRODUCT_DATABASE: Product[] = [
  // Youth Renew Line
  { id: 'cleansing-foam', name: 'Cleansing Foam', brand: 'Youth Renew', category: 'Cleanser', reason: 'Maintains skin pH balance, controls excess oil, strengthens and regenerates skin tissues', imageUrl: '/product_images/cleansing_foam.png', price: '₱1,344' },
  { id: 'intense-whitening-toner', name: 'Intense Whitening Toner', brand: 'Youth Renew', category: 'Toner', reason: 'Gives radiant and brighter skin with hyaluronic acid and collagen for hydration', imageUrl: '/product_images/intense_whitening_toner.png', price: '₱1,144' },
  { id: 'intense-whitening-cream', name: 'Intense Whitening Cream', brand: 'Youth Renew', category: 'Moisturizer', reason: 'Moisturizes, lightens skin, prevents aging with Alpha-arbutin and Jojoba Oil', imageUrl: '/product_images/intense_whitening_cream.png', price: '₱1,108' },
  { id: 'daily-sunblock-whitening-cream', name: 'Daily Sunblock Whitening Cream', brand: 'Youth Renew', category: 'Sunscreen', reason: 'UV protection with anti-aging, anti-pollution benefits using RedSnow® and Niacinamide', imageUrl: '/product_images/daily_sunblock_whitening.png', price: '₱400' },
  { id: 'white-wrinkle-spot-cream', name: 'White & Wrinkle Spot Cream', brand: 'Youth Renew', category: 'Treatment', reason: 'Strengthens cellular bonds, tightens skin, reverses signs of aging with Niacinamide and Adenosine', imageUrl: '/product_images/white_wrinkle_spot_cream.png', price: '₱1,344' },
  { id: 'collagen-essence', name: 'Collagen Essence', brand: 'Youth Renew', category: 'Essence', reason: 'Improves skin elasticity, reduces fine lines, promotes youthful skin', imageUrl: '/product_images/intense_whitening_cream.png', price: '₱2,120' },
  { id: 'bb-cream-whitening', name: 'BB Cream for Whitening', brand: 'Youth Renew', category: 'BB Cream', reason: 'Natural coverage with whitening benefits for daily wear', imageUrl: '/product_images/bb_cream_whitening.png', price: '₱1,048' },
  { id: 'white-wrinkle-sheet-mask', name: 'White & Wrinkle Sheet Mask', brand: 'Youth Renew', category: 'Sheet Mask', reason: 'Intensive whitening and anti-wrinkle treatment for special care', imageUrl: '/product_images/wrinkle_sheet_mask.png', price: '₱248' },
  { id: 'collagen-glutha-beverage', name: 'Collagen+Glutha Beverage Mix', brand: 'Youth Renew', category: 'Beauty Supplement', reason: 'Internal beauty support with collagen and glutathione for skin whitening from within', imageUrl: '/product_images/esther_bioscience_collagen_gluta.png', price: '₱5,400' },
  
  // Dr. Chang's Line - Bundle price ₱3,998 when all 3 purchased together
  { id: 'dr-chang-cleansing-foam', name: "Dr. Chang's Mega Peptide Whitening Cleansing Foam", brand: "Dr. Chang's", category: 'Cleanser', reason: 'Brightens complexion, imparts even skin tone, diminishes fine lines with powerful peptides', imageUrl: '/product_images/dr_chang_cleansing_foam.jpg', price: '₱1,500' },
  { id: 'dr-chang-serum', name: "Dr. Chang's Mega Peptide Whitening Serum", brand: "Dr. Chang's", category: 'Serum', reason: 'Age-defying serum with potent antioxidants, targets aging signs for luminous youthful glow', imageUrl: '/product_images/dr_chang_serum.jpg', price: '₱1,800' },
  { id: 'dr-chang-sunscreen', name: "Dr. Chang's Mega Peptide Tone Up Sunscreen", brand: "Dr. Chang's", category: 'Sunscreen', reason: 'SPF 50+ PA+++ with natural tone up, brightening, collagen and peptide benefits', imageUrl: '/product_images/dr_chang_sunscreen.jpg', price: '₱1,500' },
  
  // Lueur Line
  { id: 'lueur-insta-magic-lotion', name: 'Lueur Lauren Insta-Magic Whitening Body Lotion', brand: 'Lueur Lauren', category: 'Body Lotion', reason: 'Instant whitening effect, deeply moisturizes with Shea Butter, Niacinamide and Argan Oil', imageUrl: '/product_images/insta-magic_whitening_lotion.png', price: 'Contact for price' },
  
  // Liquid 24K
  { id: 'liquid-24k-serum', name: 'Liquid 24K Age-Defying Serum', brand: 'Liquid 24K', category: 'Serum', reason: 'Reduces wrinkles & fine lines, firms & lifts skin with Pure 24K Gold and Niacinamide', imageUrl: '/product_images/age_defying_serum.png', price: 'Contact for price' },
];

export function getInitialMessage(): Message {
  return {
    id: '0',
    role: 'assistant',
    content: CONSULTATION_FLOW[0].question,
    timestamp: new Date(),
  };
}

export function processUserMessage(
  userMessage: string,
  profile: UserProfile,
  questionIndex: number
): { response: string; updatedProfile: UserProfile; nextIndex: number; isComplete: boolean } {
  const currentStep = CONSULTATION_FLOW[questionIndex];
  const updatedProfile = { ...profile };

  if (currentStep) {
    const key = currentStep.extractKey as keyof UserProfile;
    if (key === 'concerns' || key === 'goals') {
      updatedProfile[key] = userMessage.toLowerCase().split(/[,\s]+/).filter(Boolean);
    } else {
      (updatedProfile as Record<string, string>)[key] = userMessage.toLowerCase();
    }
  }

  const nextIndex = questionIndex + 1;
  const isComplete = nextIndex >= CONSULTATION_FLOW.length;

  let response: string;
  if (isComplete) {
    response = `Perfect! Based on your ${updatedProfile.skinType} skin, concerns about ${updatedProfile.concerns?.join(', ')}, and goals of ${updatedProfile.goals?.join(', ')}, I've created a personalized routine for you. Check out your recommended products on the right panel! Feel free to ask me any questions about the routine or specific products.`;
  } else {
    response = CONSULTATION_FLOW[nextIndex].question;
  }

  return { response, updatedProfile, nextIndex, isComplete };
}

export function generateRoutine(profile: UserProfile): RoutineStep[] {
  const routine: RoutineStep[] = [];
  let order = 1;

  const getProduct = (id: string) => PRODUCT_DATABASE.find(p => p.id === id)!;

  // AM Routine - Prioritize Dr. Chang's products
  // Dr. Chang's Cleansing Foam instead of regular Cleansing Foam
  routine.push({ id: 'am-1', order: order++, timeOfDay: 'AM', stepName: 'Cleanse', product: getProduct('dr-chang-cleansing-foam') });
  routine.push({ id: 'am-2', order: order++, timeOfDay: 'AM', stepName: 'Tone', product: getProduct('intense-whitening-toner') });
  
  // Dr. Chang's Serum instead of Collagen Essence for AM (always include for brightening benefits)
  routine.push({ id: 'am-3', order: order++, timeOfDay: 'AM', stepName: 'Serum', product: getProduct('dr-chang-serum') });
  
  routine.push({ id: 'am-4', order: order++, timeOfDay: 'AM', stepName: 'Moisturize', product: getProduct('intense-whitening-cream') });
  
  // Dr. Chang's Sunscreen instead of Daily Sunblock
  routine.push({ id: 'am-5', order: order++, timeOfDay: 'AM', stepName: 'Sun Protection', product: getProduct('dr-chang-sunscreen') });

  // PM Routine - Prioritize Dr. Chang's products
  order = 1;
  // Dr. Chang's Cleansing Foam
  routine.push({ id: 'pm-1', order: order++, timeOfDay: 'PM', stepName: 'Cleanse', product: getProduct('dr-chang-cleansing-foam') });
  routine.push({ id: 'pm-2', order: order++, timeOfDay: 'PM', stepName: 'Tone', product: getProduct('intense-whitening-toner') });
  
  // Dr. Chang's Serum for PM routine
  routine.push({ id: 'pm-3', order: order++, timeOfDay: 'PM', stepName: 'Serum', product: getProduct('dr-chang-serum') });
  
  // Additional anti-aging treatment for older users or those with wrinkle concerns
  if (profile.goals?.some(g => g.includes('anti-aging') || g.includes('aging') || g.includes('wrinkle')) || 
      profile.concerns?.some(c => c.includes('line') || c.includes('wrinkle')) ||
      profile.age === '30s' || profile.age === '40s' || profile.age === '50s+') {
    routine.push({ id: 'pm-4', order: order++, timeOfDay: 'PM', stepName: 'Anti-Aging Treatment', product: getProduct('white-wrinkle-spot-cream') });
  }
  
  routine.push({ id: 'pm-5', order: order++, timeOfDay: 'PM', stepName: 'Night Cream', product: getProduct('intense-whitening-cream') });

  return routine;
}

export function handleFollowUpQuestion(question: string, profile: UserProfile): string {
  const q = question.toLowerCase();
  
  if (q.includes('cleansing') || q.includes('cleanser')) {
    return "I highly recommend Dr. Chang's Mega Peptide Whitening Cleansing Foam - our premium cleanser with powerful peptides that brightens complexion, evens skin tone, and diminishes fine lines while cleansing. It's the ultimate solution for radiant, youthful skin! We also have the Youth Renew Cleansing Foam (₱1,344) with Rose Water and Green Tea Extract as an alternative.";
  }
  if (q.includes('toner')) {
    return "The Intense Whitening Toner (₱1,144) contains Neofinetia Falcata for radiance, Hyaluronic Acid & Collagen for hydration, and Allantoin for acne treatment. Apply 3 drops on cotton pad, start under eyes going outward, then nose bridge upward, then chin in circular motions.";
  }
  if (q.includes('sunblock') || q.includes('spf') || q.includes('sun')) {
    return "I recommend Dr. Chang's Mega Peptide Tone Up Sunscreen - our premium SPF 50+ PA+++ sunscreen with natural tone up and brightening benefits. It combines sun protection with peptides and collagen for anti-aging benefits while giving you that instant glow! The Youth Renew Daily Sunblock (₱400) is also available as a budget-friendly option.";
  }
  if (q.includes('serum')) {
    return "Dr. Chang's Mega Peptide Whitening Serum is our top recommendation! It's infused with potent antioxidants including Allantoin, Adenosine, Niacinamide, and Tripeptide for age-defying benefits. It targets aging signs, shields against pollution & UV, and reveals a luminous youthful glow. For luxury treatment, we also have Liquid 24K Age-Defying Serum with Pure 24K Gold.";
  }
  if (q.includes('wrinkle') || q.includes('anti-aging') || q.includes('spot cream')) {
    return "For anti-aging, Dr. Chang's Mega Peptide Whitening Serum is excellent for daily nourishment and reducing visible wrinkles. For targeted treatment, the White & Wrinkle Spot Cream (₱1,344) with Niacinamide, Adenosine and 7 plant extracts works great. For luxury treatment, try the Liquid 24K Age-Defying Serum with Pure 24K Gold.";
  }
  if (q.includes('collagen') || q.includes('essence')) {
    return "Dr. Chang's Mega Peptide Whitening Serum contains Collagen and Tripeptide for boosting skin elasticity. For internal support, our Collagen+Glutha Beverage Mix (₱5,400) provides collagen and glutathione for whitening from within. We also have Collagen Essence (₱2,120) as an alternative.";
  }
  if (q.includes('body') || q.includes('lotion')) {
    return "For body care, try Lueur Lauren Insta-Magic Whitening Body Lotion with instant whitening effect, Shea Butter, Niacinamide and Argan Oil. Pair it with Lueur Glowchar Detox Bar or Milky Glow Pureluxe Bar for complete body whitening routine!";
  }
  if (q.includes('order') || q.includes('routine')) {
    return "For AM: Dr. Chang's Cleansing Foam → Intense Whitening Toner → Dr. Chang's Serum → Intense Whitening Cream → Dr. Chang's Sunscreen. For PM: Same cleansing, toning, serum steps, then add White & Wrinkle Spot Cream for anti-aging, followed by Night Cream.";
  }
  if (q.includes('dr chang') || q.includes('peptide')) {
    return "Dr. Chang's Mega Peptide line is our premium collection! It features: Whitening Cleansing Foam (brightens, diminishes fine lines), Whitening Serum (anti-aging with Collagen & Tripeptide, shields against pollution & UV), and Tone Up Sunscreen (SPF 50+ PA+++ with natural tone up effect). All formulated with powerful peptides for maximum results!";
  }
  if (q.includes('24k') || q.includes('gold')) {
    return "The Liquid 24K Age-Defying Serum contains Pure 24K Gold, Niacinamide, Grape Seed Oil and Lecithin. It reduces wrinkles & fine lines, firms & lifts skin, and provides a radiant youthful glow. FDA & HALAL certified for all skin types!";
  }
  
  return "Great question! Your routine features Dr. Chang's premium peptide line - our most advanced formulations for brightening, anti-aging, and skin transformation. The powerful peptides work synergistically to diminish fine lines, even skin tone, and protect against aging. Would you like more details on any specific product?";
}
