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

#include "webrtc/api/audio/echo_canceller3_factory.h"
#include "webrtc/api/audio/echo_control.h"
#include "webrtc/modules/audio_processing/audio_buffer.h"

namespace js {
    class EchoCanceller3WithBuffer {
        public:

        EchoCanceller3WithBuffer(
            int sample_rate_hz, int num_render_channels, int num_capture_channels
        )
        {
            auto ecfup = std::make_unique<webrtc::EchoCanceller3Factory>();
            echoControl = ecfup->Create(
                sample_rate_hz, num_render_channels, num_capture_channels
            );
            renderBuffer = std::make_unique<webrtc::AudioBuffer>(
                sample_rate_hz, num_render_channels,
                sample_rate_hz, num_render_channels,
                sample_rate_hz, num_render_channels
            );
            captureBuffer = std::make_unique<webrtc::AudioBuffer>(
                sample_rate_hz, num_capture_channels,
                sample_rate_hz, num_capture_channels,
                sample_rate_hz, num_capture_channels
            );
        }

        std::unique_ptr<webrtc::EchoControl> echoControl;
        std::unique_ptr<webrtc::AudioBuffer> renderBuffer, captureBuffer;
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

    unsigned int WebRtcAec3_renderBufferSize(
        js::EchoCanceller3WithBuffer *ec3
    ) {
        return ec3->renderBuffer->num_frames();
    }

    unsigned int WebRtcAec3_captureBufferSize(
        js::EchoCanceller3WithBuffer *ec3
    ) {
        return ec3->captureBuffer->num_frames();
    }

    float *const *WebRtcAec3_renderBufferChannels(
        js::EchoCanceller3WithBuffer *ec3
    ) {
        return ec3->renderBuffer->channels();
    }

    float *const *WebRtcAec3_captureBufferChannels(
        js::EchoCanceller3WithBuffer *ec3
    ) {
        return ec3->captureBuffer->channels();
    }

    void WebRtcAec3_analyzeRender(
        js::EchoCanceller3WithBuffer *ec3
    ) {
        ec3->echoControl->AnalyzeRender(ec3->renderBuffer.get());
    }

    void WebRtcAec3_analyzeCapture(
        js::EchoCanceller3WithBuffer *ec3
    ) {
        ec3->echoControl->AnalyzeCapture(ec3->captureBuffer.get());
    }

    void WebRtcAec3_processCapture(
        js::EchoCanceller3WithBuffer *ec3, int level_change
    ) {
        ec3->echoControl->ProcessCapture(
            ec3->captureBuffer.get(), level_change
        );
    }
}
