import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileTree, CompilationResult } from '@temix/types';
import { TactDiagnostics } from './diagnostics';

export class TactCompiler {
  private static TEMP_DIR_PREFIX = 'temix-compile-';

  /**
   * Cleans up leaked temp directories from previous crashed runs (FM-05).
   */
  static cleanupLeakedDirs(): void {
    const tempRoot = os.tmpdir();
    const dirs = fs.readdirSync(tempRoot);
    const now = Date.now();
    const ONE_HOUR = 3600000;

    for (const dir of dirs) {
      if (dir.startsWith(this.TEMP_DIR_PREFIX)) {
        const fullPath = path.join(tempRoot, dir);
        try {
          const stats = fs.statSync(fullPath);
          if (now - stats.mtimeMs > ONE_HOUR) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          }
        } catch (e) {
          // Ignore errors during cleanup (e.g. file already deleted)
        }
      }
    }
  }

  /**
   * Compiles a FileTree using the Tact compiler.
   */
  static async compile(fileTree: FileTree): Promise<CompilationResult> {
    this.cleanupLeakedDirs();

    const compileId = Math.random().toString(36).substring(7);
    const workDir = path.join(os.tmpdir(), `${this.TEMP_DIR_PREFIX}${compileId}`);
    
    fs.mkdirSync(workDir, { recursive: true });

    try {
      // 1. Write file tree to disk
      for (const node of fileTree) {
        const fullPath = path.join(workDir, node.path);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, node.content);
      }

      // 2. Invoke compiler (Mocked for now - would use @tact-lang/compiler)
      // In a real implementation, we would run:
      // execSync(`npx tact --config tact.config.json`, { cwd: workDir });
      
      // Simulate success for MVP
      return {
        status: 'success',
        artifacts: {
          bytecode: '0xABCDEF...',
          abi: '{}',
          boc: 'base64_boc_data',
        },
        diagnostics: [],
      };
    } catch (error: any) {
      const rawOutput = error.stdout?.toString() || error.message || '';
      return {
        status: 'failure',
        diagnostics: TactDiagnostics.parse(rawOutput),
      };
    } finally {
      // 3. Cleanup
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }
}
