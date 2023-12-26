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

    renderBufferSize: Module.cwrap(
        "WebRtcAec3_renderBufferSize", "number", ["number"]
    ),

    captureBufferSize: Module.cwrap(
        "WebRtcAec3_captureBufferSize", "number", ["number"]
    ),

    renderBufferChannels: Module.cwrap(
        "WebRtcAec3_renderBufferChannels", "number", ["number"]
    ),

    captureBufferChannels: Module.cwrap(
        "WebRtcAec3_captureBufferChannels", "number", ["number"]
    ),

    analyzeRender: Module.cwrap("WebRtcAec3_analyzeRender", null, ["number"]),

    analyzeCapture: Module.cwrap("WebRtcAec3_analyzeCapture", null, ["number"]),

    processCapture: Module.cwrap(
        "WebRtcAec3_processCapture", null, ["number", "number"]
    ),
};

Module.AEC3 = function(sampleRate, renderNumChannels, captureNumChannels) {
    /**
     * Pointer to the instance itself.
     */
    this._instance = aec3.create(
        sampleRate, renderNumChannels, captureNumChannels
    );

    /**
     * Our current position within the rendering buffer.
     */
    this._renderBufPos = 0;

    /**
     * Our current position within the capture buffer.
     */
    this._captureBufPos = 0;

    /**
     * Remember metadata.
     */
    this.sampleRate = sampleRate;
    this.renderNumChannels = renderNumChannels;
    this.captureNumChannels = captureNumChannels;
};

Object.assign(Module.AEC3.prototype, {
    free: function() {
        aec3.free(this._instance);
    },

    renderBufferSize: function() {
        return aec3.renderBufferSize(this._instance);
    },

    captureBufferSize: function() {
        return aec3.captureBufferSize(this._instance);
    },

    renderBuffer: function() {
        return this._floatPtrPtr(
            aec3.renderBufferChannels(this._instance),
            this.renderNumChannels,
            this.renderBufferSize()
        );
    },

    captureBuffer: function() {
        return this._floatPtrPtr(
            aec3.captureBufferChannels(this._instance),
            this.captureNumChannels,
            this.captureBufferSize()
        );
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

    // Copy data into a buffer, running a function when it's full
    _copyIn: function(buf, bufPos, data, whenFull) {
        var dataPos = 0;
        while (true) {
            // Copy in some data
            var bufRem = buf[0].length - bufPos;
            var dataRem = data[0].length - dataPos;
            if (dataRem >= bufRem) {
                // Copy in a bit
                var di = 0;
                for (var bi = 0; bi < buf.length; bi++) {
                    buf[bi].set(
                        data[di].subarray(dataPos, dataPos + bufRem), bufPos
                    );
                    di = (di + 1) % data.length;
                }

                // Buffer full
                whenFull();

                dataPos += bufRem;
                bufPos = 0;
                bufRem = buf[0].length;
            } else if (dataRem) {
                // Copy in what remains
                var di = 0;
                for (var bi = 0; bi < buf.length; bi++) {
                    buf[bi].set(data[di].subarray(dataPos), bufPos);
                    di = (di + 1) % data.length;
                }
                bufPos += dataRem;
                break;
            } else break;
        }
        return bufPos;
    },

    /**
     * Analyze this render data. Will process as much as can be eagerly.
     * @param data  Data to analyze, as a Float32Array[]
     */
    analyze: function(data) {
        var self = this;
        this._captureBufPos = this._copyIn(
            this.captureBuffer(), this._captureBufPos, data, function() {
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
     */
    process: function(data) {
        var self = this;
        var buf = this.renderBuffer();
        var ret = [];
        this._renderBufPos = this._copyIn(
            buf, this._renderBufPos, data, function() {
                ret.push(buf.map(function(x) { return x.slice(0); }));
            }
        );
        return ret;
    }
});
