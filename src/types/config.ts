export interface DocGenConfig {
  portal: PortalConfig;
  auth: AuthConfig;
  discovery: DiscoveryConfig;
  capture: CaptureConfig;
  workflows: WorkflowConfig[];
  generation: GenerationConfig;
  output: OutputConfig;
}

export interface PortalConfig {
  baseUrl: string;
  name: string;
  description?: string;
}

export interface AuthConfig {
  loginUrl?: string;
  strategy: 'form' | 'manual' | 'state-file';
  credentials?: {
    usernameSelector?: string;
    passwordSelector?: string;
    submitSelector?: string;
    usernameEnv: string;
    passwordEnv: string;
  };
  stateFile?: string;
  verifySelector?: string;
  verifyUrl?: string;
}

export interface DiscoveryConfig {
  startPaths: string[];
  maxDepth: number;
  maxPages: number;
  includePatterns: string[];
  excludePatterns: string[];
  waitAfterNavigation: number;
}

export interface CaptureConfig {
  screenshotFormat: 'png' | 'jpeg';
  screenshotQuality: number;
  captureDir: string;
  sections?: SectionConfig[];
}

export interface SectionConfig {
  name: string;
  selector: string;
  description?: string;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  startPath: string;
  steps: WorkflowStepConfig[];
}

export interface WorkflowStepConfig {
  action: 'click' | 'fill' | 'select' | 'wait' | 'screenshot' | 'assert' | 'navigate' | 'hover' | 'scroll';
  target?: string;
  value?: string;
  description: string;
  waitAfter?: number;
}

export interface GenerationConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  docTypes: ('tutorial' | 'reference')[];
  includeScreenshots: boolean;
  language: string;
}

export interface OutputConfig {
  dir: string;
  formats: ('markdown' | 'html')[];
  screenshotDir: string;
  generateToc: boolean;
  generateIndex: boolean;
  siteName: string;
}
