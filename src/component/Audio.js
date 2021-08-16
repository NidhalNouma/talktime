import React, { useEffect, useState, useRef } from "react";
import Loader from "react-loader-spinner";
import WaveAudio from "./WaveAudio";
import { createOffer, getAllDialling, removeDialling } from "../hooks/Fire";

import Stream from "../hooks/Stream";

function Audio({ type = 0, answer }) {
  const { lstream, rstream, pc } = Stream(type);
  const [id, setId] = useState(null);
  const [callId, setCallId] = useState(null);
  const [ids, setIds] = useState([]);
  let uns = useRef(null);

  useEffect(() => {
    if (type === 1) {
      createOffer(pc).then((i) => {
        setId(i);
        uns.current = getAllDialling(pc, i, setIds, setCallId);
      });
    } else if (id !== null) {
      removeDialling(id);
      setId(null);
      uns.current();
    }

    if (type !== 2) {
      setCallId(null);
      stopAudioOnly(lstream);
      stopAudioOnly(rstream);
    }
  }, [type]);

  useEffect(() => {
    if (callId) answer();
  }, [callId, answer]);

  return type === 1 ? (
    <Loader
      type="ThreeDots"
      color="rgba(102, 193, 113, 1)"
      height={100}
      width={100}
    />
  ) : type === 2 ? (
    <WaveAudio stream={rstream} lstream={lstream} />
  ) : (
    <></>
  );
}

export default Audio;

function stopAudioOnly(stream) {
  stream?.getTracks().forEach(function (track) {
    if (track.readyState === "live" && track.kind === "audio") {
      track.stop();
    }
  });
}
