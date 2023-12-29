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

#include <cstdlib>

#include "webrtc/api/audio/echo_canceller3_config.h"
#include "webrtc/modules/audio_processing/aec3/echo_canceller3.h"
#include "webrtc/modules/audio_processing/audio_buffer.h"

namespace js {
    class EchoCanceller3WithBuffer {
        public:

        EchoCanceller3WithBuffer(
            int sample_rate_hz, int num_render_channels, int num_capture_channels
        )
        {
            webrtc::EchoCanceller3Config config;
            ec3 = std::make_unique<webrtc::EchoCanceller3>(
                config, absl::nullopt, sample_rate_hz,
                num_render_channels, num_capture_channels
            );
            ec3->SetCaptureOutputUsage(true);
        }

        std::unique_ptr<webrtc::EchoCanceller3> ec3;
        std::unique_ptr<webrtc::AudioBuffer> renderInBuffer, captureInBuffer;
        std::unique_ptr<webrtc::AudioBuffer> renderBuffer, captureBuffer;
        std::unique_ptr<webrtc::AudioBuffer> renderOutBuffer, captureOutBuffer;
    };
}

extern "C" {
    js::EchoCanceller3WithBuffer *WebRtcAec3_create(
        int sample_rate_hz, int num_render_channels, int num_capture_channels
    ) {
        return new js::EchoCanceller3WithBuffer{
            sample_rate_hz, num_render_channels, num_capture_channels
        };
    }

    void WebRtcAec3_free(js::EchoCanceller3WithBuffer *ec3) {
        delete ec3;
    }

    void WebRtcAec3_setAudioBufferDelay(
        js::EchoCanceller3WithBuffer *ec3, int delay_ms
    ) {
        ec3->ec3->SetAudioBufferDelay(delay_ms);
    }

#define GET_BUFFER(nm) \
    webrtc::AudioBuffer *WebRtcAec3_ ## nm ## Buffer( \
        js::EchoCanceller3WithBuffer *ec3 \
    ) { \
        return ec3->nm ## Buffer.get(); \
    }

    GET_BUFFER(renderIn)
    GET_BUFFER(captureIn)
    GET_BUFFER(render)
    GET_BUFFER(capture)
    GET_BUFFER(renderOut)
    GET_BUFFER(captureOut)

#undef GET_BUFFER

    unsigned int WebRtcAudioBuffer_num_frames(
        webrtc::AudioBuffer *ab
    ) {
        return ab->num_frames();
    }

    float *const *WebRtcAudioBuffer_channels(
        webrtc::AudioBuffer *ab
    ) {
        return ab->channels();
    }

    void WebRtcAudioBuffer_splitIntoFrequencyBands(
        webrtc::AudioBuffer *ab
    ) {
        ab->SplitIntoFrequencyBands();
    }

    void WebRtcAudioBuffer_mergeFrequencyBands(
        webrtc::AudioBuffer *ab
    ) {
        ab->MergeFrequencyBands();
    }

    void WebRtcAudioBuffer_copyIn(
        webrtc::AudioBuffer *to, webrtc::AudioBuffer *from,
        int sampleRate, size_t numChannels
    ) {
        webrtc::StreamConfig sc{sampleRate, numChannels};
        to->CopyFrom(from->channels(), sc);
    }

    void WebRtcAudioBuffer_copyOut(
        webrtc::AudioBuffer *to, webrtc::AudioBuffer *from,
        int sampleRate, size_t numChannels
    ) {
        webrtc::StreamConfig sc{sampleRate, numChannels};
        from->CopyTo(sc, to->channels());
    }

#define MK_BUFFER(nm, nmc) \
    webrtc::AudioBuffer *WebRtcAec3_mk ## nmc ## Buffer( \
        js::EchoCanceller3WithBuffer *ec3, \
        int inSampleRate, size_t inNumChannels, \
        int procSampleRate, size_t procNumChannels, \
        int outSampleRate, size_t outNumChannels \
    ) { \
        ec3->nm ## InBuffer = std::make_unique<webrtc::AudioBuffer>( \
            inSampleRate, inNumChannels, \
            inSampleRate, inNumChannels, \
            inSampleRate, inNumChannels \
        ); \
        \
        ec3->nm ## Buffer = std::make_unique<webrtc::AudioBuffer>( \
            inSampleRate, inNumChannels, \
            procSampleRate, procNumChannels, \
            outSampleRate, outNumChannels \
        ); \
        \
        ec3->nm ## OutBuffer = std::make_unique<webrtc::AudioBuffer>( \
            outSampleRate, outNumChannels, \
            outSampleRate, outNumChannels, \
            outSampleRate, outNumChannels \
        ); \
        \
        return ec3->nm ## InBuffer.get(); \
    }

    MK_BUFFER(render, Render)
    MK_BUFFER(capture, Capture)

#undef MK_BUFFER

    void WebRtcAec3_analyzeRender(
        js::EchoCanceller3WithBuffer *ec3
    ) {
        ec3->ec3->AnalyzeRender(ec3->renderBuffer.get());
    }

    void WebRtcAec3_analyzeCapture(
        js::EchoCanceller3WithBuffer *ec3
    ) {
        ec3->ec3->AnalyzeCapture(ec3->captureBuffer.get());
    }

    void WebRtcAec3_processCapture(
        js::EchoCanceller3WithBuffer *ec3, int level_change
    ) {
        ec3->ec3->ProcessCapture(
            ec3->captureBuffer.get(), level_change
        );
    }
}
