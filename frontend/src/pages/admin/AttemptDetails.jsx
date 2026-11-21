import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    Box,
    Button,
    CircularProgress,
  } from "@mui/material";
  
  import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
  } from "recharts";
  
  import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
  } from "@mui/lab";
  
  import SkipPreviousIcon
    from "@mui/icons-material/SkipPrevious";
  
  import SkipNextIcon
    from "@mui/icons-material/SkipNext";
  
  import PlayArrowIcon
    from "@mui/icons-material/PlayArrow";
  
  import PauseIcon
    from "@mui/icons-material/Pause";
  
  import ArrowBackIcon
    from "@mui/icons-material/ArrowBack";
  
  import {
    getAttemptDetails,
  } from "../../services/attemptDetailsService";
  
  
  function AttemptDetails() {
  
    const { id } = useParams();
  
    const navigate = useNavigate();
  
  
    // ==========================================
    // STATE
    // ==========================================
  
    const [details, setDetails] =
      useState(null);
  
    const [currentIndex, setCurrentIndex] =
      useState(0);
  
    const [playing, setPlaying] =
      useState(false);
  
  
    const COLORS = [
      "#1976d2",
      "#d32f2f",
      "#f57c00",
      "#2e7d32",
      "#7b1fa2",
    ];

    // ==========================================
    // ATTEMPT RISK LEVEL
    // ==========================================

    const getAttemptRisk = (points) => {

      const score =
        Number(points || 0);

      if (score >= 100) {
        return "Critical";
      }

      if (score >= 80) {
        return "High";
      }

      if (score >= 50) {
        return "Medium";
      }

      if (score >= 30) {
        return "Warning";
      }

      return "Low";
    };


    // ==========================================
    // RISK CHIP COLOR
    // ==========================================

    const getRiskColor = (risk) => {

      if (risk === "Critical") {
        return "error";
      }

      if (risk === "High") {
        return "error";
      }

      if (risk === "Medium") {
        return "warning";
      }

      if (risk === "Warning") {
        return "warning";
      }

      return "success";
    };


    // ==========================================
    // INDIVIDUAL EVENT WEIGHT
    // ==========================================

    const getEventWeight = (points) => {

      const value =
        Number(points || 0);

      if (value >= 10) {
        return "Major";
      }

      if (value >= 5) {
        return "Moderate";
      }

      return "Minor";
    };


    // ==========================================
    // EVENT COLOR
    // ==========================================

    const getEventColor = (points) => {

      const value =
        Number(points || 0);

      if (value >= 10) {
        return "error";
      }

      if (value >= 5) {
        return "warning";
      }

      return "success";
    };
  
  
    // ==========================================
    // LOAD ATTEMPT DETAILS
    // ==========================================
  
    const load = async () => {
  
      try {
  
        const data =
          await getAttemptDetails(id);
  
        setDetails(data);
  
      } catch (error) {
  
        console.error(
          "Failed to load attempt details:",
          error
        );
  
      }
  
    };
  
  
    useEffect(() => {
  
      load();
  
    }, [id]);
  
  
    // ==========================================
    // EXAM REPLAY
    // ==========================================
  
    useEffect(() => {
  
      if (!playing) {
        return;
      }
  
      if (!details?.events?.length) {
        return;
      }
  
  
      const timer = setInterval(() => {
  
        setCurrentIndex((previous) => {
  
          if (
            previous >=
            details.events.length - 1
          ) {
  
            setPlaying(false);
  
            return previous;
  
          }
  
  
          return previous + 1;
  
        });
  
      }, 2000);
  
  
      return () =>
        clearInterval(timer);
  
    }, [playing, details]);
  
  
    // ==========================================
    // GROUP SAME AI EVENTS
    // ==========================================
  
    const eventSummary = useMemo(() => {
  
      const grouped = {};
  
  
      (details?.events || []).forEach(
        (event) => {
  
          const eventName =
            event.event ||
            "Unknown Event";
  
  
          if (!grouped[eventName]) {
  
            grouped[eventName] = {
  
              name: eventName,
  
              count: 0,
  
              points: 0,
  
            };
  
          }
  
  
          grouped[eventName].count += 1;
  
          grouped[eventName].points +=
            Number(
              event.points || 0
            );
  
        }
      );
  
  
      return Object.values(grouped);
  
    }, [details]);
  
    // ==========================================
    // CALCULATE ATTEMPT SUMMARY
    // ==========================================

    const derivedSummary =
    useMemo(() => {

      const events =
        details?.events || [];


      const totalPoints =
        events.reduce(
          (sum, event) =>
            sum +
            Number(
              event.points || 0
            ),
          0
        );


      const averagePoints =
        events.length > 0
          ? Number(
              (
                totalPoints /
                events.length
              ).toFixed(2)
            )
          : 0;


      const mostCommonEvent =
        eventSummary.length > 0
          ? [...eventSummary]
              .sort(
                (a, b) =>
                  b.count -
                  a.count
              )[0]?.name
          : "No Events";


      return {

        totalEvents:
          events.length,

        totalPoints,

        riskLevel:
          getAttemptRisk(
            totalPoints
          ),

        averagePoints,

        mostCommonEvent:
          mostCommonEvent ||
          "No Events",
      };

    }, [
      details,
      eventSummary,
    ]);
  
  
    // ==========================================
    // CURRENT REPLAY EVENT
    // ==========================================
  
    const currentEvent =
      details?.events?.[
        currentIndex
      ];
  
  
    // ==========================================
    // LOADING
    // ==========================================
  
    if (!details) {
  
      return (
  
        <Container
          sx={{
            mt: 6,
            textAlign: "center",
          }}
        >
  
          <CircularProgress />
  
          <Typography
            sx={{ mt: 2 }}
          >
            Loading attempt details...
          </Typography>
  
        </Container>
  
      );
  
    }
  
  
    // ==========================================
    // UI
    // ==========================================
  
    return (
  
      <Container
        maxWidth="xl"
        sx={{
          mt: 4,
          mb: 6,
        }}
      >
  
        {/* =====================================
            HEADER
        ====================================== */}
  
        <Box
          sx={{
            display: "flex",
  
            justifyContent:
              "space-between",
  
            alignItems: "center",
  
            flexWrap: "wrap",
  
            gap: 2,
  
            mb: 4,
          }}
        >
  
          <Typography
            variant="h4"
            fontWeight="bold"
          >
            Attempt Details
          </Typography>
  
  
          <Button
            variant="outlined"
            startIcon={
              <ArrowBackIcon />
            }
            onClick={() =>
              navigate(
                "/admin/advanced-analytics"
              )
            }
          >
            Back to Analytics
          </Button>
  
        </Box>
  
  
        {/* =====================================
            MAIN SUMMARY
        ====================================== */}
  
        <Grid
          container
          spacing={3}
          sx={{ mb: 4 }}
        >
  
          {/* Student */}
  
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
  
            <Card
              elevation={4}
              sx={{
                height: "100%",
              }}
            >
  
              <CardContent>
  
                <Typography
                  color="text.secondary"
                >
                  Student
                </Typography>
  
  
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mt: 1 }}
                >
                  {details.student_name}
                </Typography>
  
              </CardContent>
  
            </Card>
  
          </Grid>
  
  
          {/* Exam */}
  
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
  
            <Card
              elevation={4}
              sx={{
                height: "100%",
              }}
            >
  
              <CardContent>
  
                <Typography
                  color="text.secondary"
                >
                  Exam
                </Typography>
  
  
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mt: 1 }}
                >
                  {details.exam_title}
                </Typography>
  
              </CardContent>
  
            </Card>
  
          </Grid>
  
  
          {/* Score */}
  
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
  
            <Card
              elevation={4}
              sx={{
                height: "100%",
              }}
            >
  
              <CardContent>
  
                <Typography
                  color="text.secondary"
                >
                  Score
                </Typography>
  
  
                <Typography
                  variant="h3"
                  color="primary"
                  fontWeight="bold"
                  sx={{ mt: 1 }}
                >
                  {details.score}
                </Typography>
  
              </CardContent>
  
            </Card>
  
          </Grid>
  
  
          {/* AI Events */}
  
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
  
            <Card
              elevation={4}
              sx={{
                height: "100%",
              }}
            >
  
              <CardContent>
  
                <Typography
                  color="text.secondary"
                >
                  Total AI Events
                </Typography>
  
  
                <Typography
                  variant="h3"
                  color="error"
                  fontWeight="bold"
                  sx={{ mt: 1 }}
                >
                  {details.total_events}
                </Typography>
  
              </CardContent>
  
            </Card>
  
          </Grid>
  
  
          {/* Suspicious Points */}
  
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
  
            <Card
              elevation={4}
              sx={{
                height: "100%",
              }}
            >
  
              <CardContent>
  
                <Typography
                  color="text.secondary"
                >
                  Suspicious Points
                </Typography>
  
  
                <Typography
                  variant="h3"
                  color="warning.main"
                  fontWeight="bold"
                  sx={{ mt: 1 }}
                >
                  {details.total_points}
                </Typography>
  
              </CardContent>
  
            </Card>
  
          </Grid>
  
  
          {/* Risk */}
  
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 2,
            }}
          >
  
            <Card
              elevation={4}
              sx={{
                height: "100%",
              }}
            >
  
              <CardContent>
  
                <Typography
                  color="text.secondary"
                >
                  Risk Level
                </Typography>
  
  
                <Box sx={{ mt: 2 }}>
  
                <Chip
                  label={
                    derivedSummary
                      .riskLevel
                  }
                  color={
                    getRiskColor(
                      derivedSummary
                        .riskLevel
                    )
                  }
                />
  
                </Box>
  
              </CardContent>
  
            </Card>
  
          </Grid>
  
        </Grid>
  
  
        {/* =====================================
                ATTEMPT AI SUMMARY CARDS
            ===================================== */}

            <Box
              sx={{

                display: "grid",

                gridTemplateColumns: {

                  xs: "1fr",

                  sm: "repeat(2, 1fr)",

                  md: "repeat(5, 1fr)",
                },

                gap: 3,

                mb: 4,
              }}
            >


              {/* TOTAL EVENTS */}

              <Card
                elevation={3}
                sx={{
                  height: "100%",
                }}
              >

                <CardContent>

                  <Typography
                    color="text.secondary"
                  >
                    Total AI Events
                  </Typography>


                  <Typography
                    variant="h3"
                    color="primary"
                    fontWeight="bold"
                    sx={{
                      mt: 1,
                    }}
                  >
                    {
                      derivedSummary
                        .totalEvents
                    }
                  </Typography>

                </CardContent>

              </Card>


              {/* TOTAL POINTS */}

              <Card
                elevation={3}
                sx={{
                  height: "100%",
                }}
              >

                <CardContent>

                  <Typography
                    color="text.secondary"
                  >
                    Total Suspicious Points
                  </Typography>


                  <Typography
                    variant="h3"
                    color="error"
                    fontWeight="bold"
                    sx={{
                      mt: 1,
                    }}
                  >
                    {
                      derivedSummary
                        .totalPoints
                    }
                  </Typography>

                </CardContent>

              </Card>


              {/* OVERALL RISK */}

              <Card
                elevation={3}
                sx={{
                  height: "100%",
                }}
              >

                <CardContent>

                  <Typography
                    color="text.secondary"
                  >
                    Overall Risk
                  </Typography>


                  <Box
                    sx={{
                      mt: 2,
                    }}
                  >

                    <Chip
                      label={
                        derivedSummary
                          .riskLevel
                      }
                      color={
                        getRiskColor(
                          derivedSummary
                            .riskLevel
                        )
                      }
                    />

                  </Box>

                </CardContent>

              </Card>


              {/* AVERAGE EVENT POINTS */}

              <Card
                elevation={3}
                sx={{
                  height: "100%",
                }}
              >

                <CardContent>

                  <Typography
                    color="text.secondary"
                  >
                    Average Event Points
                  </Typography>


                  <Typography
                    variant="h3"
                    color="primary"
                    fontWeight="bold"
                    sx={{
                      mt: 1,
                    }}
                  >
                    {
                      derivedSummary
                        .averagePoints
                    }
                  </Typography>

                </CardContent>

              </Card>


              {/* MOST COMMON EVENT */}

              <Card
                elevation={3}
                sx={{
                  height: "100%",
                }}
              >

                <CardContent>

                  <Typography
                    color="text.secondary"
                  >
                    Most Common Event
                  </Typography>


                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      mt: 2,
                    }}
                  >
                    {
                      derivedSummary
                        .mostCommonEvent
                    }
                  </Typography>

                </CardContent>

              </Card>


            </Box>
  
  
        {/* =====================================
            CHARTS
        ====================================== */}
  
        <Grid
          container
          spacing={3}
          sx={{ mb: 4 }}
        >
  
          {/* AI EVENT DISTRIBUTION */}
  
          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
  
            <Card
              elevation={3}
              sx={{
                height: "100%",
              }}
            >
  
              <CardContent>
  
                <Typography
                  variant="h5"
                  sx={{ mb: 2 }}
                >
                  AI Event Distribution
                </Typography>
  
  
                {eventSummary.length >
                0 ? (
  
                  <Box
                    sx={{
                      height: 350,
                    }}
                  >
  
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
  
                      <PieChart>
  
                        <Pie
                          data={
                            eventSummary
                          }
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={100}
                          innerRadius={45}
                          label
                        >
  
                          {eventSummary.map(
                            (
                              event,
                              index
                            ) => (
  
                              <Cell
                                key={
                                  event.name
                                }
                                fill={
                                  COLORS[
                                    index %
                                      COLORS.length
                                  ]
                                }
                              />
  
                            )
                          )}
  
                        </Pie>
  
  
                        <Tooltip />
  
  
                        <Legend
                          verticalAlign="bottom"
                        />
  
                      </PieChart>
  
                    </ResponsiveContainer>
  
                  </Box>
  
                ) : (
  
                  <Typography
                    align="center"
                    color="text.secondary"
                    sx={{
                      py: 8,
                    }}
                  >
                    No AI Events
                  </Typography>
  
                )}
  
              </CardContent>
  
            </Card>
  
          </Grid>
  
  
          {/* AI EVENT POINTS */}
  
          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
  
            <Card
              elevation={3}
              sx={{
                height: "100%",
              }}
            >
  
              <CardContent>
  
                <Typography
                  variant="h5"
                  sx={{ mb: 2 }}
                >
                  AI Event Points
                </Typography>
  
  
                {eventSummary.length >
                0 ? (
  
                  <Box
                    sx={{
                      height: 350,
                    }}
                  >
  
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
  
                      <BarChart
                        data={
                          eventSummary
                        }
                        margin={{
                          top: 10,
                          right: 20,
                          left: 0,
                          bottom: 60,
                        }}
                      >
  
                        <CartesianGrid
                          strokeDasharray="3 3"
                        />
  
  
                        <XAxis
                          dataKey="name"
                          angle={-15}
                          textAnchor="end"
                          height={80}
                        />
  
  
                        <YAxis />
  
  
                        <Tooltip />
  
  
                        <Bar
                          dataKey="points"
                          fill="#1976d2"
                          name="Total Points"
                        />
  
                      </BarChart>
  
                    </ResponsiveContainer>
  
                  </Box>
  
                ) : (
  
                  <Typography
                    align="center"
                    color="text.secondary"
                    sx={{
                      py: 8,
                    }}
                  >
                    No AI Events
                  </Typography>
  
                )}
  
              </CardContent>
  
            </Card>
  
          </Grid>
  
        </Grid>
  
  
        {/* =====================================
            EXAM REPLAY
        ====================================== */}
  
        <Card
          elevation={3}
          sx={{
            mb: 4,
          }}
        >
  
          <CardContent>
  
            <Box
              sx={{
  
                display: "flex",
  
                justifyContent:
                  "space-between",
  
                alignItems: "center",
  
                flexWrap: "wrap",
  
                gap: 1,
  
                mb: 2,
  
              }}
            >
  
              <Typography
                variant="h5"
              >
                Exam Replay
              </Typography>
  
  
              {details.events?.length >
                0 && (
  
                <Typography
                  color="text.secondary"
                >
                  Event{" "}
                  {currentIndex + 1}
                  {" "}of{" "}
                  {
                    details.events.length
                  }
                </Typography>
  
              )}
  
            </Box>
  
  
            {currentEvent ? (
  
              <>
  
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    mb: 3,
                  }}
                >
  
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                  >
                    {
                      currentEvent.event
                    }
                  </Typography>
  
  
                  <Typography
                    sx={{ mt: 1 }}
                  >
                    Points:{" "}
                    <b>
                      {
                        currentEvent.points
                      }
                    </b>
                  </Typography>
  
  
                  <Typography
                    color="text.secondary"
                  >
                    {new Date(
                      currentEvent.created_at
                    ).toLocaleString()}
                  </Typography>
  
                </Paper>
  
  
                <Box
                  sx={{
  
                    display: "flex",
  
                    justifyContent:
                      "center",
  
                    gap: 2,
  
                    flexWrap: "wrap",
  
                  }}
                >
  
                  {/* Previous */}
  
                  <Button
                    variant="contained"
                    startIcon={
                      <SkipPreviousIcon />
                    }
                    disabled={
                      currentIndex === 0
                    }
                    onClick={() => {
  
                      setPlaying(false);
  
                      setCurrentIndex(
                        currentIndex - 1
                      );
  
                    }}
                  >
                    Previous
                  </Button>
  
  
                  {/* Play / Pause */}
  
                  <Button
                    variant="contained"
                    color={
                      playing
                        ? "warning"
                        : "primary"
                    }
                    startIcon={
                      playing
                        ? <PauseIcon />
                        : <PlayArrowIcon />
                    }
                    onClick={() =>
                      setPlaying(
                        !playing
                      )
                    }
                  >
                    {playing
                      ? "Pause"
                      : "Play"}
                  </Button>
  
  
                  {/* Next */}
  
                  <Button
                    variant="contained"
                    endIcon={
                      <SkipNextIcon />
                    }
                    disabled={
                      currentIndex ===
                      details.events.length -
                        1
                    }
                    onClick={() => {
  
                      setPlaying(false);
  
                      setCurrentIndex(
                        currentIndex + 1
                      );
  
                    }}
                  >
                    Next
                  </Button>
  
                </Box>
  
              </>
  
            ) : (
  
              <Typography
                color="text.secondary"
              >
                No AI Events Found
              </Typography>
  
            )}
  
          </CardContent>
  
        </Card>
  
  
        {/* =====================================
            AI EVENT TIMELINE
        ====================================== */}
  
        <Card
          elevation={3}
          sx={{
            mb: 4,
          }}
        >
  
          <CardContent>
  
            <Typography
              variant="h5"
              sx={{
                mb: 3,
              }}
            >
              AI Event Timeline
            </Typography>
  
  
            {details.events?.length >
            0 ? (
  
              <Timeline
                position="right"
                sx={{
  
                  p: 0,
  
                  m: 0,
  
                  "& .MuiTimelineItem-root:before":
                    {
  
                      flex: 0,
  
                      padding: 0,
  
                    },
  
                }}
              >
  
                {details.events.map(
                  (event, index) => (
  
                    <TimelineItem
                      key={index}
                    >
  
                      <TimelineSeparator>
  
                        <TimelineDot
                          color={
                            event.points >=
                            15
                              ? "error"
                              : event.points >=
                                8
                              ? "warning"
                              : "success"
                          }
                        />
  
  
                        {index !==
                          details.events
                            .length -
                            1 && (
  
                          <TimelineConnector />
  
                        )}
  
                      </TimelineSeparator>
  
  
                      <TimelineContent
                        sx={{
                          pb: 4,
                        }}
                      >
  
                        <Paper
                          variant="outlined"
                          sx={{
  
                            p: 2,
  
                            width: "100%",
  
                            maxWidth: 750,
  
                          }}
                        >
  
                          <Typography
                            variant="h6"
                          >
                            {event.event}
                          </Typography>
  
  
                          <Typography>
                            Points:{" "}
                            {event.points}
                          </Typography>
  
  
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {new Date(
                              event.created_at
                            ).toLocaleString()}
                          </Typography>
  
                        </Paper>
  
                      </TimelineContent>
  
                    </TimelineItem>
  
                  )
                )}
  
              </Timeline>
  
            ) : (
  
              <Typography
                align="center"
                color="text.secondary"
              >
                No AI Events Available
              </Typography>
  
            )}
  
          </CardContent>
  
        </Card>
  
  
        {/* =====================================
            AI EVENT HISTORY
        ====================================== */}
  
        <Card elevation={3}>
  
          <CardContent>
  
            <Box
              sx={{
  
                display: "flex",
  
                justifyContent:
                  "space-between",
  
                alignItems: "center",
  
                flexWrap: "wrap",
  
                gap: 1,
  
                mb: 2,
  
              }}
            >
  
              <Typography
                variant="h5"
              >
                AI Event History
              </Typography>
  
  
              <Typography
                color="text.secondary"
              >
                Total Events:{" "}
                {
                  details.events
                    ?.length || 0
                }
              </Typography>
  
            </Box>
  
  
            <TableContainer
              component={Paper}
              variant="outlined"
            >
  
              <Table>
  
                <TableHead>
  
                  <TableRow>
  
                    <TableCell>
                      <b>#</b>
                    </TableCell>
  
                    <TableCell>
                      <b>Event</b>
                    </TableCell>
  
                    <TableCell>
                      <b>Points</b>
                    </TableCell>
  
                    <TableCell>
                      <b>Event Weight</b>
                    </TableCell>
  
                    <TableCell>
                      <b>Time</b>
                    </TableCell>
  
                  </TableRow>
  
                </TableHead>
  
  
                <TableBody>
  
                  {details.events?.length >
                  0 ? (
  
                    details.events.map(
                      (
                        event,
                        index
                      ) => (
  
                        <TableRow
                          key={index}
                          hover
                        >
  
                          <TableCell>
                            {index + 1}
                          </TableCell>
  
  
                          <TableCell>
                            {event.event}
                          </TableCell>
  
  
                          <TableCell>
                            {event.points}
                          </TableCell>
  
  
                          <TableCell>
  
                            <Chip
                              size="small"
                              label={
                                getEventWeight(
                                  event.points
                                )
                              }
                              color={
                                getEventColor(
                                  event.points
                                )
                              }
                            />

                          </TableCell>
  
                          <TableCell>
                            {new Date(
                              event.created_at
                            ).toLocaleString()}
                          </TableCell>
  
                        </TableRow>
  
                      )
                    )
  
                  ) : (
  
                    <TableRow>
  
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{
                          py: 4,
                        }}
                      >
                        No AI Events Found
                      </TableCell>
  
                    </TableRow>
  
                  )}
  
                </TableBody>
  
              </Table>
  
            </TableContainer>
  
          </CardContent>
  
        </Card>
  
      </Container>
  
    );
  
  }
  
  
  export default AttemptDetails;