if (typeof process === "undefined" && typeof WebRtcAec3Wasm !== "undefined") {
    Module.locateFile = function (path, scriptDirectory) {
        if (/\.wasm$/.test(path))
            return WebRtcAec3Wasm;
        else
            return scriptDirectory + path;
    };
}
