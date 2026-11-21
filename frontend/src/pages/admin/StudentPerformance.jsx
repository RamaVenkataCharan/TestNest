import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  TablePagination,
  CircularProgress,
} from "@mui/material";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  getPerformanceSummary,
} from "../../services/performanceService";

import {
  getStudentPerformance,
} from "../../services/studentPerformanceService";

import {
  getRankings,
  getRankingExams,
  getExamRankings,
} from "../../services/rankingService";


function StudentPerformance() {

  // ==========================================
  // PERFORMANCE DATA
  // ==========================================

  const [
    performance,
    setPerformance,
  ] = useState([]);


  const [
    summary,
    setSummary,
  ] = useState({

    total_students: 0,

    total_attempts: 0,

    average_score: 0,

    highest_score: 0,
  });


  // ==========================================
  // SEARCH / FILTER
  // ==========================================

  const [
    search,
    setSearch,
  ] = useState("");


  const [
    resultFilter,
    setResultFilter,
  ] = useState("All");


  // ==========================================
  // OVERALL RANKINGS
  // ==========================================

  const [
    rankings,
    setRankings,
  ] = useState([]);


  // ==========================================
  // EXAM-WISE LEADERBOARD
  // ==========================================

  const [
    rankingExams,
    setRankingExams,
  ] = useState([]);


  const [
    selectedRankingExam,
    setSelectedRankingExam,
  ] = useState("");


  const [
    examRankingData,
    setExamRankingData,
  ] = useState(null);


  const [
    examRankingLoading,
    setExamRankingLoading,
  ] = useState(false);


  // ==========================================
  // PAGINATION
  // ==========================================

  const [
    page,
    setPage,
  ] = useState(0);


  const [
    rowsPerPage,
    setRowsPerPage,
  ] = useState(10);


  // ==========================================
  // LOAD STUDENT PERFORMANCE
  // ==========================================

  const loadPerformance =
    async () => {

      try {

        const data =
          await getStudentPerformance();


        setPerformance(
          data || []
        );


      } catch (error) {

        console.error(
          "Failed to load student performance:",
          error
        );
      }
    };


  // ==========================================
  // LOAD SUMMARY
  // ==========================================

  const loadSummary =
    async () => {

      try {

        const data =
          await getPerformanceSummary();


        setSummary(
          data || {

            total_students: 0,

            total_attempts: 0,

            average_score: 0,

            highest_score: 0,
          }
        );


      } catch (error) {

        console.error(
          "Failed to load performance summary:",
          error
        );
      }
    };


  // ==========================================
  // LOAD OVERALL RANKINGS
  // ==========================================

  const loadRankings =
    async () => {

      try {

        const data =
          await getRankings();


        setRankings(
          data || []
        );


      } catch (error) {

        console.error(
          "Failed to load rankings:",
          error
        );
      }
    };


  // ==========================================
  // LOAD EXAMS FOR RANKING
  // ==========================================

  const loadRankingExams =
    async () => {

      try {

        const data =
          await getRankingExams();


        setRankingExams(
          data || []
        );


      } catch (error) {

        console.error(
          "Failed to load ranking exams:",
          error
        );
      }
    };


  // ==========================================
  // SELECT EXAM FOR LEADERBOARD
  // ==========================================

  const handleRankingExamChange =
    async (event) => {

      const examId =
        event.target.value;


      setSelectedRankingExam(
        examId
      );


      setExamRankingData(
        null
      );


      if (!examId) {

        return;
      }


      try {

        setExamRankingLoading(
          true
        );


        const data =
          await getExamRankings(
            examId
          );


        setExamRankingData(
          data
        );


      } catch (error) {

        console.error(
          "Failed to load exam rankings:",
          error
        );


        alert(
          "Failed to load exam-wise leaderboard."
        );


      } finally {

        setExamRankingLoading(
          false
        );
      }
    };


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {

    loadPerformance();

    loadSummary();

    loadRankings();

    loadRankingExams();

  }, []);


  // ==========================================
  // FILTER PERFORMANCE
  // ==========================================

  const filteredPerformance =
    useMemo(
      () => {

        return performance.filter(
          (item) => {

            const studentName =
              item.student_name ||
              "";


            const examTitle =
              item.exam_title ||
              "";


            const matchesSearch =
              studentName
                .toLowerCase()
                .includes(
                  search
                    .toLowerCase()
                )
              ||
              examTitle
                .toLowerCase()
                .includes(
                  search
                    .toLowerCase()
                );


            const matchesResult =
              resultFilter ===
                "All"
              ||
              item.status ===
                resultFilter;


            return (
              matchesSearch &&
              matchesResult
            );
          }
        );

      },
      [
        performance,
        search,
        resultFilter,
      ]
    );


  // ==========================================
  // RESET PAGE WHEN FILTER CHANGES
  // ==========================================

  useEffect(() => {

    setPage(0);

  }, [
    search,
    resultFilter,
  ]);


  // ==========================================
  // AVERAGE SCORE BY STUDENT
  // ==========================================

  const studentScoreData =
    useMemo(
      () => {

        const grouped =
          {};


        filteredPerformance.forEach(
          (item) => {

            const name =
              item.student_name ||
              "Unknown";


            if (!grouped[name]) {

              grouped[name] = {

                total: 0,

                attempts: 0,
              };
            }


            grouped[name].total +=
              Number(
                item.score ||
                0
              );


            grouped[name].attempts +=
              1;
          }
        );


        return Object.entries(
          grouped
        ).map(
          (
            [
              name,
              data,
            ]
          ) => ({

            name,

            averageScore:
              Number(
                (
                  data.total /
                  data.attempts
                ).toFixed(2)
              ),
          })
        );

      },
      [
        filteredPerformance,
      ]
    );


  // ==========================================
  // PASS / FAIL CHART DATA
  // ==========================================

  const resultData = [

    {

      name:
        "Pass",

      value:
        filteredPerformance.filter(
          (item) =>
            item.status ===
            "Pass"
        ).length,
    },

    {

      name:
        "Fail",

      value:
        filteredPerformance.filter(
          (item) =>
            item.status ===
            "Fail"
        ).length,
    },
  ];


  const COLORS = [

    "#2e7d32",

    "#d32f2f",
  ];


  // ==========================================
  // PAGINATION
  // ==========================================

  const handleChangePage =
    (
      event,
      newPage
    ) => {

      setPage(
        newPage
      );
    };


  const handleRowsPerPageChange =
    (event) => {

      setRowsPerPage(
        parseInt(
          event.target.value,
          10
        )
      );


      setPage(0);
    };


  // ==========================================
  // PAGE
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
      ===================================== */}

      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{
          mb: 3,
        }}
      >
        Student Performance Analytics
      </Typography>


      {/* =====================================
          SEARCH
      ===================================== */}

      <Card
        elevation={2}
        sx={{
          mb: 4,
        }}
      >

        <CardContent>

          <Box
            sx={{

              display:
                "flex",

              gap: 2,

              flexWrap:
                "wrap",
            }}
          >

            <TextField
              label="Search Student or Exam"
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
              sx={{

                flex: 1,

                minWidth: 280,
              }}
            />


            <TextField
              select
              label="Result"
              value={
                resultFilter
              }
              onChange={
                (event) =>
                  setResultFilter(
                    event.target.value
                  )
              }
              sx={{
                minWidth: 180,
              }}
            >

              <MenuItem
                value="All"
              >
                All Results
              </MenuItem>


              <MenuItem
                value="Pass"
              >
                Pass
              </MenuItem>


              <MenuItem
                value="Fail"
              >
                Fail
              </MenuItem>

            </TextField>

          </Box>

        </CardContent>

      </Card>


      {/* =====================================
          SUMMARY
      ===================================== */}

      <Grid
        container
        spacing={3}
        sx={{
          mb: 4,
        }}
      >


        {/* TOTAL STUDENTS */}

        <Grid
          size={{

            xs: 12,

            sm: 6,

            md: 3,
          }}
        >

          <Card
            elevation={4}
            sx={{
              height:
                "100%",
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                color="text.secondary"
              >
                Total Students
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
                  summary
                    .total_students
                }
              </Typography>

            </CardContent>

          </Card>

        </Grid>


        {/* TOTAL ATTEMPTS */}

        <Grid
          size={{

            xs: 12,

            sm: 6,

            md: 3,
          }}
        >

          <Card
            elevation={4}
            sx={{
              height:
                "100%",
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                color="text.secondary"
              >
                Total Attempts
              </Typography>


              <Typography
                variant="h3"
                color="secondary"
                fontWeight="bold"
                sx={{
                  mt: 1,
                }}
              >
                {
                  summary
                    .total_attempts
                }
              </Typography>

            </CardContent>

          </Card>

        </Grid>


        {/* AVERAGE SCORE */}

        <Grid
          size={{

            xs: 12,

            sm: 6,

            md: 3,
          }}
        >

          <Card
            elevation={4}
            sx={{
              height:
                "100%",
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                color="text.secondary"
              >
                Average Score
              </Typography>


              <Typography
                variant="h3"
                color="success.main"
                fontWeight="bold"
                sx={{
                  mt: 1,
                }}
              >
                {
                  summary
                    .average_score
                }
              </Typography>

            </CardContent>

          </Card>

        </Grid>


        {/* HIGHEST SCORE */}

        <Grid
          size={{

            xs: 12,

            sm: 6,

            md: 3,
          }}
        >

          <Card
            elevation={4}
            sx={{
              height:
                "100%",
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                color="text.secondary"
              >
                Highest Score
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
                  summary
                    .highest_score
                }
              </Typography>

            </CardContent>

          </Card>

        </Grid>

      </Grid>


      {/* =====================================
          CHARTS
      ===================================== */}

      <Grid
        container
        spacing={3}
        sx={{
          mb: 4,
        }}
      >


        {/* =================================
            SCORE CHART
        ================================= */}

        <Grid
          size={{

            xs: 12,

            md: 7,
          }}
        >

          <Card
            elevation={3}
            sx={{
              height:
                "100%",
            }}
          >

            <CardContent>

              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                }}
              >
                Average Score by Student
              </Typography>


              <Box
                sx={{

                  width:
                    "100%",

                  height:
                    350,
                }}
              >

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={
                      studentScoreData
                    }
                    margin={{

                      top: 10,

                      right: 20,

                      left: 0,

                      bottom: 40,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray=
                        "3 3"
                    />


                    <XAxis
                      dataKey="name"
                      angle={-20}
                      textAnchor="end"
                      height={70}
                    />


                    <YAxis />


                    <Tooltip />


                    <Bar
                      dataKey=
                        "averageScore"
                      fill="#1976d2"
                      name=
                        "Average Score"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </Box>

            </CardContent>

          </Card>

        </Grid>


        {/* =================================
            PASS / FAIL CHART
        ================================= */}

        <Grid
          size={{

            xs: 12,

            md: 5,
          }}
        >

          <Card
            elevation={3}
            sx={{
              height:
                "100%",
            }}
          >

            <CardContent>

              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                }}
              >
                Pass vs Fail
              </Typography>


              <Box
                sx={{

                  width:
                    "100%",

                  height:
                    350,
                }}
              >

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={
                        resultData
                      }
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={
                        100
                      }
                      innerRadius={
                        45
                      }
                      label
                    >

                      {
                        resultData.map(
                          (
                            entry,
                            index
                          ) => (

                            <Cell
                              key={
                                index
                              }
                              fill={
                                COLORS[
                                  index
                                ]
                              }
                            />

                          )
                        )
                      }

                    </Pie>


                    <Tooltip />


                    <Legend
                      verticalAlign=
                        "bottom"
                    />

                  </PieChart>

                </ResponsiveContainer>

              </Box>

            </CardContent>

          </Card>

        </Grid>

      </Grid>


      {/* =====================================
          PERFORMANCE DETAILS
      ===================================== */}

      <Card
        elevation={3}
        sx={{
          mb: 4,
        }}
      >

        <CardContent>

          <Box
            sx={{

              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              mb: 2,

              gap: 2,

              flexWrap:
                "wrap",
            }}
          >

            <Typography
              variant="h5"
            >
              Student Performance Details
            </Typography>


            <Typography
              color=
                "text.secondary"
            >
              Results:{" "}

              {
                filteredPerformance
                  .length
              }
            </Typography>

          </Box>


          <Box
            sx={{
              overflowX:
                "auto",
            }}
          >

            <Table
              sx={{
                minWidth: 750,
              }}
            >

              <TableHead>

                <TableRow>

                  <TableCell>
                    <b>
                      Student
                    </b>
                  </TableCell>

                  <TableCell>
                    <b>
                      Exam
                    </b>
                  </TableCell>

                  <TableCell>
                    <b>
                      Score
                    </b>
                  </TableCell>

                  <TableCell>
                    <b>
                      Percentage
                    </b>
                  </TableCell>

                  <TableCell>
                    <b>
                      Result
                    </b>
                  </TableCell>

                </TableRow>

              </TableHead>


              <TableBody>

                {
                  filteredPerformance
                    .slice(
                      page *
                        rowsPerPage,

                      page *
                        rowsPerPage
                      +
                        rowsPerPage
                    )
                    .map(
                      (
                        student
                      ) => (

                        <TableRow
                          key={
                            student
                              .attempt_id
                          }
                          hover
                        >

                          <TableCell>
                            {
                              student
                                .student_name
                            }
                          </TableCell>


                          <TableCell>
                            {
                              student
                                .exam_title
                            }
                          </TableCell>


                          <TableCell>
                            {
                              student
                                .score
                            }
                          </TableCell>


                          <TableCell>
                            {
                              student
                                .percentage
                            }
                            %
                          </TableCell>


                          <TableCell>

                            <Chip
                              label={
                                student
                                  .status
                              }
                              color={
                                student
                                  .status ===
                                "Pass"
                                  ? "success"
                                  : "error"
                              }
                              size=
                                "small"
                            />

                          </TableCell>

                        </TableRow>

                      )
                    )
                }


                {
                  filteredPerformance
                    .length ===
                    0 && (

                    <TableRow>

                      <TableCell
                        colSpan={
                          5
                        }
                        align=
                          "center"
                        sx={{
                          py: 4,
                        }}
                      >
                        No performance records found.
                      </TableCell>

                    </TableRow>

                  )
                }

              </TableBody>

            </Table>

          </Box>


          <TablePagination
            component="div"
            count={
              filteredPerformance
                .length
            }
            page={page}
            onPageChange={
              handleChangePage
            }
            rowsPerPage={
              rowsPerPage
            }
            onRowsPerPageChange={
              handleRowsPerPageChange
            }
            rowsPerPageOptions={[
              5,
              10,
              20,
              50,
            ]}
          />

        </CardContent>

      </Card>


      {/* =====================================
          EXAM-WISE LEADERBOARD
      ===================================== */}

      <Card
        elevation={4}
        sx={{
          mb: 4,
        }}
      >

        <CardContent>

          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              mb: 1,
            }}
          >
            🏆 Exam-wise Leaderboard & Topper
          </Typography>


          <Typography
            color=
              "text.secondary"
            sx={{
              mb: 3,
            }}
          >
            Select an exam to view
            the topper and ranking
            based on each student's
            best attempt.
          </Typography>


          {/* EXAM DROPDOWN */}

          <TextField
            select
            fullWidth
            label="Select Exam"
            value={
              selectedRankingExam
            }
            onChange={
              handleRankingExamChange
            }
            sx={{

              maxWidth: 600,

              mb: 3,
            }}
          >

            <MenuItem
              value=""
            >
              Select an Exam
            </MenuItem>


            {
              rankingExams.map(
                (exam) => (

                  <MenuItem
                    key={
                      exam.exam_id
                    }
                    value={
                      exam.exam_id
                    }
                  >

                    {exam.title}

                    {" - "}

                    {exam.subject}

                    {" ("}

                    {
                      exam.total_students
                    }

                    {" students)"}

                  </MenuItem>

                )
              )
            }

          </TextField>


          {/* LOADING */}

          {
            examRankingLoading && (

              <Box
                sx={{

                  textAlign:
                    "center",

                  py: 4,
                }}
              >

                <CircularProgress />

              </Box>

            )
          }


          {/* =================================
              SELECTED EXAM DATA
          ================================= */}

          {
            examRankingData &&
            !examRankingLoading && (

              <>


                {/* =============================
                    TOPPER CARD
                ============================= */}

                <Box
                  sx={{

                    p: 3,

                    mb: 3,

                    borderRadius:
                      2,

                    bgcolor:
                      "#fff8e1",

                    border:
                      "1px solid #ffe082",
                  }}
                >

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >

                    {
                      examRankingData
                        .exam
                        .title
                    }

                    {" - "}

                    {
                      examRankingData
                        .exam
                        .subject
                    }

                  </Typography>


                  <Typography
                    color=
                      "text.secondary"
                    sx={{
                      mt: 0.5,
                    }}
                  >

                    Ranked Students:{" "}

                    {
                      examRankingData
                        .total_ranked_students
                    }

                  </Typography>


                  {
                    examRankingData
                      .topper
                      ? (

                      <>

                        <Typography
                          variant="h4"
                          sx={{
                            mt: 2,
                          }}
                          fontWeight=
                            "bold"
                        >

                          🥇 Topper:{" "}

                          {
                            examRankingData
                              .topper
                              .student_name
                          }

                        </Typography>


                        <Typography
                          variant="h6"
                          sx={{
                            mt: 1,
                          }}
                        >

                          Score:{" "}

                          {
                            examRankingData
                              .topper
                              .score
                          }

                          {" / "}

                          {
                            examRankingData
                              .topper
                              .max_score
                          }

                        </Typography>


                        <Typography
                          variant="h6"
                        >

                          Percentage:{" "}

                          {
                            examRankingData
                              .topper
                              .percentage
                          }

                          %

                        </Typography>


                        <Typography
                          color=
                            "text.secondary"
                          sx={{
                            mt: 1,
                          }}
                        >

                          Best Attempt: #

                          {
                            examRankingData
                              .topper
                              .attempt_id
                          }

                        </Typography>

                      </>

                    ) : (

                      <Typography
                        sx={{
                          mt: 2,
                        }}
                      >
                        No attempts found
                        for this exam.
                      </Typography>

                    )
                  }

                </Box>


                {/* =============================
                    EXAM RANKING TABLE
                ============================= */}

                <Box
                  sx={{
                    overflowX:
                      "auto",
                  }}
                >

                  <Table
                    sx={{
                      minWidth:
                        850,
                    }}
                  >

                    <TableHead>

                      <TableRow>

                        <TableCell>
                          <b>
                            Rank
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Student
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Score
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Percentage
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Attempts
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Best Attempt
                          </b>
                        </TableCell>

                      </TableRow>

                    </TableHead>


                    <TableBody>

                      {
                        examRankingData
                          .rankings
                          .map(
                            (
                              student
                            ) => (

                              <TableRow
                                key={
                                  `${student.student_id}-${student.attempt_id}`
                                }
                                hover
                              >

                                {/* RANK */}

                                <TableCell>

                                  {
                                    student
                                      .rank ===
                                    1

                                      ? "🥇"

                                      : student
                                          .rank ===
                                        2

                                      ? "🥈"

                                      : student
                                          .rank ===
                                        3

                                      ? "🥉"

                                      : student
                                          .rank
                                  }

                                </TableCell>


                                {/* STUDENT */}

                                <TableCell>

                                  <Typography
                                    fontWeight={
                                      student
                                        .rank ===
                                      1
                                        ? "bold"
                                        : "normal"
                                    }
                                  >

                                    {
                                      student
                                        .student_name
                                    }

                                  </Typography>

                                </TableCell>


                                {/* SCORE */}

                                <TableCell>

                                  <b>

                                    {
                                      student
                                        .score
                                    }

                                    {" / "}

                                    {
                                      student
                                        .max_score
                                    }

                                  </b>

                                </TableCell>


                                {/* PERCENTAGE */}

                                <TableCell>

                                  {
                                    student
                                      .percentage
                                  }

                                  %

                                </TableCell>


                                {/* ATTEMPTS */}

                                <TableCell>

                                  {
                                    student
                                      .attempts_for_exam
                                  }

                                </TableCell>


                                {/* BEST ATTEMPT */}

                                <TableCell>

                                  #

                                  {
                                    student
                                      .attempt_id
                                  }

                                </TableCell>

                              </TableRow>

                            )
                          )
                      }


                      {
                        examRankingData
                          .rankings
                          .length ===
                          0 && (

                          <TableRow>

                            <TableCell
                              colSpan={
                                6
                              }
                              align=
                                "center"
                              sx={{
                                py: 4,
                              }}
                            >

                              No ranking data
                              found for this
                              exam.

                            </TableCell>

                          </TableRow>

                        )
                      }

                    </TableBody>

                  </Table>

                </Box>

              </>

            )
          }

        </CardContent>

      </Card>


      {/* =====================================
          OVERALL LEADERBOARD
      ===================================== */}

      <Card
        elevation={3}
      >

        <CardContent>

          <Box
            sx={{

              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              mb: 2,

              gap: 2,

              flexWrap:
                "wrap",
            }}
          >

            <Typography
              variant="h5"
            >
              🏆 Overall Student Leaderboard
            </Typography>


            <Typography
              color=
                "text.secondary"
            >

              Students:{" "}

              {
                rankings.length
              }

            </Typography>

          </Box>


          <Box
            sx={{
              overflowX:
                "auto",
            }}
          >

            <Table
              sx={{
                minWidth:
                  650,
              }}
            >

              <TableHead>

                <TableRow>

                  <TableCell>
                    <b>
                      Rank
                    </b>
                  </TableCell>

                  <TableCell>
                    <b>
                      Student
                    </b>
                  </TableCell>

                  <TableCell>
                    <b>
                      Average Score
                    </b>
                  </TableCell>

                  <TableCell>
                    <b>
                      Attempts
                    </b>
                  </TableCell>

                </TableRow>

              </TableHead>


              <TableBody>

                {
                  rankings.map(
                    (
                      student
                    ) => (

                      <TableRow
                        key={
                          student
                            .rank
                        }
                        hover
                      >

                        <TableCell>

                          {
                            student
                              .rank ===
                            1

                              ? "🥇"

                              : student
                                  .rank ===
                                2

                              ? "🥈"

                              : student
                                  .rank ===
                                3

                              ? "🥉"

                              : student
                                  .rank
                          }

                        </TableCell>


                        <TableCell>

                          {
                            student
                              .student_name
                          }

                        </TableCell>


                        <TableCell>

                          {
                            student
                              .average_score
                          }

                        </TableCell>


                        <TableCell>

                          {
                            student
                              .attempts
                          }

                        </TableCell>

                      </TableRow>

                    )
                  )
                }


                {
                  rankings.length ===
                    0 && (

                    <TableRow>

                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{
                          py: 4,
                        }}
                      >

                        No ranking data
                        available.

                      </TableCell>

                    </TableRow>

                  )
                }

              </TableBody>

            </Table>

          </Box>

        </CardContent>

      </Card>


    </Container>
  );
}


export default StudentPerformance;