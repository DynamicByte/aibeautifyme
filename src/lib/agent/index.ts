import OpenAI from 'openai';
import { loadKnowledge } from './knowledgeLoader';
import { retrieve, formatContextForLLM } from './retriever';
import { UserProfile } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are the Youth Renew Skincare Advisor, an expert skincare consultant. Your role is to:

1. Help users understand their skin and build effective skincare routines
2. Recommend Youth Renew products based on their needs
3. Explain how to use products correctly
4. Warn about ingredient interactions and contraindications
5. Provide evidence-based skincare advice

Guidelines:
- Be warm, professional, and encouraging
- Always base recommendations on the provided product information and knowledge base
- If recommending a product, explain WHY it's suitable for the user
- Always mention relevant warnings and contraindications
- When discussing routines, be specific about order and timing
- If asked about something outside your knowledge, say so honestly
- Keep responses concise but informative
- Use the user's profile information when making personalized recommendations

You have access to Youth Renew's product catalog and skincare knowledge articles. Use this information to provide accurate, helpful responses.`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  message: string;
  sources: {
    products: string[];
    articles: string[];
  };
}

export async function runAgent(
  userMessage: string,
  conversationHistory: Message[],
  userProfile?: UserProfile
): Promise<AgentResponse> {
  // Load knowledge base
  const knowledge = await loadKnowledge();

  // Retrieve relevant context
  const retrievalResult = retrieve(knowledge, userMessage);
  const context = formatContextForLLM(retrievalResult);

  // Build profile context if available
  let profileContext = '';
  if (userProfile && Object.keys(userProfile).length > 0) {
    profileContext = '\n\n## User Profile\n';
    if (userProfile.skinType) profileContext += `- Skin type: ${userProfile.skinType}\n`;
    if (userProfile.concerns?.length) profileContext += `- Concerns: ${userProfile.concerns.join(', ')}\n`;
    if (userProfile.goals?.length) profileContext += `- Goals: ${userProfile.goals.join(', ')}\n`;
    if (userProfile.age) profileContext += `- Age range: ${userProfile.age}\n`;
  }

  // Build messages for OpenAI
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'system',
      content: `## Retrieved Context\n\n${context}${profileContext}`,
    },
  ];

  // Add conversation history (last 10 messages)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 800,
  });

  const responseMessage = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

  return {
    message: responseMessage,
    sources: {
      products: retrievalResult.products.map(p => p.name),
      articles: [...new Set(retrievalResult.articleSections.map(s => s.article))],
    },
  };
}

export async function runConsultationAgent(
  userMessage: string,
  questionIndex: number,
  profile: UserProfile,
  conversationHistory: Message[]
): Promise<{ message: string; updatedProfile: UserProfile; nextIndex: number; isComplete: boolean }> {
  const CONSULTATION_QUESTIONS = [
    "Welcome to Youth Renew Concierge! I'm here to help you build your perfect skincare routine. Let's start - what's your skin type? (dry, oily, combination, normal, or sensitive)",
    "Great! Now, what are your main skin concerns? For example: fine lines, dark spots, acne, dullness, or uneven texture.",
    "What are your skincare goals? (e.g., anti-aging, brightening, hydration, clear skin)",
    "Last question - what's your age range? This helps me recommend age-appropriate ingredients. (20s, 30s, 40s, 50s+)",
  ];

  const updatedProfile = { ...profile };
  
  // Extract info based on current question
  if (questionIndex === 0) {
    const skinTypes = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
    const found = skinTypes.find(t => userMessage.toLowerCase().includes(t));
    if (found) updatedProfile.skinType = found as UserProfile['skinType'];
  } else if (questionIndex === 1) {
    updatedProfile.concerns = userMessage.toLowerCase().split(/[,\s]+/).filter(w => w.length > 2);
  } else if (questionIndex === 2) {
    updatedProfile.goals = userMessage.toLowerCase().split(/[,\s]+/).filter(w => w.length > 2);
  } else if (questionIndex === 3) {
    updatedProfile.age = userMessage.toLowerCase().match(/\d+s?\+?/)?.[0] || userMessage;
  }

  const nextIndex = questionIndex + 1;
  const isComplete = nextIndex >= CONSULTATION_QUESTIONS.length;

  let responseMessage: string;

  if (isComplete) {
    // Use AI to generate personalized summary
    const knowledge = await loadKnowledge();
    const context = formatContextForLLM({
      products: knowledge.products,
      articleSections: [],
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `## Product Catalog\n\n${context}` },
        {
          role: 'user',
          content: `Based on this user profile, provide a brief, warm summary of their personalized routine. Be concise (2-3 sentences).
          
User Profile:
- Skin type: ${updatedProfile.skinType}
- Concerns: ${updatedProfile.concerns?.join(', ')}
- Goals: ${updatedProfile.goals?.join(', ')}
- Age: ${updatedProfile.age}

Mention that their personalized routine is now displayed on the right panel and invite them to ask any questions.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    responseMessage = completion.choices[0]?.message?.content || 
      `Perfect! Based on your ${updatedProfile.skinType} skin, I've created a personalized routine for you. Check out your recommended products on the right panel! Feel free to ask me any questions.`;
  } else {
    responseMessage = CONSULTATION_QUESTIONS[nextIndex];
  }

  return {
    message: responseMessage,
    updatedProfile,
    nextIndex,
    isComplete,
  };
}
