import { groq } from '@/ai/groq';
import { ToolEnvelope, WebSearchToolInput, WebSearchToolOutput } from '@/agent/v4/types';
import { mapToolError } from './common';

export async function runWebSearchTool(input: WebSearchToolInput): Promise<ToolEnvelope<WebSearchToolOutput>> {
  try {
    const query = input.query?.trim();
    if (!query) {
      throw new Error('validation: search query is required');
    }

    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Create concise search-style results from world knowledge. Return JSON {"results":[{"title":"","snippet":""}]}.',
        },
        { role: 'user', content: query },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content || '{"results": []}') as { results?: Array<{ title?: string; snippet?: string }> };
    const results = (parsed.results || []).slice(0, input.maxResults || 5).map((item) => ({
      title: item.title || 'Untitled',
      snippet: item.snippet || '',
    }));

    return {
      ok: true,
      data: { query, results },
      error: null,
    };
  } catch (error) {
    return { ok: false, data: null, error: mapToolError(error, 'Web search tool failed.') };
  }
}
