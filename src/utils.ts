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
  ref.replace(/^origin\//, '').replace(/^refs\/heads\//, '');

export const isReleaseBranch = (branch: string): boolean =>
  RELEASE_BRANCH_PATTERN.test(branch);

export const isProductionBranch = (branch: string): boolean =>
  branch === 'production';

export const executeCommand = async (
  command: string,
  args: string[] = [],
  options: ExecOptions = Object.create(null)
): Promise<string> => {
  let output = '';

  const execOptions: ExecOptions = {
    ...options,
    failOnStdErr: true,
    listeners: {
      ...(options.listeners ?? {}),
      stdout: (data: Buffer) => {
        output += data.toString();
        if (typeof options.listeners?.stdout === 'function') {
          options.listeners.stdout(data);
        }
      },
    },
  };
  await exec(command, args, execOptions);
  return output;
};

export const getCurrentReleaseBranch = async (): Promise<string> => {
  exec('git', ['fetch', 'origin', `${DEFAULT_BRANCH}:${DEFAULT_BRANCH}`], {
    failOnStdErr: true,
  });

  const output = await executeCommand(`git`, [
    'show',
    DEFAULT_BRANCH,
    PROPERTIES_FILE,
  ]);

  const properties = output
    .trim()
    .split('\n')
    .map(i => i.split('='));
  const releaseProperty = properties.find(
    ([key]) => key === RELEASE_BRANCH_PROPERTY
  );

  if (!releaseProperty) {
    debug(`unable to find ${RELEASE_BRANCH_PROPERTY} property`);
    throw new Error('Failed to find release branch');
  }

  const branch: string = releaseProperty[1];
  return branch;
};
