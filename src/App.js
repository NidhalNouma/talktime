import Audio from "./component/Audio";
import Call from "./hooks/Call";

function App() {
  const { state, click, btnText, answer } = Call();

  return (
    <div className="App">
      <div className="logo">
        <h4>TalkTime</h4>
      </div>
      <div>
        <h5>Find someone to talk to.</h5>
      </div>
      <div className="audio-animation">
        <Audio type={state} answer={answer} />
      </div>
      <div className="button">
        <button onClick={click} className={btnText}>
          {btnText}
        </button>
      </div>
      <div className="footer">
        <a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms</a>
      </div>
    </div>
  );
}

export default App;
