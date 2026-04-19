import { CompilerDiagnostic } from '@temix/types';

export class TactDiagnostics {
  /**
   * Parses raw Tact compiler output into structured diagnostics.
   * Currently implements a basic parser for common Tact error formats.
   */
  static parse(rawOutput: string): CompilerDiagnostic[] {
    const diagnostics: CompilerDiagnostic[] = [];
    const lines = rawOutput.split('\n');

    // Example pattern: path/to/file.tact:10:5: error: message
    const errorRegex = /^(.*):(\d+):(\d+):\s+(error|warning):\s+(.*)$/;

    for (const line of lines) {
      const match = line.match(errorRegex);
      if (match) {
        diagnostics.push({
          file: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
          severity: match[4] as 'error' | 'warning',
          message: match[5],
        });
      }
    }

    // Handle cases where output might be a JSON object (some compilers support this)
    if (diagnostics.length === 0 && rawOutput.trim().startsWith('{')) {
      try {
        const json = JSON.parse(rawOutput);
        if (Array.isArray(json.errors)) {
          for (const err of json.errors) {
            diagnostics.push({
              file: err.file || 'unknown',
              line: err.line || 0,
              column: err.column || 0,
              severity: 'error',
              message: err.message || 'Unknown error',
            });
          }
        }
      } catch (e) {
        // Not JSON or malformed
      }
    }

    return diagnostics;
  }
}
