/**
 * Document Chunking Utilities
 * Provides multiple chunking strategies for RAG optimization
 */

export interface ChunkingOptions {
  strategy: 'paragraph' | 'token' | 'semantic' | 'hybrid';
  chunkSize: number;
  chunkOverlap: number;
  minChunkSize: number;
  separator?: string;
}

export interface DocumentChunk {
  content: string;
  index: number;
  metadata: {
    startChar: number;
    endChar: number;
    tokenCount?: number;
  };
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Paragraph-based chunking - splits on paragraph boundaries
 */
function chunkByParagraph(
  text: string,
  options: ChunkingOptions
): DocumentChunk[] {
  const separator = options.separator || '\n\n';
  const paragraphs = text.split(separator).filter(p => p.trim().length > 0);
  const chunks: DocumentChunk[] = [];
  
  let currentChunk = '';
  let currentStart = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const testChunk = currentChunk + (currentChunk ? separator : '') + paragraph;
    
    if (estimateTokens(testChunk) > options.chunkSize && currentChunk) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex++,
        metadata: {
          startChar: currentStart,
          endChar: currentStart + currentChunk.length,
          tokenCount: estimateTokens(currentChunk),
        },
      });
      
      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, options.chunkOverlap);
      currentChunk = overlapText + paragraph;
      currentStart += currentChunk.length - overlapText.length;
    } else {
      currentChunk = testChunk;
    }
  }

  // Add final chunk
  if (currentChunk.trim().length >= options.minChunkSize) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
      metadata: {
        startChar: currentStart,
        endChar: currentStart + currentChunk.length,
        tokenCount: estimateTokens(currentChunk),
      },
    });
  }

  return chunks;
}

/**
 * Token-based chunking - splits by token count with overlap
 */
function chunkByTokens(
  text: string,
  options: ChunkingOptions
): DocumentChunk[] {
  const words = text.split(/\s+/);
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (let i = 0; i < words.length; i += options.chunkSize - options.chunkOverlap) {
    const chunkWords = words.slice(i, i + options.chunkSize);
    const content = chunkWords.join(' ');
    
    if (content.length >= options.minChunkSize) {
      const startChar = text.indexOf(chunkWords[0], i > 0 ? chunks[chunks.length - 1]?.metadata.endChar || 0 : 0);
      
      chunks.push({
        content,
        index: chunkIndex++,
        metadata: {
          startChar,
          endChar: startChar + content.length,
          tokenCount: estimateTokens(content),
        },
      });
    }
  }

  return chunks;
}

/**
 * Semantic chunking - attempts to chunk by sentence boundaries
 */
function chunkBySemantic(
  text: string,
  options: ChunkingOptions
): DocumentChunk[] {
  // Split on sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: DocumentChunk[] = [];
  
  let currentChunk = '';
  let currentStart = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const testChunk = currentChunk + sentence;
    
    if (estimateTokens(testChunk) > options.chunkSize && currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex++,
        metadata: {
          startChar: currentStart,
          endChar: currentStart + currentChunk.length,
          tokenCount: estimateTokens(currentChunk),
        },
      });
      
      // Add overlap
      const overlapText = getOverlapText(currentChunk, options.chunkOverlap);
      currentChunk = overlapText + sentence;
      currentStart += currentChunk.length - overlapText.length;
    } else {
      currentChunk = testChunk;
    }
  }

  // Add final chunk
  if (currentChunk.trim().length >= options.minChunkSize) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
      metadata: {
        startChar: currentStart,
        endChar: currentStart + currentChunk.length,
        tokenCount: estimateTokens(currentChunk),
      },
    });
  }

  return chunks;
}

/**
 * Get overlap text from end of chunk
 */
function getOverlapText(text: string, overlapSize: number): string {
  const words = text.split(/\s+/);
  const overlapWords = words.slice(-Math.floor(overlapSize / 4));
  return overlapWords.join(' ') + ' ';
}

/**
 * Main chunking function - delegates to appropriate strategy
 */
export function chunkDocument(
  text: string,
  options: ChunkingOptions
): DocumentChunk[] {
  // Normalize text
  text = text.trim().replace(/\r\n/g, '\n');

  // If document is small enough, return as single chunk
  if (estimateTokens(text) <= options.chunkSize) {
    return [{
      content: text,
      index: 0,
      metadata: {
        startChar: 0,
        endChar: text.length,
        tokenCount: estimateTokens(text),
      },
    }];
  }

  switch (options.strategy) {
    case 'paragraph':
      return chunkByParagraph(text, options);
    case 'token':
      return chunkByTokens(text, options);
    case 'semantic':
      return chunkBySemantic(text, options);
    case 'hybrid':
      // Try semantic first, fall back to paragraph
      const semanticChunks = chunkBySemantic(text, options);
      return semanticChunks.length > 0 ? semanticChunks : chunkByParagraph(text, options);
    default:
      return chunkByParagraph(text, options);
  }
}

/**
 * Get default chunking options
 */
export function getDefaultChunkingOptions(): ChunkingOptions {
  return {
    strategy: 'paragraph',
    chunkSize: 1000,
    chunkOverlap: 200,
    minChunkSize: 100,
    separator: '\n\n',
  };
}
