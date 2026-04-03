import { registerTool } from './registry';
import { analyzeTool } from './analyze';
import { detectLeaksTool } from './detectLeaks';
import { optimizeTimeTool } from './optimizeTime';
import { generateStrategyTool } from './generateStrategy';
import { technicalDebugTool } from './technicalDebug';
import { suggestActionsTool } from './suggestActions';

[
  analyzeTool,
  detectLeaksTool,
  optimizeTimeTool,
  generateStrategyTool,
  technicalDebugTool,
  suggestActionsTool
].forEach(registerTool);
