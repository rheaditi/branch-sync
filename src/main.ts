import { debug, group, getInput, setFailed } from '@actions/core';
import { exec } from '@actions/exec';

// constants
import { DEFAULT_BRANCH } from './constants';

// utils
import {
  branchFromRef,
  isProductionBranch,
  getCurrentReleaseBranch,
  isReleaseBranch,
} from './utils';

const branch: string = branchFromRef(getInput('current-branch'));
let currentReleaseBranch: string | null = null;
const gitOptions = {
  failOnStdErr: true,
};

const mergeBranch = async (
  source: string,
  destination: string,
  push = true
): Promise<void> => {
  group(`merge "${source}" → "${destination}"`, async () => {
    exec('git', ['checkout', destination], gitOptions);

    try {
      exec('git', ['merge', '--ff-only', source], gitOptions);
    } catch (e) {
      debug('--ff-only merge failed, trying regular merge');
      exec('git', ['merge', '--ff-only', branch], gitOptions);
    }

    if (push) {
      exec('git', ['push', 'origin', destination], gitOptions);
    }
  });
};

// act
debug(`triggered on branch: "${branch}"`);

if (isProductionBranch(branch)) {
  debug('detected "production" branch');

  group(`get current release branch`, async () => {
    currentReleaseBranch = await getCurrentReleaseBranch();
    debug(`current release branch: "${currentReleaseBranch}"`);
  });

  if (currentReleaseBranch) {
    mergeBranch(branch, currentReleaseBranch);
  } else {
    debug(`invalid release branch: "${currentReleaseBranch}"`);
  }
} else if (isReleaseBranch(branch)) {
  debug('detected release branch');

  group(`merge ${branch} → ${DEFAULT_BRANCH}`, async () => {
    exec('git', ['checkout', DEFAULT_BRANCH], gitOptions);

    mergeBranch(branch, DEFAULT_BRANCH);
  });
} else {
  debug(`Unknown branch "${branch}" - no-op.`);
}

process.on('uncaughtException', error => {
  debug(`error-name: ${error.name}`);
  debug(`error-message: ${error.message}`);
  debug(`error-stack: ${error.stack}`);
  setFailed(error.message);
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  if (reason) {
    debug(`reason: ${reason}`);
  }
  setFailed('unhandledRejection');
  process.exit(1);
});
