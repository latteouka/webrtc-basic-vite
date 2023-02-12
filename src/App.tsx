import React, { useRef, useEffect, forwardRef } from "react";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

let peerConnection: RTCPeerConnection;

let localStream: MediaStream;
let remoteStream: MediaStream;

const Home = () => {
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);

  const textRef1 = useRef<HTMLTextAreaElement>(null);
  const textRef2 = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const init = async () => {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      videoRef1.current!.srcObject = localStream;
    };

    init();
  }, []);

  const createOffer = async () => {
    // setup peerConnection
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    videoRef2.current!.srcObject = remoteStream;

    localStream.getTracks().forEach((track) => {
      // One or more local MediaStream objects to which the track should be added.
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = async (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    peerConnection.onicecandidate = async (event) => {
      console.log("on ice");
      if (event.candidate) {
        textRef1.current!.value = JSON.stringify(
          peerConnection.localDescription
        );
      }
    };

    // create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    textRef1.current!.value = JSON.stringify(offer);
  };

  const createAnswer = async () => {
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();
    videoRef2.current!.srcObject = remoteStream;

    localStream.getTracks().forEach((track) => {
      // One or more local MediaStream objects to which the track should be added.
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = async (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    peerConnection.onicecandidate = async (event) => {
      console.log("on ice");
      if (event.candidate) {
        textRef2.current!.value = JSON.stringify(
          peerConnection.localDescription
        );
      }
    };

    // create Answer
    const offer = textRef1.current?.value;
    if (!offer) return;

    await peerConnection.setRemoteDescription(JSON.parse(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    textRef2.current!.value = JSON.stringify(answer);
  };

  const addAnswer = () => {
    const answer = textRef2.current!.value;
    if (!answer) return;

    if (!peerConnection.currentRemoteDescription) {
      peerConnection.setRemoteDescription(JSON.parse(answer));
    }
  };
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex">
          <video
            ref={videoRef1}
            autoPlay
            muted
            className="m-1 h-[480px] w-[640px] border-2"
          />
          <video
            ref={videoRef2}
            autoPlay
            muted
            className="m-1 ml-1 h-[480px] w-[640px] border-2"
          />
        </div>
        <div className="flex w-full max-w-[1000px] flex-col">
          <Button onClick={createOffer}>create Offer</Button>
          <Textarea ref={textRef1} />
          <Button onClick={createAnswer}>create Answer</Button>
          <Textarea ref={textRef2} />
          <Button onClick={addAnswer}>Answer</Button>
        </div>
      </main>
    </>
  );
};

export default Home;

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      className="self-start rounded-xl bg-gray-300 px-3 py-2"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const Textarea = forwardRef<HTMLTextAreaElement, any>((_props, ref) => {
  return (
    <textarea rows={10} className="m-2 rounded-md border-2 p-2" ref={ref} />
  );
});
