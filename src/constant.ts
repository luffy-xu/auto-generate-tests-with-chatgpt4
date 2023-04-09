import { ChatGPTAPIOptions } from 'chatgpt';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

import { HuskyGPTTypeEnum, IUserOptions, ReadTypeEnum } from './types';

export const OPENAI_API_KEY_NAME = 'OPENAI_API_KEY';
export const OPENAI_SESSION_TOKEN_NAME = 'OPENAI_SESSION_TOKEN';

const DEFAULT_MODELS = {
  apiModel: 'gpt-3.5-turbo',
  proxyModel: 'text-davinci-002-render-sha',
};

/*
export const ROOT_SRC_DIR_PATH = path.join(
  new URL('.', import.meta.url).pathname,
);
*/
export const ROOT_SRC_DIR_PATH = path.join(__dirname, '..');

class UserOptionsClass {
  options: IUserOptions;

  private userOptionsDefault: IUserOptions = {
    debug: false,
    huskyGPTType: HuskyGPTTypeEnum.Review,
    openAIModel: '',
    openAIProxyUrl: 'https://bypass.churchless.tech/api/conversation',
    openAIMaxTokens: 4096,
    readType: ReadTypeEnum.GitStage,
    readGitStatus: 'R, M, A',
    readFilesRootName: 'src',
    readFileExtensions: '.ts,.tsx',
    testFileType: 'test',
    testFileNameExtension: '.ts',
    testFileDirName: '__test__',
    reviewReportWebhook: '',
  };

  /**
   * Get huskygpt run type
   * @example
   * // returns 'test'
   */
  get huskyGPTType(): HuskyGPTTypeEnum {
    if (!this.options.huskyGPTType) throw new Error('huskyGPTType is not set');
    return this.options.huskyGPTType;
  }

  // get open AI key from npm config
  private getOpenAIKeyFromNpmConfig(key: string): string {
    try {
      return execSync(`npm config get ${key}`).toString().trim();
    } catch (error) {
      return '';
    }
  }

  /**
   * Get OpenAI API key
   * @example
   * @returns 'sk-1234567890'
   */
  get openAIKey(): string {
    if (!this.options.openAIKey) {
      this.options.openAIKey =
        this.getOpenAIKeyFromNpmConfig(OPENAI_API_KEY_NAME);
    }

    if (!this.options.openAIKey) throw new Error('openAIKey is not set');

    if (process.env.DEBUG)
      console.log(`openAI key: "${this.options.openAIKey}"`);

    return this.options.openAIKey;
  }

  /**
   * Get OpenAI session token
   */
  get openAISessionToken(): string {
    if (!this.options.openAISessionToken) {
      this.options.openAISessionToken = this.getOpenAIKeyFromNpmConfig(
        OPENAI_SESSION_TOKEN_NAME,
      );
    }

    return this.options.openAISessionToken;
  }

  /**
   * Get OpenAI send message type, proxy or api
   */
  get openAISendByProxy(): boolean {
    return (
      this.options.openAIProxyUrl &&
      this.openAISessionToken &&
      this.openAISessionToken !== 'undefined'
    );
  }

  get openAIModel(): string {
    if (this.openAISendByProxy) {
      if (this.options.openAIModel === DEFAULT_MODELS.apiModel) {
        console.warn(
          '[huskygpt] openAIModel is set to gpt-3.5-turbo, but use proxy type, so openAIModel is set to text-davinci-002-render-sha',
        );
        return (this.options.openAIModel = DEFAULT_MODELS.proxyModel);
      }

      return this.options.openAIModel || DEFAULT_MODELS.proxyModel;
    }
    return this.options.openAIModel || DEFAULT_MODELS.apiModel;
  }

  /**
   * Get OpenAI options
   */
  get openAIOptions(): ChatGPTAPIOptions['completionParams'] {
    if (!this.openAIModel) throw new Error('openAIModel is not set');

    return {
      temperature: 0,
      top_p: 0.4,
      stop: ['###'],
      model: this.openAIModel,
      max_tokens: this.options.openAIMaxTokens,
    };
  }

  /**
   * Get the root directory path to read files from
   * @example
   * // returns '/Users/username/project/src'
   */
  get readFilesRoot(): string {
    if (!this.options.readFilesRootName)
      throw new Error('readFilesRootName is not set');
    return path.join(process.cwd(), this.options.readFilesRootName);
  }

  /**
   * Get the file extensions to read
   * @example
   * // returns ['.ts', '.tsx']
   */
  get readFilesExtensions(): string[] {
    if (!this.options.readFileExtensions)
      throw new Error('readFileExtensions is not set');
    return this.options.readFileExtensions.split(',');
  }

  /**
   * File read type, either 'dir' or 'git'
   */
  get readFileType(): ReadTypeEnum {
    if (!this.options.readType) throw new Error('readType is not set');
    return this.options.readType;
  }

  /**
   * Get the file name suffix to use for test files
   * @example
   * // returns '.test.ts'
   */
  get testFileNameSuffix(): string {
    return `.${this.options.testFileType}${this.options.testFileNameExtension}`;
  }

  /**
   * Convert the process.env to user options
   */
  private convertProcessEnvToUserOptions(
    processEnv: NodeJS.ProcessEnv,
  ): IUserOptions {
    return {
      debug: process.env.DEBUG === 'true',
      securityRegex: process.env.SECURITY_REGEX || '',
      openAIKey: processEnv.OPENAI_API_KEY,
      openAISessionToken: processEnv.OPENAI_SESSION_TOKEN,
      openAIProxyUrl:
        processEnv.OPENAI_PROXY_URL || this.userOptionsDefault.openAIProxyUrl,
      openAIModel:
        processEnv.OPENAI_MODEL || this.userOptionsDefault.openAIModel,
      openAIMaxTokens: Number(
        processEnv.OPENAI_MAX_TOKENS || this.userOptionsDefault.openAIMaxTokens,
      ),
      /**
       * Read file options
       */
      readType:
        (processEnv.READ_TYPE as ReadTypeEnum) ||
        this.userOptionsDefault.readType,
      readGitStatus:
        processEnv.READ_GIT_STATUS || this.userOptionsDefault.readGitStatus,
      readFilesRootName:
        processEnv.READ_FILES_ROOT_NAME ||
        this.userOptionsDefault.readFilesRootName,
      readFileExtensions:
        processEnv.READ_FILE_EXTENSIONS ||
        this.userOptionsDefault.readFileExtensions,
      /**
       * Test file options
       */
      testFileType:
        processEnv.TEST_FILE_TYPE || this.userOptionsDefault.testFileType,
      testFileNameExtension:
        processEnv.TEST_FILE_NAME_EXTENSION ||
        this.userOptionsDefault.testFileNameExtension,
      testFileDirName:
        processEnv.TEST_FILE_DIR_NAME ||
        this.userOptionsDefault.testFileDirName,
      /**
       * Review options
       */
      reviewReportWebhook: processEnv.REVIEW_REPORT_WEBHOOK,
    };
  }

  /**
   * Security test
   * If return false, the prompt does not pass the security test
   */
  public securityPrompt(prompt: string): string {
    if (!this.options.securityRegex) return prompt;

    const regex = new RegExp(this.options.securityRegex, 'gi');

    return prompt.replace(regex, 'REMOVED');
  }

  /**
   * Initialize the user options
   */

  public init(userOptions: IUserOptions = {}) {
    // Read the .env file
    config();
    config({ path: path.join(process.cwd(), '.env.local') });
    const envUserOptions = this.convertProcessEnvToUserOptions(process.env);

    if (process.env.DEBUG) {
      console.log('envUserOptions: ', envUserOptions);
      console.log('userOptions: ', userOptions);
    }

    this.options = Object.assign(
      {},
      this.userOptionsDefault,
      envUserOptions,
      userOptions,
    );
  }
}

export const userOptions = new UserOptionsClass();

/**
 * Review result configs
 */
export const codeBlocksRegex = /```([\s\S]*?)```/g;

export const codeBlocksMdSymbolRegex = /```(\w?)*/g;

// Write the output text to a file if there are code blocks
export const reviewFileName = '.huskygpt_review.md';
