import fs from 'fs';
import { userOptions } from 'src/constant';
import { HuskyGPTTypeEnum, IReadFileResult } from 'src/types';
import { CodePicker } from 'src/utils/pick-code';
import { readPromptFile } from 'src/utils/read-prompt-file';

export class HuskyGPTPrompt {
  private huskyGPTTypeMap: Record<
    HuskyGPTTypeEnum,
    (fileResult: IReadFileResult) => string[]
  > = {
    [HuskyGPTTypeEnum.Test]: (fileResult) => {
      const fileContent =
        fileResult.fileContent ||
        fs.readFileSync(fileResult.filePath!, 'utf-8');
      const testsPrompt = readPromptFile('tests.txt');
      // const fileName = getFileNameByPath(fileResult.filePath!)
      // - Import the test function from "../${fileName}".
      const basePrompt = `
        ${testsPrompt}
        ${userOptions.options.openAIPrompt || ''}
      `;

      const codePicker = new CodePicker();

      const codePrompts = codePicker.pickFunctionOrClassCodeArray(fileContent);

      return [basePrompt, ...codePrompts];
    },
    [HuskyGPTTypeEnum.Review]: (fileResult) => {
      const fileContent =
        fileResult.fileContent ||
        fs.readFileSync(fileResult.filePath!, 'utf-8');
      const reviewPrompt = readPromptFile('review.txt');
      const basePrompt = `
        ${reviewPrompt}
        ${userOptions.options.openAIPrompt || ''}
      `;

      const codePicker = new CodePicker();

      const codePrompts = codePicker.pickFunctionOrClassCodeArray(fileContent);

      return [basePrompt, ...codePrompts];
    },
    [HuskyGPTTypeEnum.Commit]: (fileResult) => {
      const fileContent =
        fileResult.fileContent ||
        fs.readFileSync(fileResult.filePath!, 'utf-8');
      const reviewPrompt = fs.readFileSync(
        path.join(ROOT_SRC_DIR_PATH, './prompt', 'summarize_file_diff.txt'),
        'utf-8',
      );
      const basePrompt = `
        ${reviewPrompt}
        ${userOptions.options.openAIPrompt || ''}
      `;

      const codePicker = new CodePicker();

      const codePrompts = codePicker.pickFunctionOrClassCodeArray(fileContent);

      return [basePrompt, ...codePrompts];
    },
  };

  constructor(private huskyGPTType: HuskyGPTTypeEnum) {}

  public generatePrompt(fileResult: IReadFileResult): string[] {
    if (!fileResult)
      throw new Error('File path is required for generatePrompt');
    if (!this.huskyGPTTypeMap[this.huskyGPTType])
      throw new Error('Invalid huskyGPTType: ' + this.huskyGPTType);

    return this.huskyGPTTypeMap[this.huskyGPTType](fileResult);
  }
}
