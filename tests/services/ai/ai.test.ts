import assert from 'node:assert';
import { chunkText } from '../../../src/services/ai/text-chunker';
import { getLLMClient, MockLLMClient } from '../../../src/services/ai/llm-client';
import { analyzeSentiment } from '../../../src/services/ai/sentiment-analysis';

export async function testAiOrchestration() {
  console.log("▶ Running AI Orchestration Layer Tests...");

  // 1. Persian Text Chunker Tests
  console.log("  * Testing Persian Text Chunker...");
  const text = 'کیفیت محصول فوق‌العاده‌ست. اصلاً به درد نمی‌خوره! بسته‌بندی خوب بود؟ بله خوب بود؛ حتماً بخرید.';
  const chunks = chunkText(text, 50, 5);
  assert.ok(chunks.length > 1, "Expected text to be split into multiple chunks");
  assert.ok(chunks[0].includes('کیفیت محصول فوق‌العاده‌ست.'), "Punctuation sentence boundary should be preserved in chunk");

  // Zero-width non-joiners preservation test
  const halfSpaceText = 'این یک محصول فوق‌العاده‌ست که ویژگی‌های بی‌نظیری دارد.';
  const chunkWithHalfSpace = chunkText(halfSpaceText, 25, 0);
  assert.ok(chunkWithHalfSpace.length > 0, "Chunk should be produced");
  const hasBrokenHalfSpace = chunkWithHalfSpace.some(c => c.startsWith('\u200C') || c.endsWith('\u200C'));
  assert.strictEqual(hasBrokenHalfSpace, false, "Should not break text exactly at zero-width non-joiner boundary");

  // Persian quotes preservation test
  const quoteText = 'او گفت: «این محصول عالی است» و سپس خارج شد.';
  const quoteChunks = chunkText(quoteText, 30, 5);
  assert.ok(quoteChunks.length > 0, "Chunk should be produced for quoted text");
  // Ensure that quote segments are preserved together if possible
  const hasIntactQuotes = quoteChunks.some(c => c.includes('«این محصول عالی است»') || (c.includes('«') && c.includes('»')));
  assert.ok(hasIntactQuotes, "Persian quotation marks should be preserved nicely inside chunks");

  // Extremely long sentence fallback split test
  const longSentence = 'این‌یک‌جمله بسیاربسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار بسیار طولانی است.';
  const giantChunks = chunkText(longSentence, 40, 5);
  assert.ok(giantChunks.length > 1, "Should split giant sentences with hard limit fallback");
  assert.ok(giantChunks[0].length <= 40, "Each split segment must be <= maxChunkSize");

  // 2. LLM Client Abstraction Tests
  console.log("  * Testing LLM Client Abstraction...");
  const client = getLLMClient();
  assert.ok(client instanceof MockLLMClient, "In test environment, getLLMClient should return MockLLMClient instance");

  const responseText = await client.generateText('راهنمای خرید گوشی تلفن همراه');
  assert.ok(responseText.includes('شبیه‌سازی شده'), "MockLLMClient should produce Persian mock text responses");

  // 3. Persian Sentiment Analysis Tests
  console.log("  * Testing Persian Sentiment Analysis...");
  const testCases = [
    { text: 'کیفیت محصول فوق‌العاده‌ست، حتماً بخرید', expectedLabel: 'positive' },
    { text: 'اصلاً به درد نمی‌خوره، پولمو دور ریختم', expectedLabel: 'negative' },
    { text: 'بسته‌بندی خوب بود، ولی ارسال دیر بود', expectedLabel: 'neutral' },
  ];

  for (const { text, expectedLabel } of testCases) {
    const result = await analyzeSentiment(text);
    assert.strictEqual(result.label, expectedLabel, `Expected sentiment label to be "${expectedLabel}" but got "${result.label}"`);
    assert.ok(result.score >= -1 && result.score <= 1, "Sentiment score should be between -1 and 1");
    assert.ok(result.confidence >= 0 && result.confidence <= 1, "Sentiment confidence should be between 0 and 1");
    assert.ok(Array.isArray(result.emotions), "Emotions must be returned as an array of strings");
  }

  console.log("✅ AI Orchestration Layer Tests Passed Successfully!");
}

// Execute directly if run via tsx directly
if (require.main === module) {
  testAiOrchestration().catch(err => {
    console.error("❌ AI Orchestration Layer Tests Failed:", err);
    process.exit(1);
  });
}
