import { useState } from "react";

function Call() {
  const [state, setState] = useState(0);
  const [btnText, setBtnText] = useState("Call");

  const click = function () {
    state === 0 && (setState(1) || setBtnText("Dialling"));
    state === 1 && (setState(0) || setBtnText("Call"));
    state === 2 && (setState(0) || setBtnText("Call"));
  };

  const answer = function () {
    state === 1 && (setState(2) || setBtnText("End"));
  };

  return { state, click, btnText, answer };
}

export default Call;
