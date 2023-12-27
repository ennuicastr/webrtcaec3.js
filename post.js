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

    renderBuffer: Module.cwrap(
        "WebRtcAec3_renderBuffer", "number", ["number"]
    ),

    captureBuffer: Module.cwrap(
        "WebRtcAec3_captureBuffer", "number", ["number"]
    ),

    renderInBuffer: Module.cwrap(
        "WebRtcAec3_renderInBuffer", "number", ["number"]
    ),

    captureInBuffer: Module.cwrap(
        "WebRtcAec3_captureInBuffer", "number", ["number"]
    ),

    abNumFrames: Module.cwrap(
        "WebRtcAudioBuffer_num_frames", "number", ["number"]
    ),

    abChannels: Module.cwrap(
        "WebRtcAudioBuffer_channels", "number", ["number"]
    ),

    abCopy: Module.cwrap(
        "WebRtcAudioBuffer_copy", null, ["number", "number"]
    ),

    mkRenderBuffer: Module.cwrap(
        "WebRtcAec3_mkRenderBuffer", "number", [
            "number", "number", "number", "number", "number"
        ]
    ),

    mkCaptureBuffer: Module.cwrap(
        "WebRtcAec3_mkCaptureBuffer", "number", [
            "number", "number", "number", "number", "number"
        ]
    ),

    analyzeRender: Module.cwrap("WebRtcAec3_analyzeRender", null, ["number"]),

    analyzeCapture: Module.cwrap("WebRtcAec3_analyzeCapture", null, ["number"]),

    processCapture: Module.cwrap(
        "WebRtcAec3_processCapture", null, ["number", "number"]
    ),
};

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

    // Render buffer
    this._renderBuf = {
        sampleRate: 0
    };

    this._assertBuf(
        this._renderBuf, sampleRate, renderNumChannels, renderNumChannels,
        aec3.mkRenderBuffer, aec3.renderBuffer
    );

    // Capture buffer
    this._captureBuf = {
        sampleRate: 0
    };

    this._assertBuf(
        this._captureBuf, sampleRate, captureNumChannels, captureNumChannels,
        aec3.mkCaptureBuffer, aec3.captureBuffer
    );
};

Object.assign(Module.AEC3.prototype, {
    free: function() {
        aec3.free(this._instance);
    },

    // Assert that a buffer is as needed
    _assertBuf: function(
        buf, sampleRateIn, channelsOut, channelsIn, ctor, getter
    ) {
        if (buf.sampleRate !== sampleRateIn || buf.inp.length !== channelsIn) {
            var ptr = buf.inpPtr = ctor(
                this._instance,
                this.sampleRate, channelsOut,
                sampleRateIn, channelsIn
            );
            buf.inp = this._floatPtrPtr(
                aec3.abChannels(ptr), channelsIn, aec3.abNumFrames(ptr)
            );
            ptr = buf.bufPtr = getter(this._instance);
            buf.buf = this._floatPtrPtr(
                aec3.abChannels(ptr), channelsOut, aec3.abNumFrames(ptr)
            );
            buf.sampleRate = sampleRateIn;
            buf.pos = 0;
        }
        return buf;
    },

    renderBuffer: function() {
        return this._renderBuf.buf;
    },

    captureBuffer: function() {
        return this._captureBuf.buf;
    },

    _floatPtrPtr: function(floatPtrPtr, floatPtrArrSz, floatArrSz) {
        var floatPtrArr = new Uint32Array(
            Module.HEAPU8.buffer, floatPtrPtr, floatPtrArrSz
        );
        return Array.from(floatPtrArr).map(function(ptr) {
            return new Float32Array(Module.HEAPU8.buffer, ptr, floatArrSz);
        });
    },

    analyzeRender: function() {
        aec3.analyzeRender(this._instance);
    },

    analyzeCapture: function() {
        aec3.analyzeCapture(this._instance);
    },

    processCapture: function(levelChange) {
        levelChange = !!levelChange;
        aec3.processCapture(this._instance, +levelChange);
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
                aec3.abCopy(buf.bufPtr, buf.inpPtr);
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
     * @param data  Data to analyze, as a Float32Array[]
     * @param opts  Input data options
     */
    analyze: function(data, opts) {
        var self = this;
        opts = opts || {};
        this._assertBuf(
            this._renderBuf, opts.sampleRate || this.sampleRate,
            this.renderNumChannels, data.length,
            aec3.mkRenderBuffer, aec3.renderBuffer
        );
        this._bufAtATime(
            this._renderBuf, data, function() {
                self.analyzeCapture();
            }
        );
    },

    /**
     * Process this data. Will return as much as can be processed eagerly, which
     * may be as little as nothing, or more data than the input. Returns a
     * Float32Array[][], which is a sequence of frames, each of which is an
     * array of channels, each of which is an array of samples.
     * @param data  Data to process, as a Float32Array[]
     * @param opts  Processing options
     */
    process: function(data, opts) {
        var self = this;
        opts = opts || {};
        this._assertBuf(
            this._captureBuf, opts.sampleRate || this.sampleRate,
            this.captureNumChannels, data.length,
            aec3.mkCaptureBuffer, aec3.captureBuffer
        );
        var buf = this._captureBuf.buf;
        var ret = [];
        this._bufAtATime(
            this._captureBuf, data, function() {
                self.processCapture(false);
                ret.push(buf.map(function(x) { return x.slice(0); }));
            }
        );
        return ret;
    }
});
