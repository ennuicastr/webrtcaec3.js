CC=emcc
CXX=em++
IFLAGS=\
	-Iabseil-cpp -Iwebrtc -Iwebrtc/rtc_base \
	-DNDEBUG \
	-DWEBRTC_POSIX \
	-DRTC_DISABLE_LOGGING -DWEBRTC_APM_DEBUG_DUMP=0 \
	-DLAST_SYSTEM_ERROR=errno
CFLAGS=-Oz

WEBRTCAEC3JS_VERSION=0.1.0

EFLAGS=\
	--memory-init-file 0 --pre-js pre.js --post-js post.js \
	-s "EXPORT_NAME='WebRtcAec3Factory'" \
	-s "EXPORTED_FUNCTIONS=@exports.json" \
	-s "EXPORTED_RUNTIME_METHODS=['cwrap']" \
	-s MODULARIZE=1

SRC=\
	bindings.cc \
	webrtc/api/audio/echo_canceller3_config.cc \
	webrtc/common_audio/audio_util.cc \
	webrtc/common_audio/resampler/push_sinc_resampler.cc \
	webrtc/common_audio/resampler/sinc_resampler.cc \
	webrtc/common_audio/signal_processing/splitting_filter.c \
	webrtc/common_audio/third_party/ooura/fft_size_128/ooura_fft.cc \
	webrtc/modules/audio_processing/aec3/adaptive_fir_filter.cc \
	webrtc/modules/audio_processing/aec3/adaptive_fir_filter_erl.cc \
	webrtc/modules/audio_processing/aec3/aec_state.cc \
	webrtc/modules/audio_processing/aec3/aec3_common.cc \
	webrtc/modules/audio_processing/aec3/aec3_fft.cc \
	webrtc/modules/audio_processing/aec3/alignment_mixer.cc \
	webrtc/modules/audio_processing/aec3/api_call_jitter_metrics.cc \
	webrtc/modules/audio_processing/aec3/block_buffer.cc \
	webrtc/modules/audio_processing/aec3/block_delay_buffer.cc \
	webrtc/modules/audio_processing/aec3/block_framer.cc \
	webrtc/modules/audio_processing/aec3/block_processor.cc \
	webrtc/modules/audio_processing/aec3/block_processor_metrics.cc \
	webrtc/modules/audio_processing/aec3/clockdrift_detector.cc \
	webrtc/modules/audio_processing/aec3/coarse_filter_update_gain.cc \
	webrtc/modules/audio_processing/aec3/comfort_noise_generator.cc \
	webrtc/modules/audio_processing/aec3/config_selector.cc \
	webrtc/modules/audio_processing/aec3/decimator.cc \
	webrtc/modules/audio_processing/aec3/dominant_nearend_detector.cc \
	webrtc/modules/audio_processing/aec3/downsampled_render_buffer.cc \
	webrtc/modules/audio_processing/aec3/echo_audibility.cc \
	webrtc/modules/audio_processing/aec3/echo_canceller3.cc \
	webrtc/modules/audio_processing/aec3/echo_path_delay_estimator.cc \
	webrtc/modules/audio_processing/aec3/echo_path_variability.cc \
	webrtc/modules/audio_processing/aec3/echo_remover.cc \
	webrtc/modules/audio_processing/aec3/echo_remover_metrics.cc \
	webrtc/modules/audio_processing/aec3/erl_estimator.cc \
	webrtc/modules/audio_processing/aec3/erle_estimator.cc \
	webrtc/modules/audio_processing/aec3/fft_buffer.cc \
	webrtc/modules/audio_processing/aec3/filter_analyzer.cc \
	webrtc/modules/audio_processing/aec3/frame_blocker.cc \
	webrtc/modules/audio_processing/aec3/fullband_erle_estimator.cc \
	webrtc/modules/audio_processing/aec3/matched_filter.cc \
	webrtc/modules/audio_processing/aec3/matched_filter_lag_aggregator.cc \
	webrtc/modules/audio_processing/aec3/moving_average.cc \
	webrtc/modules/audio_processing/aec3/multi_channel_content_detector.cc \
	webrtc/modules/audio_processing/aec3/refined_filter_update_gain.cc \
	webrtc/modules/audio_processing/aec3/render_buffer.cc \
	webrtc/modules/audio_processing/aec3/render_delay_buffer.cc \
	webrtc/modules/audio_processing/aec3/render_delay_controller.cc \
	webrtc/modules/audio_processing/aec3/render_delay_controller_metrics.cc \
	webrtc/modules/audio_processing/aec3/render_signal_analyzer.cc \
	webrtc/modules/audio_processing/aec3/residual_echo_estimator.cc \
	webrtc/modules/audio_processing/aec3/reverb_decay_estimator.cc \
	webrtc/modules/audio_processing/aec3/reverb_frequency_response.cc \
	webrtc/modules/audio_processing/aec3/reverb_model.cc \
	webrtc/modules/audio_processing/aec3/reverb_model_estimator.cc \
	webrtc/modules/audio_processing/aec3/signal_dependent_erle_estimator.cc \
	webrtc/modules/audio_processing/aec3/spectrum_buffer.cc \
	webrtc/modules/audio_processing/aec3/stationarity_estimator.cc \
	webrtc/modules/audio_processing/aec3/subband_erle_estimator.cc \
	webrtc/modules/audio_processing/aec3/subband_nearend_detector.cc \
	webrtc/modules/audio_processing/aec3/subtractor.cc \
	webrtc/modules/audio_processing/aec3/subtractor_output.cc \
	webrtc/modules/audio_processing/aec3/subtractor_output_analyzer.cc \
	webrtc/modules/audio_processing/aec3/suppression_filter.cc \
	webrtc/modules/audio_processing/aec3/suppression_gain.cc \
	webrtc/modules/audio_processing/aec3/transparent_mode.cc \
	webrtc/modules/audio_processing/audio_buffer.cc \
	webrtc/modules/audio_processing/high_pass_filter.cc \
	webrtc/modules/audio_processing/logging/apm_data_dumper.cc \
	webrtc/modules/audio_processing/splitting_filter.cc \
	webrtc/modules/audio_processing/three_band_filter_bank.cc \
	webrtc/modules/audio_processing/utility/cascaded_biquad_filter.cc \
	webrtc/rtc_base/checks.cc \
	webrtc/rtc_base/experiments/field_trial_parser.cc \
	webrtc/rtc_base/memory/aligned_malloc.cc \
	webrtc/rtc_base/platform_thread_types.cc \
	webrtc/rtc_base/race_checker.cc \
	webrtc/rtc_base/string_encode.cc \
	webrtc/rtc_base/string_utils.cc \
	webrtc/rtc_base/strings/string_builder.cc \
	webrtc/rtc_base/system_time.cc \
	webrtc/rtc_base/time_utils.cc \
	webrtc/system_wrappers/source/field_trial.cc \
	webrtc/system_wrappers/source/metrics.cc

SRCCCO=$(SRC:.cc=.o)
OBJS=$(addprefix build/build-wasm/,$(SRCCCO:.c=.o))

all: dist/webrtcaec3-$(WEBRTCAEC3JS_VERSION).js \
	dist/webrtcaec3-$(WEBRTCAEC3JS_VERSION).asm.js \
	dist/webrtcaec3-$(WEBRTCAEC3JS_VERSION).wasm.js \
	dist/webrtcaec3.types.d.ts

dist/webrtcaec3-$(WEBRTCAEC3JS_VERSION).js: webrtcaec3.in.js \
		node_modules/.bin/uglifyjs
	mkdir -p dist
	sed 's/@VER/$(WEBRTCAEC3JS_VERSION)/g' $< | \
		node_modules/.bin/uglifyjs -m > $@

dist/webrtcaec3.types.d.ts: webrtcaec3.types.in.d.ts
	mkdir -p dist
	cp $< $@

dist/webrtcaec3-$(WEBRTCAEC3JS_VERSION).asm.js: $(OBJS) exports.json pre.js \
		post.js
	mkdir -p dist
	$(CC) $(IFLAGS) $(CFLAGS) $(EFLAGS) -s WASM=0 \
		$(OBJS) -o $@
	cat license.js $@ > $@.tmp
	mv $@.tmp $@

dist/webrtcaec3-$(WEBRTCAEC3JS_VERSION).wasm.js: $(OBJS) exports.json pre.js \
		post.js
	mkdir -p dist
	$(CC) $(IFLAGS) $(CFLAGS) $(EFLAGS) \
		$(OBJS) -o $@
	( \
		cat license.js ; \
		printf 'WebRtcAec3Wasm="data:application/wasm;base64,' ; \
		base64 -w0 < dist/webrtcaec3-$(WEBRTCAEC3JS_VERSION).wasm.wasm | sed 's/$$/";/'; \
		cat $@ \
	) > $@.tmp
	mv $@.tmp $@
	chmod a-x dist/webrtcaec3-$(WEBRTCAEC3JS_VERSION).wasm.wasm

build/build-wasm/%.o: %.c
	mkdir -p $(dir $@)
	$(CC) $(IFLAGS) $(CFLAGS) -c $< -o $@

build/build-wasm/%.o: %.cc
	mkdir -p $(dir $@)
	$(CXX) $(IFLAGS) $(CFLAGS) -c $< -o $@

node_modules/.bin/uglifyjs:
	npm install

clean:
	rm -rf dist build

distclean: clean
	@true
