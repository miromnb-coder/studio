import { FileAnalyzerToolInput, FileAnalyzerToolOutput, ToolEnvelope } from '@/agent/v4/types';
import { mapToolError } from './common';

export async function runFileAnalyzerTool(input: FileAnalyzerToolInput): Promise<ToolEnvelope<FileAnalyzerToolOutput>> {
  try {
    const instruction = input.instruction?.trim();
    if (!instruction) {
      throw new Error('validation: analyzer instruction is required');
    }

    const content = input.fileContent || instruction;
    const hasSecretPattern = /(api[_-]?key|secret|password|token)/i.test(content);

    return {
      ok: true,
      data: {
        summary: `Analyzed ${input.fileName || 'provided content'} (${content.length} chars).`,
        risks: hasSecretPattern ? ['Potential sensitive credential exposure detected.'] : [],
        recommendations: hasSecretPattern
          ? ['Move secrets to environment variables and rotate exposed credentials.']
          : ['No obvious secret pattern detected. Add linting/security scans for deeper coverage.'],
      },
      error: null,
    };
  } catch (error) {
    return { ok: false, data: null, error: mapToolError(error, 'File analyzer tool failed.') };
  }
}
