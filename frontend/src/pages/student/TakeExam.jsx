import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import {
  connectWebSocket,
  disconnectWebSocket,
} from "../../services/websocketService";

import {
  getAIStatus,
} from "../../services/aiStatusService";

import {
  getQuestionsByExam,
} from "../../services/questionService";

import {
  getExams,
} from "../../services/examService";

import {
  startExam,
  submitExam as submitExamAPI,
} from "../../services/examAttemptService";

import {
  getProctorStatus,
  logProctorViolation,
} from "../../services/proctorService";

import {
  useNavigate,
} from "react-router-dom";

import AIProctor from "../../components/AIProctor";


function TakeExam() {

  const navigate = useNavigate();


  // ==========================================
  // EXAM SELECTION
  // ==========================================

  const [exams, setExams] =
    useState([]);

  const [
    selectedExam,
    setSelectedExam,
  ] = useState("");

  const [
    examStarted,
    setExamStarted,
  ] = useState(false);

  const [
    startingExam,
    setStartingExam,
  ] = useState(false);


  // ==========================================
  // QUESTIONS
  // ==========================================

  const [
    questions,
    setQuestions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0);

  const [
    answers,
    setAnswers,
  ] = useState({});


  // Keeps latest answers available
  // during automatic submission
  const answersRef =
    useRef({});


  // ==========================================
  // TIMER
  // ==========================================

  const [
    timeLeft,
    setTimeLeft,
  ] = useState(300);


  // ==========================================
  // SUBMISSION
  // ==========================================

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const submittedRef =
    useRef(false);

  const [
    openSnackbar,
    setOpenSnackbar,
  ] = useState(false);

  const [
    attemptId,
    setAttemptId,
  ] = useState(null);

  const attemptIdRef =
    useRef(null);


  // ==========================================
  // AI STATUS
  // ==========================================

  const [
    aiStatus,
    setAIStatus,
  ] = useState({

    face_count: 0,

    eye_status:
      "Normal",

    head_status:
      "Straight",

    phone_detected:
      false,

    suspicious_score:
      0,

    latest_event:
      "None",
  });


  // ==========================================
  // TAB SWITCH / VIOLATIONS
  // ==========================================

  const [
    tabSwitchCount,
    setTabSwitchCount,
  ] = useState(0);


  // Keep latest tab switch count
  const tabSwitchCountRef =
    useRef(0);


  const [
    warningDialog,
    setWarningDialog,
  ] = useState({

    open: false,

    title: "",

    message: "",

    severity:
      "warning",
  });


  // Prevent blur + visibilitychange
  // from counting same tab switch twice
  const lastViolationRef =
    useRef(0);


  // Prevent simultaneous API calls
  const violationRunningRef =
    useRef(false);


  // ==========================================
  // WARNING LEVEL REFERENCES
  // ==========================================

  const warned30Ref =
    useRef(false);

  const warned50Ref =
    useRef(false);

  const warned80Ref =
    useRef(false);


  // Prevent multiple automatic
  // termination requests
  const terminatingRef =
    useRef(false);


  // ==========================================
  // KEEP LATEST ANSWERS UPDATED
  // ==========================================

  useEffect(() => {

    answersRef.current =
      answers;

  }, [answers]);


  // ==========================================
  // SUSPICIOUS SCORE WARNING HANDLER
  // ==========================================

  const handleSuspiciousScoreWarning =
    (score) => {

      const currentScore =
        Number(score || 0);


      // ----------------------------------------
      // 80 POINT CRITICAL WARNING
      // ----------------------------------------

      if (
        currentScore >= 80 &&
        currentScore < 100 &&
        !warned80Ref.current
      ) {

        warned30Ref.current =
          true;

        warned50Ref.current =
          true;

        warned80Ref.current =
          true;


        setWarningDialog({

          open: true,

          title:
            "Critical Suspicious Activity Warning",

          message:
            `Your suspicious activity score has reached ${currentScore} points. The exam will be automatically terminated at 100 points.`,

          severity:
            "error",
        });


        return;
      }


      // ----------------------------------------
      // 50 POINT STRONG WARNING
      // ----------------------------------------

      if (
        currentScore >= 50 &&
        !warned50Ref.current
      ) {

        warned30Ref.current =
          true;

        warned50Ref.current =
          true;


        setWarningDialog({

          open: true,

          title:
            "Strong Suspicious Activity Warning",

          message:
            `Your suspicious activity score has reached ${currentScore} points. Continued suspicious activity may result in automatic exam termination.`,

          severity:
            "warning",
        });


        return;
      }


      // ----------------------------------------
      // 30 POINT FIRST WARNING
      // ----------------------------------------

      if (
        currentScore >= 30 &&
        !warned30Ref.current
      ) {

        warned30Ref.current =
          true;


        setWarningDialog({

          open: true,

          title:
            "Suspicious Activity Warning",

          message:
            `Your suspicious activity score has reached ${currentScore} points. Please follow the examination rules carefully.`,

          severity:
            "warning",
        });
      }
    };


  // ==========================================
  // LOAD AVAILABLE EXAMS
  // ==========================================

  useEffect(() => {

    loadExams();

  }, []);


  const loadExams =
    async () => {

      try {

        const data =
          await getExams();


        setExams(
          data || []
        );


      } catch (error) {

        console.error(
          error
        );


        alert(
          "Failed to load exams."
        );


      } finally {

        setLoading(
          false
        );
      }
    };


  // ==========================================
  // START SELECTED EXAM
  // ==========================================

  const handleStartExam =
    async () => {

      if (!selectedExam) {

        alert(
          "Please select an exam."
        );

        return;
      }


      try {

        setStartingExam(
          true
        );


        // --------------------------------------
        // Load selected exam questions
        // --------------------------------------

        const questionData =
          await getQuestionsByExam(
            selectedExam
          );


        if (
          !questionData ||
          questionData.length === 0
        ) {

          alert(
            "No questions available for this exam."
          );

          return;
        }


        // --------------------------------------
        // Start new attempt
        // --------------------------------------

        const attempt =
          await startExam(
            Number(
              selectedExam
            )
          );


        setAttemptId(
          attempt.id
        );


        attemptIdRef.current =
          attempt.id;


        // --------------------------------------
        // Reset tab switching
        // --------------------------------------

        setTabSwitchCount(
          0
        );

        tabSwitchCountRef.current =
          0;

        lastViolationRef.current =
          0;

        violationRunningRef.current =
          false;


        // --------------------------------------
        // Reset warnings
        // --------------------------------------

        warned30Ref.current =
          false;

        warned50Ref.current =
          false;

        warned80Ref.current =
          false;


        terminatingRef.current =
          false;


        // --------------------------------------
        // Reset questions / answers
        // --------------------------------------

        setQuestions(
          questionData
        );

        setCurrentQuestion(
          0
        );

        setAnswers(
          {}
        );

        answersRef.current =
          {};


        setSubmitted(
          false
        );

        submittedRef.current =
          false;


        // --------------------------------------
        // Selected exam details
        // --------------------------------------

        const exam =
          exams.find(
            (item) =>
              Number(
                item.id
              ) ===
              Number(
                selectedExam
              )
          );


        // --------------------------------------
        // Set timer
        // --------------------------------------

        if (
          exam?.duration
        ) {

          setTimeLeft(
            Number(
              exam.duration
            ) * 60
          );

        } else {

          setTimeLeft(
            300
          );
        }


        setExamStarted(
          true
        );


      } catch (error) {

        console.error(
          error
        );


        alert(
          error.response
            ?.data
            ?.detail ||
          "Failed to start exam."
        );


      } finally {

        setStartingExam(
          false
        );
      }
    };


  // ==========================================
  // SUBMIT EXAM
  // ==========================================

  const submitExam =
    async () => {

      const activeAttemptId =
        attemptIdRef.current ||
        attemptId;


      if (
        submittedRef.current ||
        !activeAttemptId
      ) {

        return;
      }


      try {

        // Prevent duplicate submissions
        submittedRef.current =
          true;


        const currentAnswers =
          answersRef.current;


        const formattedAnswers =
          Object.entries(
            currentAnswers
          ).map(

            ([
              questionId,
              selectedAnswer,
            ]) => ({

              question_id:
                Number(
                  questionId
                ),

              selected_answer:
                selectedAnswer,
            })
          );


        await submitExamAPI(
          activeAttemptId,
          formattedAnswers
        );


        setSubmitted(
          true
        );


        setOpenSnackbar(
          true
        );


        setTimeout(
          () => {

            navigate(
              `/student/result/${activeAttemptId}`
            );

          },
          1500
        );


      } catch (error) {

        submittedRef.current =
          false;

        terminatingRef.current =
          false;


        console.error(
          error
        );


        alert(
          "Failed to submit exam."
        );
      }
    };


  // ==========================================
  // AUTOMATIC TERMINATION
  // ==========================================

  const terminateExam =
    (message) => {

      if (
        terminatingRef.current ||
        submittedRef.current
      ) {

        return;
      }


      terminatingRef.current =
        true;


      setWarningDialog({

        open: true,

        title:
          "Exam Terminated",

        message:
          message,

        severity:
          "error",
      });


      setTimeout(
        () => {

          submitExam();

        },
        2000
      );
    };


  // ==========================================
  // EXAM TIMER
  // ==========================================

  useEffect(() => {

    if (
      !examStarted ||
      submitted
    ) {

      return;
    }


    if (
      timeLeft <= 0
    ) {

      submitExam();

      return;
    }


    const timer =
      setInterval(
        () => {

          setTimeLeft(
            (previous) =>
              previous - 1
          );

        },
        1000
      );


    return () =>
      clearInterval(
        timer
      );


  }, [
    timeLeft,
    submitted,
    examStarted,
  ]);


  // ==========================================
  // AI STATUS + WEBSOCKET
  // ==========================================

  useEffect(() => {

    if (
      !examStarted
    ) {

      return;
    }


    loadAIStatus();


    connectWebSocket(
      (message) => {

        if (!message) {

          return;
        }


        setAIStatus(
          (previous) => ({

            ...previous,

            ...message,
          })
        );


        if (
          message
            .suspicious_score !==
          undefined
        ) {

          const score =
            Number(
              message
                .suspicious_score ||
              0
            );


          // --------------------------------------
          // Overall score 100 = termination
          // --------------------------------------

          if (
            score >= 100
          ) {

            terminateExam(
              "Your suspicious activity score has reached 100 points. The maximum allowed suspicious score has been reached. Your exam will now be submitted automatically."
            );

            return;
          }


          // --------------------------------------
          // 30 / 50 / 80 warnings
          // --------------------------------------

          handleSuspiciousScoreWarning(
            score
          );
        }
      }
    );


    return () => {

      disconnectWebSocket();
    };


  }, [examStarted]);


  // ==========================================
  // TAB / WINDOW SWITCH DETECTION
  // ==========================================

  useEffect(() => {

    if (
      !examStarted ||
      !attemptId ||
      submitted
    ) {

      return;
    }


    const recordViolation =
      async () => {

        const now =
          Date.now();


        // --------------------------------------
        // Prevent duplicate blur /
        // visibilitychange event
        // --------------------------------------

        if (
          now -
            lastViolationRef.current <
          2500
        ) {

          return;
        }


        if (
          violationRunningRef.current
        ) {

          return;
        }


        if (
          submittedRef.current ||
          terminatingRef.current
        ) {

          return;
        }


        lastViolationRef.current =
          now;


        violationRunningRef.current =
          true;


        try {

          // --------------------------------------
          // Record violation in backend
          // --------------------------------------

          const data =
            await logProctorViolation(
              attemptId,
              "tab_switch"
            );


          // --------------------------------------
          // Get tab switch count
          // --------------------------------------

          let currentTabCount;


          if (
            data.tab_switch_count !==
            undefined &&
            data.tab_switch_count !==
            null
          ) {

            currentTabCount =
              Number(
                data.tab_switch_count
              );

          } else {

            currentTabCount =
              tabSwitchCountRef.current +
              1;
          }


          tabSwitchCountRef.current =
            currentTabCount;


          setTabSwitchCount(
            currentTabCount
          );


          // --------------------------------------
          // Update AI monitoring display
          // --------------------------------------

          setAIStatus(
            (previous) => ({

              ...previous,

              suspicious_score:
                Number(
                  data.suspicious_score ||
                  0
                ),

              latest_event:
                data.event ||
                "Tab Switching Detected",
            })
          );


          const currentScore =
            Number(
              data.suspicious_score ||
              0
            );


          const tabPoints =
            Number(
              data.tab_switch_points ||
              (
                currentTabCount *
                5
              )
            );


          // ======================================
          // 3 TAB SWITCHES = TERMINATE
          // ======================================

          if (
            currentTabCount >= 3 ||
            tabPoints >= 15
          ) {

            terminateExam(
              "You switched away from the examination 3 times. The maximum tab-switch limit has been reached. Your exam will now be submitted automatically."
            );

            return;
          }


          // ======================================
          // BACKEND TERMINATION RESPONSE
          // ======================================

          if (
            data.terminate_exam
          ) {

            terminateExam(
              "The maximum suspicious activity limit has been reached. Your exam will now be submitted automatically."
            );

            return;
          }


          // ======================================
          // OVERALL SCORE = 100
          // ======================================

          if (
            currentScore >= 100
          ) {

            terminateExam(
              "Your suspicious activity score has reached 100 points. Your exam will now be submitted automatically."
            );

            return;
          }


          // ======================================
          // GENERAL SCORE WARNINGS
          // ======================================

          if (
            currentScore >= 30
          ) {

            const shouldShowWarning =
              (
                currentScore >= 80 &&
                !warned80Ref.current
              ) ||
              (
                currentScore >= 50 &&
                !warned50Ref.current
              ) ||
              (
                currentScore >= 30 &&
                !warned30Ref.current
              );


            if (
              shouldShowWarning
            ) {

              handleSuspiciousScoreWarning(
                currentScore
              );

              return;
            }
          }


          // ======================================
          // NORMAL TAB SWITCH WARNING
          // ======================================

          setWarningDialog({

            open: true,

            title:
              "Tab Switching Detected",

            message:
              `Tab switching is not allowed during the examination. 5 suspicious points have been added. Violation ${currentTabCount} of 3.`,

            severity:
              "warning",
          });


        } catch (error) {

          console.error(
            "Failed to record tab switch:",
            error
          );


        } finally {

          violationRunningRef.current =
            false;
        }
      };


    // ========================================
    // TAB BECOMES HIDDEN
    // ========================================

    const handleVisibilityChange =
      () => {

        if (
          document.hidden
        ) {

          recordViolation();
        }
      };


    // ========================================
    // WINDOW LOSES FOCUS
    // ========================================

    const handleWindowBlur =
      () => {

        setTimeout(
          () => {

            if (
              document.hidden ||
              !document.hasFocus()
            ) {

              recordViolation();
            }

          },
          200
        );
      };


    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );


    window.addEventListener(
      "blur",
      handleWindowBlur
    );


    return () => {

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );


      window.removeEventListener(
        "blur",
        handleWindowBlur
      );
    };


  }, [
    examStarted,
    attemptId,
    submitted,
  ]);


  // ==========================================
  // PROCTOR STATUS CHECK
  // ==========================================

  useEffect(() => {

    if (
      !examStarted ||
      !attemptId ||
      submitted
    ) {

      return;
    }


    const interval =
      setInterval(
        async () => {

          try {

            const data =
              await getProctorStatus();


            if (
              data
                .suspicious_score !==
              undefined
            ) {

              const score =
                Number(
                  data
                    .suspicious_score ||
                  0
                );


              setAIStatus(
                (previous) => ({

                  ...previous,

                  suspicious_score:
                    score,
                })
              );


              // ----------------------------------
              // Overall score termination
              // ----------------------------------

              if (
                (
                  data.terminate_exam ||
                  score >= 100
                ) &&
                !submittedRef.current
              ) {

                terminateExam(
                  "Your suspicious activity score has reached the maximum allowed limit. Your exam will now be submitted automatically."
                );

                return;
              }


              // ----------------------------------
              // 30 / 50 / 80 warnings
              // ----------------------------------

              handleSuspiciousScoreWarning(
                score
              );
            }


          } catch (error) {

            console.error(
              "Failed to load proctor status:",
              error
            );
          }

        },
        3000
      );


    return () =>
      clearInterval(
        interval
      );


  }, [
    submitted,
    attemptId,
    examStarted,
  ]);


  // ==========================================
  // LOAD INITIAL AI STATUS
  // ==========================================

  const loadAIStatus =
    async () => {

      try {

        const data =
          await getAIStatus();


        if (!data) {

          return;
        }


        setAIStatus(
          (previous) => ({

            ...previous,

            ...data,
          })
        );


        if (
          data.suspicious_score !==
          undefined
        ) {

          const score =
            Number(
              data.suspicious_score ||
              0
            );


          if (
            score >= 100
          ) {

            terminateExam(
              "Your suspicious activity score has reached 100 points. Your exam will now be submitted automatically."
            );

            return;
          }


          handleSuspiciousScoreWarning(
            score
          );
        }


      } catch (error) {

        console.error(
          error
        );
      }
    };


  // ==========================================
  // TIMER FORMAT
  // ==========================================

  const formatTime =
    (seconds) => {

      const mins =
        Math.floor(
          seconds / 60
        );


      const secs =
        seconds % 60;


      return `${mins}:${secs
        .toString()
        .padStart(
          2,
          "0"
        )}`;
    };


  // ==========================================
  // ANSWER CHANGE
  // ==========================================

  const handleAnswerChange =
    (event) => {

      if (
        submittedRef.current
      ) {

        return;
      }


      const questionId =
        questions[
          currentQuestion
        ].id;


      setAnswers(
        (previous) => {

          const updatedAnswers = {

            ...previous,

            [questionId]:
              event.target.value,
          };


          answersRef.current =
            updatedAnswers;


          return updatedAnswers;
        }
      );
    };


  // ==========================================
  // LOADING PAGE
  // ==========================================

  if (loading) {

    return (

      <Container
        sx={{

          mt: 5,

          textAlign:
            "center",
        }}
      >

        <CircularProgress />

      </Container>
    );
  }


  // ==========================================
  // EXAM SELECTION PAGE
  // ==========================================

  if (
    !examStarted
  ) {

    return (

      <Container
        maxWidth="sm"
        sx={{

          mt: 6,

          mb: 6,
        }}
      >

        <Paper
          elevation={3}
          sx={{

            p: 4,
          }}
        >


          <Typography
            variant="h4"
            gutterBottom
          >
            Select Exam
          </Typography>


          <Typography
            color="text.secondary"
            sx={{

              mb: 3,
            }}
          >
            Choose the examination
            you want to take.
          </Typography>


          {exams.length === 0 ? (

            <Typography>
              No exams available.
            </Typography>

          ) : (

            <>


              <TextField
                select
                fullWidth
                label="Select Exam"
                value={
                  selectedExam
                }
                onChange={
                  (event) =>
                    setSelectedExam(
                      event.target.value
                    )
                }
              >

                {exams.map(
                  (exam) => (

                    <MenuItem
                      key={
                        exam.id
                      }
                      value={
                        exam.id
                      }
                    >

                      {exam.title}

                      {" - "}

                      {exam.subject}

                    </MenuItem>

                  )
                )}

              </TextField>


              {selectedExam && (

                <Box
                  sx={{

                    mt: 3,

                    p: 2,

                    bgcolor:
                      "#f5f5f5",

                    borderRadius:
                      2,
                  }}
                >

                  {(() => {

                    const exam =
                      exams.find(

                        (item) =>
                          Number(
                            item.id
                          ) ===
                          Number(
                            selectedExam
                          )
                      );


                    if (!exam) {

                      return null;
                    }


                    return (

                      <>

                        <Typography
                          variant="h6"
                        >
                          {exam.title}
                        </Typography>


                        <Typography>
                          Subject:{" "}
                          {exam.subject}
                        </Typography>


                        <Typography>
                          Duration:{" "}
                          {exam.duration}{" "}
                          minutes
                        </Typography>


                        <Typography>
                          Total Marks:{" "}
                          {
                            exam.total_marks
                          }
                        </Typography>


                        {exam.description && (

                          <Typography
                            sx={{
                              mt: 1,
                            }}
                            color="text.secondary"
                          >
                            {
                              exam.description
                            }
                          </Typography>

                        )}

                      </>
                    );

                  })()}

                </Box>

              )}


              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 3,
                }}
                disabled={
                  !selectedExam ||
                  startingExam
                }
                onClick={
                  handleStartExam
                }
              >

                {
                  startingExam
                    ? "Starting Exam..."
                    : "Start Selected Exam"
                }

              </Button>


              <Button
                fullWidth
                variant="outlined"
                sx={{
                  mt: 2,
                }}
                onClick={
                  () =>
                    navigate(
                      "/student/dashboard"
                    )
                }
              >
                Back to Dashboard
              </Button>

            </>

          )}

        </Paper>

      </Container>
    );
  }


  // ==========================================
  // NO QUESTIONS
  // ==========================================

  if (
    questions.length ===
    0
  ) {

    return (

      <Container
        sx={{
          mt: 5,
        }}
      >

        <Typography
          variant="h6"
        >
          No questions available.
        </Typography>

      </Container>
    );
  }


  // ==========================================
  // CURRENT QUESTION
  // ==========================================

  const question =
    questions[
      currentQuestion
    ];


  // ==========================================
  // CURRENT EXAM
  // ==========================================

  const currentExam =
    exams.find(

      (exam) =>
        Number(
          exam.id
        ) ===
        Number(
          selectedExam
        )
    );


  // ==========================================
  // EXAM PAGE
  // ==========================================

  return (

    <>


      <Container
        maxWidth="md"
        sx={{

          mt: 5,

          mb: 5,
        }}
      >

        <Paper
          elevation={3}
          sx={{

            p: 4,
          }}
        >


          {/* =================================
              HEADER
          ================================= */}


          <Box
            sx={{

              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              mb: 1,

              gap: 2,

              flexWrap:
                "wrap",
            }}
          >

            <Box>

              <Typography
                variant="h5"
              >

                {
                  currentExam
                    ?.title ||
                  "Online Examination"
                }

              </Typography>


              <Typography
                color="text.secondary"
              >

                {
                  currentExam
                    ?.subject
                }

              </Typography>

            </Box>


            <Typography
              variant="h6"
              color={
                timeLeft <= 60
                  ? "error"
                  : "primary"
              }
              fontWeight="bold"
            >

              Time Left:{" "}

              {
                formatTime(
                  timeLeft
                )
              }

            </Typography>

          </Box>


          {/* =================================
              AI CAMERA
          ================================= */}


          <Box
            sx={{
              mb: 3,
            }}
          >

            <AIProctor />

          </Box>


          {/* =================================
              LIVE AI MONITORING
          ================================= */}


          <Box
            sx={{

              mt: 2,

              mb: 3,

              p: 2,

              bgcolor:
                "#f5f5f5",

              borderRadius:
                2,
            }}
          >

            <Typography
              variant="h6"
              sx={{
                mb: 1,
              }}
            >
              Live AI Monitoring
            </Typography>


            <Typography>

              Faces:{" "}

              {
                aiStatus
                  .face_count ??
                0
              }

            </Typography>


            <Typography>

              Eyes:{" "}

              {
                aiStatus
                  .eye_status ||
                "No Data"
              }

            </Typography>


            <Typography>

              Head:{" "}

              {
                aiStatus
                  .head_status ||
                "No Data"
              }

            </Typography>


            <Typography>

              Phone:{" "}

              {
                aiStatus
                  .phone_detected
                  ? "Yes"
                  : "No"
              }

            </Typography>


            <Typography
              color="error"
              fontWeight="bold"
            >

              Suspicious Score:{" "}

              {
                aiStatus
                  .suspicious_score ??
                0
              }

            </Typography>


            <Typography>

              Latest Event:{" "}

              {
                aiStatus
                  .latest_event ||
                "None"
              }

            </Typography>


            <Typography
              color={
                tabSwitchCount > 0
                  ? "error"
                  : "text.secondary"
              }
              fontWeight={
                tabSwitchCount > 0
                  ? "bold"
                  : "normal"
              }
            >

              Tab Switch Violations:{" "}

              {
                tabSwitchCount
              }

              {" / 3"}

            </Typography>

          </Box>


          {/* =================================
              QUESTION NUMBER
          ================================= */}


          <Typography
            variant="h6"
            color="primary"
            gutterBottom
          >

            Question{" "}

            {
              currentQuestion +
              1
            }

            {" of "}

            {
              questions.length
            }

          </Typography>


          {/* =================================
              QUESTION
          ================================= */}


          <Typography
            variant="h5"
            sx={{
              mb: 3,
            }}
          >

            {
              question.question
            }

          </Typography>


          {/* =================================
              OPTIONS
          ================================= */}


          <FormControl
            fullWidth
          >

            <RadioGroup

              value={
                answers[
                  question.id
                ] || ""
              }

              onChange={
                handleAnswerChange
              }
            >


              <FormControlLabel
                value="A"
                control={

                  <Radio
                    disabled={
                      submitted
                    }
                  />

                }
                label={
                  `A. ${question.option_a}`
                }
              />


              <FormControlLabel
                value="B"
                control={

                  <Radio
                    disabled={
                      submitted
                    }
                  />

                }
                label={
                  `B. ${question.option_b}`
                }
              />


              <FormControlLabel
                value="C"
                control={

                  <Radio
                    disabled={
                      submitted
                    }
                  />

                }
                label={
                  `C. ${question.option_c}`
                }
              />


              <FormControlLabel
                value="D"
                control={

                  <Radio
                    disabled={
                      submitted
                    }
                  />

                }
                label={
                  `D. ${question.option_d}`
                }
              />


            </RadioGroup>

          </FormControl>


          {/* =================================
              PREVIOUS / NEXT
          ================================= */}


          <Box
            sx={{

              display:
                "flex",

              justifyContent:
                "space-between",

              mt: 4,

              gap: 2,
            }}
          >


            <Button
              variant="contained"
              disabled={
                submitted ||
                currentQuestion ===
                  0
              }
              onClick={
                () =>
                  setCurrentQuestion(
                    (previous) =>
                      previous -
                      1
                  )
              }
            >
              Previous
            </Button>


            <Button
              variant="contained"
              disabled={
                submitted ||
                currentQuestion ===
                  questions.length -
                    1
              }
              onClick={
                () =>
                  setCurrentQuestion(
                    (previous) =>
                      previous +
                      1
                  )
              }
            >
              Next
            </Button>


          </Box>


          {/* =================================
              ANSWERED COUNT
          ================================= */}


          <Box
            sx={{
              mt: 3,
            }}
          >

            <Typography
              variant="subtitle1"
              color="primary"
              fontWeight="bold"
            >

              Answered:{" "}

              {
                Object.keys(
                  answers
                ).length
              }

              {" / "}

              {
                questions.length
              }

            </Typography>

          </Box>


          {/* =================================
              SUBMIT
          ================================= */}


          <Box
            sx={{

              mt: 4,

              textAlign:
                "center",
            }}
          >

            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={
                submitExam
              }
              disabled={
                submitted
              }
            >

              {
                submitted
                  ? "Exam Submitted"
                  : "Submit Exam"
              }

            </Button>

          </Box>


        </Paper>

      </Container>


      {/* =====================================
          SUCCESS MESSAGE
      ===================================== */}


      <Snackbar
        open={
          openSnackbar
        }
        autoHideDuration={
          4000
        }
        onClose={
          () =>
            setOpenSnackbar(
              false
            )
        }
        anchorOrigin={{

          vertical:
            "top",

          horizontal:
            "right",
        }}
      >

        <Alert
          onClose={
            () =>
              setOpenSnackbar(
                false
              )
          }
          severity="success"
          variant="filled"
          sx={{
            width:
              "100%",
          }}
        >

          Exam submitted successfully!

        </Alert>

      </Snackbar>


      {/* =====================================
          WARNING / TERMINATION DIALOG
      ===================================== */}


      <Dialog
        open={
          warningDialog.open
        }
        onClose={
          () => {

            // Student cannot close
            // termination dialog
            if (
              terminatingRef.current
            ) {

              return;
            }


            setWarningDialog(
              (previous) => ({

                ...previous,

                open:
                  false,
              })
            );
          }
        }
        disableEscapeKeyDown={
          terminatingRef.current
        }
      >


        <DialogTitle
          color={
            warningDialog
              .severity ===
            "error"
              ? "error"
              : "warning.main"
          }
        >

          {
            warningDialog.title
          }

        </DialogTitle>


        <DialogContent>


          <Typography>

            {
              warningDialog
                .message
            }

          </Typography>


          <Typography
            sx={{

              mt: 2,

              fontWeight:
                "bold",
            }}
          >

            Tab Switch Violations:{" "}

            {
              tabSwitchCount
            }

            {" / 3"}

          </Typography>


          <Typography
            color="error"
            sx={{

              mt: 1,

              fontWeight:
                "bold",
            }}
          >

            Suspicious Score:{" "}

            {
              aiStatus
                .suspicious_score ??
              0
            }

          </Typography>


        </DialogContent>


        <DialogActions>


          {
            !terminatingRef
              .current &&
            (

              <Button
                variant="contained"
                onClick={
                  () =>
                    setWarningDialog(
                      (previous) => ({

                        ...previous,

                        open:
                          false,
                      })
                    )
                }
              >

                Continue Exam

              </Button>

            )
          }


          {
            terminatingRef
              .current &&
            (

              <Typography
                color="error"
                sx={{

                  mr: 2,

                  mb: 1,

                  fontWeight:
                    "bold",
                }}
              >

                Submitting exam...

              </Typography>

            )
          }

        </DialogActions>


      </Dialog>


    </>
  );
}


export default TakeExam;