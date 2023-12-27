This is a port of WebRTC's AEC3 (acoustic echo cancellation... 3) library to
WebAssembly and JavaScript, so that echo cancellation can be performed on any
audio, rather than trusting whatever echo cancellation `getUserMedia` wishes to
do.

The Google WebRTC implementation from which this is derived is under a 3-clause
BSD license, and so a compiled version of this library falls under the same
license. The small amount of glue code provided by this library itself is under
the so-called “0-clause BSD license” and does not require attribution.
Additionally, library components used by WebRTC are under the Apache 2 license.


# API

Include `webrtcaec3.js`, or import or require this library as a module. This
library loads other components dynamically, so if you're not loading it from
".", you first need to inform it of the base from which to load its
prerequisites by setting a global variable `WebRtcAec3` with a `base` member
like so:

```js
WebRtcAec3 = {base: "dist"};
```

`base` can be a relative path or full URL.

Once the library is loaded, `WebRtcAec3.WebRtcAec3` is a function which returns
a promise for a `WebRtcAec3` module instance. With a `WebRtcAec3` module
instance `AEC3`, `AEC3.AEC3` is a constructor for an AEC3 instance, taking three
parameters: the sample rate, and the number of channels for the render (output)
and capture (input) streams, respectively. The AEC3 library itself is
synchronous, so if you need asynchrony, use it in a WebWorker.

Putting that together:

```js
const AEC3 = await WebRtcAec3.WebRtcAec3();
const aec = new AEC3(sampleRate, outputChannels, inputChannels);
```

The AEC3 instances expose two particularly useful functions: `analyze` and
`process`. Use `analyze` to analyze render (output) data:

```js
aec.analyze(outputData /* Float32Array[] */);
```

Use `process` to process capture (input) data, cancelling echo. `process`
returns a `Float32Array[][]`, which is an array of *frames*, each of which is a
10ms chunk of audio. Each frame is an array of channels, and each channel is a
Float32Array of samples.

```js
const cancelled = aec.process(inputData /* Float32Array[] */);
for (const frame of cancelled) {
    ... do something with this frame of data ...
}
```

Other functions are exposed by AEC3, and you can find their descriptions in the
types file.
