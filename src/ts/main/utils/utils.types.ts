import { ChildProcessWithoutNullStreams } from "child_process";

export type ID = number;

export type Position = {
    x: number;
    y: number;
};

export type Size = {
    w: number;
    h: number;
};

export type Rect = Position & Size;

export type ColorRGB = {
    r: number;
    g: number;
    b: number;
    a?: number;
};

export type Resolve<T> = (value: T | PromiseLike<T>) => void;
export type Reject = (reason?: any) => void;

export type Value<T> = {
    readonly id: T;
    readonly name: string;
};

export type ValueBase = {
    readonly id: ID;
    readonly name: string;
};

export type MoveFile = {
    readonly sourcePath: string;
    readonly destinationPath: string;
};

export type FileError = {
    readonly sourcePath: string;
    readonly destinationPath?: string;
    readonly message: string;
};

export type ExecuteCommandEvents<T> = {
    readonly onProcess?: (process: ChildProcessWithoutNullStreams) => void;
    readonly onStdout?: (stdout: string, data: Buffer) => string;
    readonly onClose?: (stdout: string) => T | Promise<T>;
};

export type AppArgs = {};



// API-RESULT
export type ApiResultSuccess<T = {}> = {
    readonly success: true;
} & T;

export type ApiResultError<T = {}> = {
    readonly success: false;
    readonly error: string;
} & T;

export type ApiResultClientError = {
    readonly clientError: string;
};

export type ApiResult<S = {}, E = {}> = ApiResultSuccess<S> | ApiResultError<E>;

// API-RESULT.DIALOG
export type AskForFileApiResult = ApiResult<{ readonly path: string | null }>;

// API-RESULT.FILE
export type ReadFileApiResult = ApiResult<{ readonly data: Uint8Array }>;

// API-RESULT.TEMP
export type ClearTempApiResult = ApiResult;
export type PasteClipbordImageApiResult = ApiResult<{ readonly filePath: string }>;
