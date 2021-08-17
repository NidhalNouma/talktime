import { useState, useEffect } from "react";

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19305",
        "stun:stun1.l.google.com:19305",
        "stun:stun2.l.google.com:19305",
        "stun:stun3.l.google.com:19305",
        "stun:stun4.l.google.com:19305",
        "stun:stun.services.mozilla.com",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

function Stream(type) {
  const [lstream, setLStream] = useState(null);
  const [rstream] = useState(new MediaStream());
  const [pc] = useState(new RTCPeerConnection(servers));

  useEffect(() => {
    if (type !== 1) return;
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then(function (stream) {
        // if (lstream) return;
        // Push tracks from local stream to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
        setLStream(stream);
      })
      .catch(function (err) {
        console.log(err.message);
      });

    // Pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        rstream.addTrack(track);
      });
    };
  }, [type]);

  return { lstream, rstream, pc };
}

export default Stream;
