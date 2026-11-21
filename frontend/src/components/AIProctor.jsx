import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Card,
  CardContent,
  Typography,
  Grid,
} from "@mui/material";

import api from "../services/api";

import {
  connectWebSocket,
  disconnectWebSocket,
} from "../services/websocketService";


function AIProctor() {

  const videoRef = useRef(null);

  const processingRef = useRef(false);

  const intervalRef = useRef(null);


  const [aiData, setAIData] = useState({

    face_count: 0,

    eye_status: "Normal",

    head_status: "Straight",

    phone_detected: false,

    suspicious_score: 0,

    latest_event: "None",

  });


  // =====================================
  // START CAMERA
  // =====================================

  const startCamera = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },

          audio: false,
        });


      if (videoRef.current) {

        videoRef.current.srcObject = stream;

        await videoRef.current.play();

      }

    } catch (error) {

      console.error(
        "Camera error:",
        error
      );

    }

  };


  // =====================================
  // STOP CAMERA
  // =====================================

  const stopCamera = () => {

    if (!videoRef.current) return;


    const stream =
      videoRef.current.srcObject;


    if (stream) {

      stream
        .getTracks()
        .forEach(
          (track) => track.stop()
        );

    }


    videoRef.current.srcObject = null;

  };


  // =====================================
  // CAPTURE + SEND ONE FRAME
  // =====================================

  const sendFrameToAI = async () => {

    if (processingRef.current) {
      return;
    }


    const video = videoRef.current;


    if (!video) return;


    if (
      !video.videoWidth ||
      !video.videoHeight ||
      video.readyState < 2
    ) {
      return;
    }


    processingRef.current = true;


    try {

      // ---------------------------------
      // Reduce image size before upload
      // ---------------------------------

      const maxWidth = 480;

      const scale =
        Math.min(
          1,
          maxWidth / video.videoWidth
        );


      const width =
        Math.round(
          video.videoWidth * scale
        );

      const height =
        Math.round(
          video.videoHeight * scale
        );


      const canvas =
        document.createElement(
          "canvas"
        );


      canvas.width = width;
      canvas.height = height;


      const context =
        canvas.getContext("2d");


      context.drawImage(
        video,
        0,
        0,
        width,
        height
      );


      // ---------------------------------
      // Convert frame -> JPEG
      // ---------------------------------

      const blob =
        await new Promise(
          (resolve) => {

            canvas.toBlob(
              resolve,
              "image/jpeg",
              0.65
            );

          }
        );


      if (!blob) {
        return;
      }


      // ---------------------------------
      // Upload frame
      // ---------------------------------

      const formData =
        new FormData();


      formData.append(
        "frame",
        blob,
        "frame.jpg"
      );


      const response =
        await api.post(
          "/proctor/analyze-frame",
          formData
        );


      // ---------------------------------
      // Update monitoring display
      // ---------------------------------

      setAIData(
        (previous) => ({
          ...previous,
          ...response.data,
        })
      );


    } catch (error) {

      console.error(
        "AI frame processing error:",
        error
      );

    } finally {

      processingRef.current = false;

    }

  };


  // =====================================
  // INITIALIZE PROCTOR
  // =====================================

  useEffect(() => {

    let mounted = true;


    const initialize = async () => {

      await startCamera();


      if (!mounted) return;


      // Existing WebSocket updates
      connectWebSocket(
        (message) => {

          setAIData(
            (previous) => ({
              ...previous,
              ...message,
            })
          );

        }
      );


      // Analyze approximately one frame
      // every 2 seconds.
      intervalRef.current =
        setInterval(
          sendFrameToAI,
          5000
        );

    };


    initialize();


    return () => {

      mounted = false;


      if (intervalRef.current) {

        clearInterval(
          intervalRef.current
        );

      }


      stopCamera();

      disconnectWebSocket();

    };

  }, []);


  return (

    <Card sx={{ mb: 3 }}>

      <CardContent>

        <Typography
          variant="h6"
          gutterBottom
        >
          AI Proctor Monitoring
        </Typography>


        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          width="100%"
          style={{
            borderRadius: 10,
            marginBottom: 20,
          }}
        />


        <Grid container spacing={2}>

          <Grid item xs={6}>
            <Typography>
              Faces : {aiData.face_count}
            </Typography>
          </Grid>


          <Grid item xs={6}>
            <Typography>
              Eyes : {aiData.eye_status}
            </Typography>
          </Grid>


          <Grid item xs={6}>
            <Typography>
              Head : {aiData.head_status}
            </Typography>
          </Grid>


          <Grid item xs={6}>
            <Typography>

              Phone :
              {aiData.phone_detected
                ? " Yes"
                : " No"}

            </Typography>
          </Grid>


          <Grid item xs={6}>
            <Typography>

              Score :
              {aiData.suspicious_score}

            </Typography>
          </Grid>


          <Grid item xs={12}>

            <Typography color="error">

              Latest :
              {" "}
              {aiData.latest_event}

            </Typography>

          </Grid>

        </Grid>

      </CardContent>

    </Card>

  );

}


export default AIProctor;