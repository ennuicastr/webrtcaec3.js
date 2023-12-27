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
 * An AEC3 echo canceller instance.
 */
export interface AEC3 {
    /**
     * Free this instance. You should call this before you stop using it, and
     * it's crucial to call this if you intend to use the same module for other
     * AEC3 instances. If you use different modules, technically the GC will
     * take care of this, but it would be more efficient to free it.
     */
    free: () => void;

    /**
     * Analyze this render data. Will process as much as can be eagerly.
     * @param data  Data to analyze, as a Float32Array[]
     */
    analyze: (data: Float32Array[]) => void;

    /**
     * Process this data. Will return as much as can be processed eagerly, which
     * may be as little as nothing, or more data than the input. Returns a
     * Float32Array[][], which is a sequence of frames, each of which is an
     * array of channels, each of which is an array of samples.
     * @param data  Data to process, as a Float32Array[]
     */
    process: (data: Float32Array[]) => Float32Array[][];

    /**
     * Get the size of a render buffer frame. You do not need to operate in
     * frames, but analyze will be have predictably if you do.
     */
    renderBufferSize: () => number;

    /**
     * Get the size of a render buffer frame. You do not need to operate in
     * frames, but process will be have predictably if you do.
     */
    captureBufferSize: () => number;

    /**
     * Get a reference to the render buffer channels. Returns a Float32Array[]
     * of which each Float32Array is a view into the module's memory for the
     * appropriate channel. Low-level interface.
     */
    renderBuffer: () => Float32Array[];

    /**
     * Get a reference to the capture buffer channels. Returns a Float32Array[]
     * of which each Float32Array is a view into the module's memory for the
     * appropriate channel. Low-level interface.
     */
    captureBuffer: () => Float32Array[];

    /**
     * Analyze the internal render buffer. Low-level interface; most of the
     * time, you should use `analyze`.
     */
    analyzeRender: () => void;

    /**
     * Analyze the internal capture buffer. Low-level interface; most of the
     * time, you should use `process`.
     */
    analyzeCapture: () => void;

    /**
     * Process the internal capture buffer. Low-level interface; most of the
     * time, you should use `process`.
     * @param levelChange  Set to true to allow the input level to change
     */
    processCapture: (levelChange: boolean) => void;
}
