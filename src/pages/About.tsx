import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  IonButton,
  IonRange,
  IonText,
  IonInput,
  IonContent,
} from "@ionic/react";
import "./Home.css";
import { Plugins } from "@capacitor/core";

const Home: React.FC = () => {
  const { Permissions } = Plugins;
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const chunks: Blob[] = [];
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    Permissions.requestPermissions(["microphone"]);
  }, []);

  const handleStartRecording = async () => {
    const { state } = await Permissions.query({ name: "microphone" });
    if (state !== "granted") {
      throw new Error("Microphone permission not granted.");
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        setRecordedBlob(blob);
        chunks.length = 0;
        setDuration(blob.size / recorder.audioBitsPerSecond!);
      };
      recorder.start();
      setIsRecording(true);
      setMediaRecorder(recorder);
    });
  };
  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if (!recordedBlob) {
      console.error("recordedBlob is null");
      return;
    }

    const formData = new FormData();
    formData.append("file", recordedBlob);

    try {
      const response = await axios.post(
        "http://localhost:8000/voice",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setAnswer(response.data.result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", height: "100vh" }}>
      <div style={{ margin: "auto", width: "80%" }}>
        <IonContent>
          <div className="recorder_wrapper">
            <div className="recorder">
              <button className="record_btn" id="button"></button>
              <p id="msg_box"></p>
            </div>
          </div>
          <p>This is the About page</p>
        </IonContent>
        <div style={{ color: "gray" }}>
          <p>{answer}</p>
        </div>
        {recordedBlob ? (
          <div style={{ marginTop: "20px" }}>
            <audio controls src={URL.createObjectURL(recordedBlob)} />
            <IonRange
              min={0}
              max={duration}
              step={0.1}
              value={duration}
              onIonChange={(e) => setDuration(e.detail.value as number)}
            />
          </div>
        ) : null}
        <IonInput
          style={{
            display: "block",
            margin: "auto",
            marginTop: "20px",
            color: "gray",
            borderColor: "black",
            borderWidth: "1px",
            borderStyle: "solid",
          }}
          placeholder="텍스트를 입력하세요"
        />
        <IonButton
          style={{ display: "block", margin: "auto", marginTop: "20px" }}
          disabled={isRecording}
          onClick={handleStartRecording}
        >
          {isRecording ? "녹음 중..." : "시작"}
        </IonButton>
        <IonButton
          style={{ display: "block", margin: "auto", marginTop: "20px" }}
          disabled={!isRecording}
          onClick={handleStopRecording}
        >
          정지
        </IonButton>
        <IonButton
          style={{ display: "block", margin: "auto", marginTop: "20px" }}
          onClick={handleSend}
        >
          보내기
        </IonButton>
      </div>
    </div>
  );
};

export default Home;
