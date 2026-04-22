import { NextRequest, NextResponse } from 'next/server';
import { runAgent, runConsultationAgent } from '@/lib/agent';
import { UserProfile } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      conversationHistory = [], 
      userProfile, 
      mode = 'chat',
      questionIndex = 0,
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-api-key-here') {
      // Fallback to mock responses if no API key
      return NextResponse.json({
        message: getMockResponse(message, userProfile),
        sources: { products: [], articles: [] },
        mode,
        questionIndex: mode === 'consultation' ? questionIndex + 1 : undefined,
        isComplete: mode === 'consultation' ? questionIndex >= 3 : undefined,
        updatedProfile: userProfile,
      });
    }

    if (mode === 'consultation') {
      const result = await runConsultationAgent(
        message,
        questionIndex,
        userProfile || {},
        conversationHistory
      );

      return NextResponse.json({
        message: result.message,
        updatedProfile: result.updatedProfile,
        questionIndex: result.nextIndex,
        isComplete: result.isComplete,
        mode: 'consultation',
      });
    } else {
      const result = await runAgent(
        message,
        conversationHistory,
        userProfile as UserProfile
      );

      return NextResponse.json({
        message: result.message,
        sources: result.sources,
        mode: 'chat',
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

function getMockResponse(message: string, profile?: UserProfile): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('retinol') && msg.includes('vitamin c')) {
    return "Great question! Retinol and Vitamin C are both powerful actives, but they work best at different times of day. Use Vitamin C in the morning for antioxidant protection, and Retinol at night. This way you get the benefits of both without irritation risk. Our Vitamin C Brightening Serum pairs perfectly with the Retinol Night Complex when used this way.";
  }
  
  if (msg.includes('retinol')) {
    return "Retinol is excellent for anti-aging and improving skin texture. Our Retinol Night Complex contains 0.5% encapsulated retinol with niacinamide to reduce irritation. Start using it 2-3x per week and gradually increase. Always use SPF during the day, and avoid combining with AHAs/BHAs on the same night.";
  }
  
  if (msg.includes('vitamin c')) {
    return "Vitamin C is a powerful antioxidant that brightens skin and fades dark spots. Our Vitamin C Brightening Serum contains 15% L-Ascorbic Acid with Ferulic Acid for maximum stability and efficacy. Apply in the morning before SPF for best results.";
  }
  
  if (msg.includes('routine') || msg.includes('order')) {
    return "Here's the ideal order: Morning - Cleanser → Vitamin C Serum → Moisturizer → SPF. Evening - Cleanser → Exfoliating Toner (2-3x week) OR Retinol (alternate nights) → Eye Cream → Moisturizer. Always apply products from thinnest to thickest consistency!";
  }

  return "That's a great question! Based on your skin profile, I'd recommend sticking with the routine we've created. Each product was selected specifically for your needs. Would you like me to explain any specific product or ingredient in more detail?";
}
