import fs from 'fs';
import path from 'path';

export interface ProductData {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  size: string;
  ingredients: string[];
  keyActives: Array<{ name: string; concentration: string; benefit: string }>;
  usage: { frequency: string; instructions: string; tips: string };
  bestFor: string[];
  warnings: string[];
  pairsWith: string[];
  avoidWith: string[];
}

export interface Article {
  filename: string;
  title: string;
  content: string;
}

export interface KnowledgeBase {
  products: ProductData[];
  articles: Article[];
}

let cachedKnowledge: KnowledgeBase | null = null;

export async function loadKnowledge(): Promise<KnowledgeBase> {
  if (cachedKnowledge) {
    return cachedKnowledge;
  }

  const knowledgePath = path.join(process.cwd(), 'src', 'knowledge');
  
  // Load products
  const productsPath = path.join(knowledgePath, 'products.json');
  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  const products: ProductData[] = productsData.products;

  // Load articles
  const articlesPath = path.join(knowledgePath, 'articles');
  const articleFiles = fs.readdirSync(articlesPath).filter(f => f.endsWith('.md'));
  
  const articles: Article[] = articleFiles.map(filename => {
    const content = fs.readFileSync(path.join(articlesPath, filename), 'utf-8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : filename.replace('.md', '');
    
    return {
      filename,
      title,
      content,
    };
  });

  cachedKnowledge = { products, articles };
  return cachedKnowledge;
}

export function clearCache(): void {
  cachedKnowledge = null;
}
