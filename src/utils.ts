import { exec } from '@actions/exec';
import { ExecOptions } from '@actions/exec/lib/interfaces';
import { debug } from '@actions/core';

import {
  DEFAULT_BRANCH,
  PROPERTIES_FILE,
  RELEASE_BRANCH_PATTERN,
  RELEASE_BRANCH_PROPERTY,
} from './constants';

export const branchFromRef = (ref: string): string =>
  ref.replace(/^origin\//, '');

export const isReleaseBranch = (branch: string): boolean =>
  RELEASE_BRANCH_PATTERN.test(branch);

export const isProductionBranch = (branch: string): boolean =>
  branch === 'production';

export const executeCommand = async (
  command: string,
  args: string[] = [],
  options: ExecOptions = Object.create(null)
): Promise<[number, string, string]> => {
  let output = '';
  let error = '';

  const execOptions: ExecOptions = {
    ...options,
    listeners: {
      ...(options.listeners ?? {}),
      stdout: (data: Buffer) => {
        output += data.toString();
        if (typeof options.listeners?.stdout === 'function') {
          options.listeners.stdout(data);
        }
      },
      stderr: (data: Buffer) => {
        error += data.toString();
        if (typeof options.listeners?.stderr === 'function') {
          options.listeners.stderr(data);
        }
      },
    },
  };
  const exitCode = await exec(command, args, execOptions);
  return [exitCode, output, error];
};

export const getCurrentReleaseBranch = async (): Promise<string> => {
  const [exitCode, output, error] = await executeCommand(
    `git show ${DEFAULT_BRANCH}:${PROPERTIES_FILE}`
  );
  if (exitCode !== 0) {
    debug(`exitCode: ${exitCode}, error: ${error}`);
    throw new Error(error);
  }

  const properties = output
    .trim()
    .split('\n')
    .map(i => i.split('='));
  const releaseProperty = properties.find(
    ([key]) => key === RELEASE_BRANCH_PROPERTY
  );

  if (!releaseProperty) {
    debug(`unable to find ${RELEASE_BRANCH_PROPERTY} property`);
    throw new Error(error);
  }

  const branch: string = releaseProperty[1];

  return branch;
};
