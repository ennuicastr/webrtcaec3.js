/*
 * Copyright (C) 2023 Yahweasel
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
 * OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * The frontend AEC interface, from which modules can be made and loaded.
 */
export interface WebRtcAec3Wrapper {
    /**
     * A base to load modules from. Can be set before loading the library.
     */
    base: string;

    /**
     * Create a WebRtcAec3 instance.
     */
    WebRtcAec3(): Promise<WebRtcAec3>;
}

/**
 * A WebRtcAec3 module, from which AEC instances can be made.
 */
export interface WebRtcAec3 {
    /**
     * WebRtcAec3 instance constructor.
     * @param sampleRate  Sample rate, which must be supported by AEC3 (namely,
     *                    32kHz or 48kHz).
     * @param renderNumChannels  Number of channels of output (render) data.
     * @param captureNumChannels  Number of channels of capture (input) data.
     */
    AEC3: new (
        sampleRate: number, renderNumChannels: number,
        captureNumChannels: number
    ) => AEC3;
}

/**
 * Options for the analyze phase.
 */
export interface AEC3AnalyzeOpts {
    /**
     * Sample rate of the render data. Will assume the same as the AEC3 instance
     * if unspecified.
     */
    sampleRate?: number;
}

/**
 * Options for the process phase.
 */
export interface AEC3ProcessOpts {
    /**
     * Sample rate of the capture data. Will assume the same as the AEC3
     * instance if unspecified.
     */
    sampleRate?: number;

    /**
     * A secondary output for the data *after* it's been resampled (so that it
     * aligns with the capture output), but *before* the echo has been
     * cancelled. Must have the same dimensions as the output buffer.
     */
    pre?: Float32Array[];
}

/**
 * An AEC3 echo canceller instance.
 */
export interface AEC3 {
    /**
     * The sample rate used to create this instance.
     */
    readonly sampleRate: number;

    /**
     * The number of render channels for processing.
     */
    readonly renderNumChannels: number;

    /**
     * The number of capture channels for processing.
     */
    readonly captureNumChannels: number;

    /**
     * Free this instance. You should call this before you stop using it, and
     * it's crucial to call this if you intend to use the same module for other
     * AEC3 instances. If you use different modules, technically the GC will
     * take care of this, but it would be more efficient to free it.
     */
    free: () => void;

    /**
     * Analyze this render data. Will process as much as can be eagerly.
     * @param data  Data to analyze.
     * @param opts  Options.
     */
    analyze: (data: Float32Array[], opts?: AEC3AnalyzeOpts) => void;

    /**
     * Get the length of the output data given this input data. That is, if you
     * process this data now, how many samples will the output have?
     * @param data  Data that will be processed.
     * @param opts  Options. Must be the same as will be used by `process`.
     */
    processSize: (data: Float32Array[], opts?: AEC3ProcessOpts) => number;

    /**
     * Process this data, i.e., remove echo. The processed data is deposited
     * into a buffer that the user must provide (as `out`). The output must be
     * an array of Float32Arrays: the outer array (array of channels) must be
     * `captureNumChannels` in length, and each Float32Array must have the
     * length given by `processSize` or more.
     * @param out  Output for processed data.
     * @param data  Data to process.
     * @param opts  Opts.
     */
    process: (
        out: Float32Array[], data: Float32Array[], opts?: AEC3ProcessOpts
    ) => void;
}
