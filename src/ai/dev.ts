import { config } from 'dotenv';
config();

import '@/ai/flows/common-news-detection.ts';
import '@/ai/flows/police-relevance-filtering.ts';
import '@/ai/flows/article-summarization.ts';