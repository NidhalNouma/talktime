import firebase from "firebase/app";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApGSMWbFNPmUZKk4RQDmZYCBqlB5B69Xk",
  authDomain: "talktime-57dc9.firebaseapp.com",
  projectId: "talktime-57dc9",
  storageBucket: "talktime-57dc9.appspot.com",
  messagingSenderId: "907184166513",
  appId: "1:907184166513:web:5b7cd711a736d985aaadd0",
  measurementId: "G-6049KZ3QMC",
};

const status = {
  waiting: "waiting",
  offerCall: "offerCall",
  reciveOffer: "reciveOffer",
  confirmOffer: "confirmOffer",
  call: "call",
  answer: "answer",
};

const diallingCollection = "dialling";
const callCollection = "call";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

export async function createOffer(pc) {
  // Reference Firestore collections for signaling
  const doc = firestore.collection(diallingCollection).doc();
  const id = doc.id;

  doc.set({
    status: status.waiting,
    time: new Date().getTime(),
    offerId: id,
    answerId: null,
  });

  return id;
}

export function getAllDialling(pc, id, setData, setCall) {
  return firestore.collection(diallingCollection).onSnapshot((doc) => {
    const ids = doc.docs.map((doc) => doc.id).filter((i) => i !== id);
    const data = doc.docs.map((doc) => doc.data());
    setData(ids);

    checkStatus(id, data, setCall, pc);

    const ans = randomSearch(id, data);
    if (ans) {
      updateDialling(id, {
        status: status.offerCall,
        answerId: ans.offerId,
      });
      updateDialling(ans.offerId, {
        status: status.reciveOffer,
        answerId: id,
      });
    }
  });
}

export async function removeDialling(id) {
  firestore
    .collection(diallingCollection)
    .doc(id)
    .delete()
    .then(() => {
      // console.log("Document successfully deleted!");
    })
    .catch((error) => {
      console.error("Error removing document: ", error);
    });
}

export async function answerCall(id, pc) {
  const callId = id;
  const callDoc = firestore.collection(callCollection).doc(callId);
  const answerCandidates = callDoc.collection("answerCandidates");
  const offerCandidates = callDoc.collection("offerCandidates");

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
}

export async function offerCall(pc, id) {
  // Reference Firestore collections for signaling
  const callDoc = firestore.collection(callCollection).doc(id);
  const offerCandidates = callDoc.collection("offerCandidates");
  const answerCandidates = callDoc.collection("answerCandidates");

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await callDoc.set({ offer });

  // Listen for remote answer
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  return callDoc.id;
}

function randomSearch(id, data) {
  if (id && data && data.length > 1) {
    const me = data.find((i) => i.offerId === id);
    const time = me.time;
    const ndata = data.filter(
      (i) => i.time > time && i.offerId !== id && i.status === "waiting"
    );

    const random = Math.floor(Math.random() * ndata.length);
    // console.log(ndata, random);
    return ndata[random];
  }

  return null;
}

function checkStatus(id, data, setCall, pc) {
  if (id && data && data.length > 1) {
    const me = data.find((i) => i.offerId === id);
    let oId = null;
    if (me.answerId !== null) oId = data.find((i) => i.offerId === me.answerId);

    if (me.status === status.reciveOffer) {
      updateDialling(id, { status: status.confirmOffer });
    } else if (me.status === status.offerCall) {
      offerCall(pc, me.offerId);
    }
    if (
      me.status === status.offerCall &&
      oId &&
      oId.status === status.confirmOffer
    ) {
      setCall(me.offerId);
    }
    if (me.status === status.confirmOffer) {
      getOffer(me.answerId).then((offer) => {
        // console.log(offer, me.answerId);
        if (offer) {
          answerCall(me.answerId, pc);
          setCall(me.answerId);
        }
      });
    }
  }
}

function updateDialling(id, data) {
  firestore
    .collection(diallingCollection)
    .doc(id)
    .update(data)
    .then(() => {
      // console.log("Document successfully updated!");
    })
    .catch((error) => {
      // The document probably doesn't exist.
      console.error("Error updating document: ", error);
    });
}

async function getOffer(id) {
  const doc = await firestore.collection(callCollection).doc(id).get();
  if (doc.exists) {
    return doc.data();
  }
  return null;
}

async function getStatus(id) {
  const doc = await firestore.collection(diallingCollection).doc(id).get();
  if (doc.exists) {
    return doc.data();
  }
  return null;
}
