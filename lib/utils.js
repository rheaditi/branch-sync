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
const exec_1 = require("@actions/exec");
const core_1 = require("@actions/core");
const constants_1 = require("./constants");
exports.branchFromRef = (ref) => ref.replace(/^origin\//, '');
exports.isReleaseBranch = (branch) => constants_1.RELEASE_BRANCH_PATTERN.test(branch);
exports.isProductionBranch = (branch) => branch === 'production';
exports.executeCommand = (command, args = [], options = Object.create(null)) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let output = '';
    let error = '';
    const execOptions = Object.assign(Object.assign({}, options), { listeners: Object.assign(Object.assign({}, ((_a = options.listeners) !== null && _a !== void 0 ? _a : {})), { stdout: (data) => {
                var _a;
                output += data.toString();
                if (typeof ((_a = options.listeners) === null || _a === void 0 ? void 0 : _a.stdout) === 'function') {
                    options.listeners.stdout(data);
                }
            }, stderr: (data) => {
                var _a;
                error += data.toString();
                if (typeof ((_a = options.listeners) === null || _a === void 0 ? void 0 : _a.stderr) === 'function') {
                    options.listeners.stderr(data);
                }
            } }) });
    const exitCode = yield exec_1.exec(command, args, execOptions);
    return [exitCode, output, error];
});
exports.getCurrentReleaseBranch = () => __awaiter(void 0, void 0, void 0, function* () {
    const [exitCode, output, error] = yield exports.executeCommand(`git show ${constants_1.DEFAULT_BRANCH}:${constants_1.PROPERTIES_FILE}`);
    if (exitCode !== 0) {
        core_1.debug(`exitCode: ${exitCode}, error: ${error}`);
        throw new Error(error);
    }
    const properties = output
        .trim()
        .split('\n')
        .map(i => i.split('='));
    const releaseProperty = properties.find(([key]) => key === constants_1.RELEASE_BRANCH_PROPERTY);
    if (!releaseProperty) {
        core_1.debug(`unable to find ${constants_1.RELEASE_BRANCH_PROPERTY} property`);
        throw new Error(error);
    }
    const branch = releaseProperty[1];
    return branch;
});
