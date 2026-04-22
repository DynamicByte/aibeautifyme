import { KnowledgeBase, ProductData, Article } from './knowledgeLoader';

export interface RetrievalResult {
  products: ProductData[];
  articleSections: Array<{ article: string; section: string; content: string }>;
}

const KEYWORDS_MAP: Record<string, string[]> = {
  retinol: ['retinol', 'retinoid', 'vitamin a', 'anti-aging', 'wrinkles', 'fine lines', 'aging'],
  'vitamin c': ['vitamin c', 'ascorbic', 'brightening', 'dark spots', 'hyperpigmentation', 'antioxidant', 'radiance', 'dull'],
  niacinamide: ['niacinamide', 'vitamin b3', 'pores', 'oil control', 'sebum', 'oily'],
  hyaluronic: ['hyaluronic', 'hydration', 'moisture', 'plumping', 'dehydrated', 'dry'],
  exfoliation: ['exfoliat', 'aha', 'bha', 'glycolic', 'salicylic', 'lactic', 'acid', 'peel', 'texture'],
  spf: ['spf', 'sunscreen', 'sun protection', 'uv', 'sunburn'],
  cleanser: ['cleanser', 'cleansing', 'wash', 'clean'],
  moisturizer: ['moisturizer', 'cream', 'hydrat', 'lotion'],
  interaction: ['combine', 'together', 'mix', 'with', 'interaction', 'layer', 'use with'],
  routine: ['routine', 'regimen', 'order', 'steps', 'when to use', 'how to use', 'morning', 'evening', 'am', 'pm'],
  skintype: ['skin type', 'oily skin', 'dry skin', 'combination', 'sensitive', 'normal skin'],
};

function extractKeywords(query: string): string[] {
  const queryLower = query.toLowerCase();
  const foundKeywords: string[] = [];

  for (const [category, keywords] of Object.entries(KEYWORDS_MAP)) {
    for (const keyword of keywords) {
      if (queryLower.includes(keyword)) {
        foundKeywords.push(category);
        break;
      }
    }
  }

  return [...new Set(foundKeywords)];
}

function searchProducts(products: ProductData[], query: string, keywords: string[]): ProductData[] {
  const queryLower = query.toLowerCase();
  const scored: Array<{ product: ProductData; score: number }> = [];

  for (const product of products) {
    let score = 0;
    const searchableText = [
      product.name,
      product.category,
      ...product.bestFor,
      ...product.ingredients,
      ...product.keyActives.map(a => a.name),
      ...product.warnings,
    ].join(' ').toLowerCase();

    // Direct name match
    if (queryLower.includes(product.name.toLowerCase())) score += 10;
    if (queryLower.includes(product.category.toLowerCase())) score += 5;

    // Keyword matches
    for (const keyword of keywords) {
      if (searchableText.includes(keyword)) score += 3;
    }

    // Query term matches
    const queryTerms = queryLower.split(/\s+/);
    for (const term of queryTerms) {
      if (term.length > 2 && searchableText.includes(term)) score += 1;
    }

    if (score > 0) {
      scored.push({ product, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.product);
}

function searchArticles(articles: Article[], query: string, keywords: string[]): Array<{ article: string; section: string; content: string }> {
  const queryLower = query.toLowerCase();
  const results: Array<{ article: string; section: string; content: string; score: number }> = [];

  for (const article of articles) {
    // Split article into sections by ## headers
    const sections = article.content.split(/(?=^##\s)/m);
    
    for (const section of sections) {
      const headerMatch = section.match(/^##\s+(.+)$/m);
      const sectionTitle = headerMatch ? headerMatch[1] : article.title;
      const sectionContent = section.trim();
      
      if (sectionContent.length < 50) continue;

      let score = 0;
      const textLower = sectionContent.toLowerCase();

      // Keyword matches
      for (const keyword of keywords) {
        const keywordVariants = KEYWORDS_MAP[keyword] || [keyword];
        for (const variant of keywordVariants) {
          if (textLower.includes(variant)) score += 3;
        }
      }

      // Query term matches
      const queryTerms = queryLower.split(/\s+/);
      for (const term of queryTerms) {
        if (term.length > 2 && textLower.includes(term)) score += 2;
      }

      if (score > 0) {
        results.push({
          article: article.title,
          section: sectionTitle,
          content: sectionContent.slice(0, 1500), // Limit section length
          score,
        });
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ article, section, content }) => ({ article, section, content }));
}

export function retrieve(knowledge: KnowledgeBase, query: string): RetrievalResult {
  const keywords = extractKeywords(query);
  
  const products = searchProducts(knowledge.products, query, keywords);
  const articleSections = searchArticles(knowledge.articles, query, keywords);

  return { products, articleSections };
}

export function formatContextForLLM(result: RetrievalResult): string {
  let context = '';

  if (result.products.length > 0) {
    context += '## Relevant Products\n\n';
    for (const product of result.products) {
      context += `### ${product.name} (${product.category}) - ${product.price}\n`;
      context += `**Best for:** ${product.bestFor.join(', ')}\n`;
      context += `**Key actives:** ${product.keyActives.map(a => `${a.name} ${a.concentration}`).join(', ')}\n`;
      context += `**Usage:** ${product.usage.frequency}. ${product.usage.instructions}\n`;
      if (product.warnings.length > 0) {
        context += `**Warnings:** ${product.warnings.join('; ')}\n`;
      }
      if (product.avoidWith.length > 0) {
        context += `**Avoid combining with:** ${product.avoidWith.join(', ')}\n`;
      }
      context += '\n';
    }
  }

  if (result.articleSections.length > 0) {
    context += '## Relevant Knowledge\n\n';
    for (const section of result.articleSections) {
      context += `### From "${section.article}" - ${section.section}\n`;
      context += section.content + '\n\n';
    }
  }

  return context;
}
