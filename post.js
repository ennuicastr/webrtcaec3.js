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

var aec3 = {
    create: Module.cwrap(
        "WebRtcAec3_create", "number", ["number", "number", "number"]
    ),

    free: Module.cwrap("WebRtcAec3_free", null, ["number"]),

    setAudioBufferDelay: Module.cwrap(
        "WebRtcAec3_setAudioBufferDelay", null, ["number", "number"]
    ),

    abNumFrames: Module.cwrap(
        "WebRtcAudioBuffer_num_frames", "number", ["number"]
    ),

    abChannels: Module.cwrap(
        "WebRtcAudioBuffer_channels", "number", ["number"]
    ),

    abSplitIntoFrequencyBands: Module.cwrap(
        "WebRtcAudioBuffer_splitIntoFrequencyBands", null, ["number"]
    ),

    abMergeFrequencyBands: Module.cwrap(
        "WebRtcAudioBuffer_mergeFrequencyBands", null, ["number"]
    ),

    abCopyIn: Module.cwrap(
        "WebRtcAudioBuffer_copyIn", null, [
            "number", "number", "number", "number"
        ]
    ),

    abCopyOut: Module.cwrap(
        "WebRtcAudioBuffer_copyOut", null, [
            "number", "number", "number", "number"
        ]
    ),

    mkRenderInBuffer: Module.cwrap(
        "WebRtcAec3_mkRenderInBuffer", "number", [
            "number", "number", "number", "number", "number"
        ]
    ),

    mkCaptureInBuffer: Module.cwrap(
        "WebRtcAec3_mkCaptureInBuffer", "number", [
            "number", "number", "number", "number", "number"
        ]
    ),

    analyzeRender: Module.cwrap("WebRtcAec3_analyzeRender", null, ["number"]),

    analyzeCapture: Module.cwrap("WebRtcAec3_analyzeCapture", null, ["number"]),

    processCapture: Module.cwrap(
        "WebRtcAec3_processCapture", null, ["number", "number"]
    ),
};

(function() {
    var buffers = [
        "renderIn", "captureIn",
        "render", "capture",
        "renderOut", "captureOut"
    ];
    for (var bi = 0; bi < buffers.length; bi++) {
        var bn = buffers[bi] + "Buffer";
        aec3[bn] = Module.cwrap("WebRtcAec3_" + bn, "number", ["number"]);
    }
})();

Module.AEC3 = function(sampleRate, renderNumChannels, captureNumChannels) {
    /**
     * Remember metadata.
     */
    this.sampleRate = sampleRate;
    this.renderNumChannels = renderNumChannels;
    this.captureNumChannels = captureNumChannels;

    // Pointer to the instance itself
    var ptr = this._instance = aec3.create(
        sampleRate, renderNumChannels, captureNumChannels
    );
    aec3.setAudioBufferDelay(ptr, 0);

    // Render buffer
    this._renderBuf = {
        sampleRate: 0
    };

    this._assertBuf(
        this._renderBuf, sampleRate, renderNumChannels, renderNumChannels,
        aec3.mkRenderInBuffer, aec3.renderBuffer, aec3.renderOutBuffer
    );

    // Capture buffer
    this._captureBuf = {
        sampleRate: 0
    };

    this._assertBuf(
        this._captureBuf, sampleRate, captureNumChannels, captureNumChannels,
        aec3.mkCaptureInBuffer, aec3.captureBuffer, aec3.captureOutBuffer
    );
};

Object.assign(Module.AEC3.prototype, {
    free: function() {
        aec3.free(this._instance);
    },

    setAudioBufferDelay: function(to) {
        aec3.setAudioBufferDelay(this._instance, to);
    },

    // Assert that a buffer is as needed
    _assertBuf: function(
        buf, sampleRateIn, channelsOut, channelsIn,
        inCtor, bufGetter, outGetter
    ) {
        if (buf.sampleRate !== sampleRateIn || buf.inp.length !== channelsIn) {
            var ptr = buf.inpPtr = inCtor(
                this._instance,
                this.sampleRate, channelsOut,
                sampleRateIn, channelsIn
            );
            buf.inp = this._floatPtrPtr(
                aec3.abChannels(ptr), channelsIn, aec3.abNumFrames(ptr)
            );
            ptr = buf.bufPtr = bufGetter(this._instance);
            buf.buf = this._floatPtrPtr(
                aec3.abChannels(ptr), channelsOut, aec3.abNumFrames(ptr)
            );
            ptr = buf.outPtr = outGetter(this._instance);
            buf.out = this._floatPtrPtr(
                aec3.abChannels(ptr), channelsOut, aec3.abNumFrames(ptr)
            );
            buf.sampleRate = sampleRateIn;
            buf.pos = 0;
        }
        return buf;
    },

    _floatPtrPtr: function(floatPtrPtr, floatPtrArrSz, floatArrSz) {
        var floatPtrArr = new Uint32Array(
            Module.HEAPU8.buffer, floatPtrPtr, floatPtrArrSz
        );
        return Array.from(floatPtrArr).map(function(ptr) {
            return new Float32Array(Module.HEAPU8.buffer, ptr, floatArrSz);
        });
    },

    // Perform an action one buffer at a time
    _bufAtATime: function(buf, data, act) {
        var bufPos = buf.pos;
        var dataPos = 0;
        while (true) {
            var bufRem = buf.inp[0].length - bufPos;
            var dataRem = data[0].length - dataPos;

            // Copy in some data
            if (dataRem >= bufRem) {
                // We can fill an entire buffer
                for (var ch = 0; ch < data.length; ch++) {
                    buf.inp[ch].set(
                        data[ch].subarray(dataPos, dataPos + bufRem),
                        bufPos
                    );
                }

                // And act
                aec3.abCopyIn(
                    buf.bufPtr, buf.inpPtr, buf.sampleRate, buf.inp.length
                );
                act();

                bufPos = 0;
                dataPos += bufRem;

            } else if (dataRem) {
                // Leave some overflow
                for (var ch = 0; ch < data.length; ch++) {
                    buf.inp[ch].set(
                        data[ch].subarray(dataPos), bufPos
                    );
                }
                bufPos += dataRem;
                break;

            } else break;
        }
        buf.pos = bufPos;
    },

    /**
     * Analyze this render data. Will process as much as can be eagerly.
     * @param data  Data to analyze.
     * @param opts  Options.
     */
    analyze: function(data, opts) {
        var self = this;
        opts = opts || {};
        var buf = this._renderBuf;
        this._assertBuf(
            buf, opts.sampleRate || this.sampleRate,
            this.renderNumChannels, data.length,
            aec3.mkRenderInBuffer, aec3.renderBuffer, aec3.renderOutBuffer
        );
        this._bufAtATime(
            this._renderBuf, data, function() {
                aec3.abSplitIntoFrequencyBands(buf.bufPtr);
                aec3.analyzeRender(self._instance);
            }
        );
    },

    /**
     * Get the length of the output data given this input data. That is, if you
     * process this data now, how many samples will the output have?
     * @param data  Data that will be processed.
     * @param opts  Options. Must be the same as will be used by `process`.
     */
    processSize: function(data, opts) {
        opts = opts || {};
        var inSampleRate = opts.sampleRate || this.sampleRate;
        var inFrameSize = ~~(inSampleRate / 100);
        var samples = data[0].length;
        var buf = this._captureBuf;
        if (buf.sampleRate === inSampleRate &&
            buf.inp.length === data.length) {
            // Any overflowed data will be included
            samples += buf.pos;
        }
        var frames = ~~(samples / inFrameSize);
        var outFrameSize = ~~(this.sampleRate / 100);
        return frames * outFrameSize;
    },

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
    process: function(out, data, opts) {
        var self = this;
        opts = opts || {};
        this._assertBuf(
            this._captureBuf, opts.sampleRate || this.sampleRate,
            this.captureNumChannels, data.length,
            aec3.mkCaptureInBuffer, aec3.captureBuffer, aec3.captureOutBuffer
        );
        var buf = this._captureBuf;
        var ret = [];
        var outIdx = 0;
        this._bufAtATime(
            buf, data, function() {
                if (opts.pre) {
                    // Get the separated data before processing
                    aec3.abCopyOut(
                        buf.outPtr, buf.bufPtr, self.sampleRate, buf.out.length
                    );
                    for (var c = 0; c < buf.out.length; c++)
                        opts.pre[c].set(buf.out[c], outIdx);
                }

                // Process with AEC3, then suppress
                aec3.abSplitIntoFrequencyBands(buf.bufPtr);
                aec3.analyzeCapture(self._instance);
                aec3.processCapture(self._instance, 0);
                aec3.abMergeFrequencyBands(buf.bufPtr);

                // And copy out
                aec3.abCopyOut(
                    buf.outPtr, buf.bufPtr, self.sampleRate, buf.out.length
                );
                for (var c = 0; c < buf.out.length; c++)
                    out[c].set(buf.out[c], outIdx);
                outIdx += buf.out[0].length;
            }
        );
    }
});
