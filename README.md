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

Include `webrtcaec3.js`, or import or require this library as a module. Once the
library is loaded, `WebRtcAec3` is a function which returns a promise for a
`WebRtcAec3` module instance. With a `WebRtcAec3` module instance `AEC3`,
`AEC3.AEC3` is a constructor for an AEC3 instance, taking three parameters: the
sample rate, and the number of channels for the render (output) and capture
(input) streams, respectively. The AEC3 library itself is synchronous, so if you
need asynchrony, use it in a WebWorker.

Putting that together:

```js
const AEC3 = await WebRtcAec3();
const aec = new AEC3(sampleRate, outputChannels, inputChannels);
```

Note that not all sample rates will work. In fact, most won't. Basically, use
`48000`.

The AEC3 instances expose three methods: `analyze`, `processSize`, and
`process`. Use `analyze` to analyze render (output) data:

```js
aec.analyze(outputData /* Float32Array[] */);
```

Use `process` to process capture (input) data, cancelling echo. It deposits the
processed data into an output buffer which you must provide. You can use
`processSize` to get the necessary size of each channel of the output buffer.

```js
const bufSz = aec.processSize(inputData);
const outBuf = [new Float32Array(bufSz)]; // one per channel
const cancelled = aec.process(outBuf, inputData /* Float32Array[] */);
... do something with outBuf ...
```

`analyze`, `processSize`, and `process` each take an optional “options”
argument, which in particular can take a sample rate for the input data. If the
sample rate for the input data does not match the sample rate with which the
AEC3 instance was created, it will be resampled.

For further documentation on each method, see the types file.
