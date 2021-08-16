import React, { useState, useEffect, useRef } from "react";
import Wave from "wave-visualizer";

function WaveAudio({ stream, lstream }) {
  const [wave] = useState(new Wave());
  const [lwave] = useState(new Wave());
  const [rel, setRel] = useState(0);

  const audio = useRef(null);

  useEffect(() => {
    const interval = setTimeout(() => {
      setRel((r) => r + 1);
      // console.log(rel);
    }, 1000);
    return () => clearTimeout(interval);
  }, [rel]);

  useEffect(() => {
    wave.stopStream();
    lwave.stopStream();
    if (stream)
      if (stream.active)
        wave.fromStream(stream, "wave", {
          type: "shine",
          colors: ["rgba(149, 54, 64,1)", "white", "blue"],
        });

    lstream &&
      lstream.active &&
      lwave.fromStream(lstream, "lwave", {
        type: "shine",
        colors: ["rgba(45, 134, 233, 1)", "white", "blue"],
      });

    // console.log("Start streaming audio ...");

    audio.current.srcObject = stream;
    return () => {
      wave.stopStream();
      lwave.stopStream();
    };
  }, [lstream, stream, rel]);

  return (
    <div>
      <canvas id="wave"></canvas>
      <br />
      <canvas id="lwave"></canvas>
      <audio
        ref={audio}
        style={{ display: "none" }}
        volume="true"
        autoPlay
      ></audio>
    </div>
  );
}

export default WaveAudio;
