"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const exec_1 = require("@actions/exec");
// constants
const constants_1 = require("./constants");
// utils
const utils_1 = require("./utils");
const branch = utils_1.branchFromRef(core_1.getInput('changed-branch'));
let currentReleaseBranch = null;
const gitOptions = {
    failOnStdErr: true,
};
const mergeBranch = (source, destination, push = true) => __awaiter(void 0, void 0, void 0, function* () {
    core_1.group(`merge "${source}" → "${destination}"`, () => __awaiter(void 0, void 0, void 0, function* () {
        exec_1.exec('git', ['checkout', destination], gitOptions);
        try {
            exec_1.exec('git', ['merge', '--ff-only', source], gitOptions);
        }
        catch (e) {
            core_1.debug('--ff-only merge failed, trying regular merge');
            exec_1.exec('git', ['merge', '--ff-only', branch], gitOptions);
        }
        if (push) {
            exec_1.exec('git', ['push', 'origin', destination], gitOptions);
        }
    }));
});
// act
core_1.debug(`triggered on branch: ${branch}`);
if (utils_1.isProductionBranch(branch)) {
    core_1.debug('detected "production" branch');
    core_1.group(`get current release branch`, () => __awaiter(void 0, void 0, void 0, function* () {
        currentReleaseBranch = yield utils_1.getCurrentReleaseBranch();
        core_1.debug(`current release branch: "${currentReleaseBranch}"`);
    }));
    if (currentReleaseBranch) {
        mergeBranch(branch, currentReleaseBranch);
    }
    else {
        core_1.debug(`invalid release branch: "${currentReleaseBranch}"`);
    }
}
if (utils_1.isReleaseBranch(branch)) {
    core_1.debug('detected release branch');
    core_1.group(`merge ${branch} → ${constants_1.DEFAULT_BRANCH}`, () => __awaiter(void 0, void 0, void 0, function* () {
        exec_1.exec('git', ['checkout', constants_1.DEFAULT_BRANCH], gitOptions);
        mergeBranch(branch, constants_1.DEFAULT_BRANCH);
    }));
}
process.on('uncaughtException', error => {
    core_1.debug(`error-name: ${error.name}`);
    core_1.debug(`error-message: ${error.message}`);
    core_1.debug(`error-stack: ${error.stack}`);
    core_1.setFailed(error.message);
    process.exit(1);
});
process.on('unhandledRejection', reason => {
    if (reason) {
        core_1.debug(`reason: ${reason}`);
    }
    core_1.setFailed('unhandledRejection');
    process.exit(1);
});
