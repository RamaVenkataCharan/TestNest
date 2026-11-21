import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

import {
  getAIReports,
  getAISummary,
  getReportExams,
  getExamStudentReports,
  downloadAttemptReportPDF,
} from "../../services/aiReportService";

import {
  downloadAIReport,
} from "../../services/exportService";


function AIReports() {

  // ==========================================
  // GLOBAL AI REPORT DATA
  // ==========================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    reports,
    setReports,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState({
    total_events: 0,
    total_points: 0,
    latest_event: "",
    latest_time: "",
  });


  // ==========================================
  // EVENT FILTERS
  // ==========================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(0);

  const [
    rowsPerPage,
    setRowsPerPage,
  ] = useState(10);

  const [
    riskFilter,
    setRiskFilter,
  ] = useState("All");


  // ==========================================
  // EXAM-WISE REPORT DATA
  // ==========================================

  const [
    reportExams,
    setReportExams,
  ] = useState([]);

  const [
    selectedReportExam,
    setSelectedReportExam,
  ] = useState("");

  const [
    examReportData,
    setExamReportData,
  ] = useState(null);

  const [
    examReportLoading,
    setExamReportLoading,
  ] = useState(false);

  const [
    downloadingAttempt,
    setDownloadingAttempt,
  ] = useState(null);


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {

    loadReports();

    loadSummary();

    loadReportExams();


    const interval =
      setInterval(
        () => {

          loadReports();

          loadSummary();

        },
        5000
      );


    return () =>
      clearInterval(
        interval
      );

  }, []);


  // ==========================================
  // RESET EVENT TABLE PAGE
  // ==========================================

  useEffect(() => {

    setPage(0);

  }, [
    search,
    riskFilter,
  ]);


  // ==========================================
  // LOAD GLOBAL AI EVENTS
  // ==========================================

  const loadReports =
    async () => {

      try {

        const data =
          await getAIReports();

        setReports(
          data || []
        );

      } catch (error) {

        console.error(
          "Failed to load AI reports:",
          error
        );

      } finally {

        setLoading(false);
      }
    };


  // ==========================================
  // LOAD GLOBAL SUMMARY
  // ==========================================

  const loadSummary =
    async () => {

      try {

        const data =
          await getAISummary();

        setSummary(
          data || {
            total_events: 0,
            total_points: 0,
            latest_event: "",
            latest_time: "",
          }
        );

      } catch (error) {

        console.error(
          "Failed to load AI summary:",
          error
        );
      }
    };


  // ==========================================
  // LOAD EXAMS FOR REPORT SECTION
  // ==========================================

  const loadReportExams =
    async () => {

      try {

        const data =
          await getReportExams();

        setReportExams(
          data || []
        );

      } catch (error) {

        console.error(
          "Failed to load report exams:",
          error
        );
      }
    };


  // ==========================================
  // EXAM SELECTION
  // ==========================================

  const handleReportExamChange =
    async (event) => {

      const examId =
        event.target.value;


      setSelectedReportExam(
        examId
      );


      setExamReportData(
        null
      );


      if (!examId) {

        return;
      }


      await loadExamStudentReports(
        examId
      );
    };


  // ==========================================
  // LOAD STUDENTS FOR SELECTED EXAM
  // ==========================================

  const loadExamStudentReports =
    async (examId) => {

      try {

        setExamReportLoading(
          true
        );


        const data =
          await getExamStudentReports(
            examId
          );


        setExamReportData(
          data
        );


      } catch (error) {

        console.error(
          "Failed to load exam student reports:",
          error
        );


        alert(
          "Failed to load student reports for this exam."
        );


      } finally {

        setExamReportLoading(
          false
        );
      }
    };


  // ==========================================
  // DOWNLOAD INDIVIDUAL PDF
  // ==========================================

  const handleStudentPDF =
    async (student) => {

      try {

        setDownloadingAttempt(
          student.attempt_id
        );


        await downloadAttemptReportPDF(

          student.attempt_id,

          student.student_name,

          examReportData?.exam?.title ||
            "exam"
        );


      } catch (error) {

        console.error(
          "Failed to download student PDF:",
          error
        );


        alert(
          "Failed to download student exam report."
        );


      } finally {

        setDownloadingAttempt(
          null
        );
      }
    };


  // ==========================================
  // FILTER GLOBAL EVENTS
  // ==========================================

  const filteredReports =
    useMemo(
      () => {

        return reports.filter(
          (report) => {

            const eventName =
              report.event || "";


            const matchesSearch =
              eventName
                .toLowerCase()
                .includes(
                  search
                    .toLowerCase()
                );


            const matchesRisk =
              riskFilter === "All" ||
              report.risk ===
                riskFilter;


            return (
              matchesSearch &&
              matchesRisk
            );
          }
        );

      },
      [
        reports,
        search,
        riskFilter,
      ]
    );


  // ==========================================
  // GLOBAL RISK ANALYTICS
  // ==========================================

  const analytics = {

    high:
      reports.filter(
        (report) =>
          report.risk === "High"
      ).length,

    medium:
      reports.filter(
        (report) =>
          report.risk === "Medium"
      ).length,

    low:
      reports.filter(
        (report) =>
          report.risk === "Low"
      ).length,
  };


  // ==========================================
  // MOST COMMON EVENT
  // ==========================================

  const eventCounts =
    reports.reduce(
      (
        accumulator,
        report
      ) => {

        const eventName =
          report.event ||
          "Unknown";


        accumulator[eventName] =
          (
            accumulator[eventName] ||
            0
          ) + 1;


        return accumulator;

      },
      {}
    );


  const mostCommonEvent =
    Object.entries(
      eventCounts
    ).sort(
      (a, b) =>
        b[1] - a[1]
    )[0]?.[0] ||
    "No Events";


  // ==========================================
  // TABLE PAGINATION
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


  const handleRowsPerPage =
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
  // EXPORT EVENT CSV
  // ==========================================

  const exportCSV =
    () => {

      const rows = [

        [
          "ID",
          "Attempt ID",
          "Event",
          "Points",
          "Risk",
          "Created At",
        ],
      ];


      filteredReports.forEach(
        (report) => {

          rows.push([

            report.id,

            report.attempt_id ||
              "",

            `"${String(
              report.event || ""
            ).replace(
              /"/g,
              '""'
            )}"`,

            report.points,

            report.risk,

            report.created_at,
          ]);
        }
      );


      const csvContent =
        rows
          .map(
            (row) =>
              row.join(",")
          )
          .join("\n");


      const blob =
        new Blob(
          [csvContent],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        "ai_reports.csv";


      document.body.appendChild(
        link
      );


      link.click();


      document.body.removeChild(
        link
      );


      URL.revokeObjectURL(
        url
      );
    };


  // ==========================================
  // EXPORT EVENT PDF
  // ==========================================

  const exportPDF =
    () => {

      const doc =
        new jsPDF();


      doc.setFontSize(
        18
      );


      doc.text(
        "AI Monitoring Report",
        14,
        20
      );


      autoTable(
        doc,
        {

          head: [[
            "ID",
            "Event",
            "Points",
            "Risk",
            "Created At",
          ]],

          body:
            filteredReports.map(
              (report) => [

                report.id,

                report.event,

                report.points,

                report.risk,

                report.created_at
                  ? new Date(
                      report.created_at
                    ).toLocaleString()
                  : "-",
              ]
            ),

          startY: 30,
        }
      );


      doc.save(
        "AI_Report.pdf"
      );
    };


  // ==========================================
  // EXISTING CSV DOWNLOAD
  // ==========================================

  const handleDownloadCSV =
    async () => {

      try {

        await downloadAIReport();

      } catch (error) {

        console.error(
          error
        );

        alert(
          "Failed to download report."
        );
      }
    };


  // ==========================================
  // CHART DATA
  // ==========================================

  const chartData = [

    {
      name:
        "Total Events",

      value:
        summary.total_events ||
        0,
    },

    {
      name:
        "Suspicious Points",

      value:
        summary.total_points ||
        0,
    },
  ];


  const COLORS = [
    "#1976d2",
    "#d32f2f",
  ];


  // ==========================================
  // RISK CHIP COLOR
  // ==========================================

  const getRiskColor =
    (risk) => {

      switch (risk) {

        case "Critical":
          return "error";

        case "High":
          return "error";

        case "Medium":
          return "warning";

        case "Warning":
          return "warning";

        case "Low":
          return "success";

        default:
          return "default";
      }
    };


  // ==========================================
  // LOADING SCREEN
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
          mb: 4,
        }}
      >
        AI Reports Dashboard
      </Typography>


      {/* =====================================
          GLOBAL SUMMARY CARDS
      ===================================== */}

      <Grid
        container
        spacing={3}
        sx={{
          mb: 4,
        }}
      >


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
              height: "100%",
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                color="text.secondary"
              >
                Total Events
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
                  summary.total_events
                }
              </Typography>

            </CardContent>

          </Card>

        </Grid>


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
              height: "100%",
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                color="text.secondary"
              >
                Suspicious Points
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
                  summary.total_points
                }
              </Typography>

            </CardContent>

          </Card>

        </Grid>


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
              height: "100%",
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                color="text.secondary"
              >
                Latest Event
              </Typography>


              <Typography
                variant="h6"
                sx={{
                  mt: 2,
                }}
              >
                {
                  summary.latest_event ||
                  "No Events"
                }
              </Typography>

            </CardContent>

          </Card>

        </Grid>


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
              height: "100%",
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                color="text.secondary"
              >
                Latest Time
              </Typography>


              <Typography
                sx={{
                  mt: 2,
                }}
              >
                {
                  summary.latest_time
                    ? new Date(
                        summary.latest_time
                      ).toLocaleString()
                    : "No Data"
                }
              </Typography>

            </CardContent>

          </Card>

        </Grid>


      </Grid>


      {/* =====================================
          GLOBAL RISK CARDS
      ===================================== */}

      <Grid
        container
        spacing={3}
        sx={{
          mb: 4,
        }}
      >


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
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
                variant="h6"
              >
                High Risk
              </Typography>


              <Typography
                variant="h3"
                color="error"
                fontWeight="bold"
                sx={{
                  mt: 1,
                }}
              >
                {analytics.high}
              </Typography>

            </CardContent>

          </Card>

        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
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
                variant="h6"
              >
                Medium Risk
              </Typography>


              <Typography
                variant="h3"
                color="warning.main"
                fontWeight="bold"
                sx={{
                  mt: 1,
                }}
              >
                {analytics.medium}
              </Typography>

            </CardContent>

          </Card>

        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
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
                variant="h6"
              >
                Low Risk
              </Typography>


              <Typography
                variant="h3"
                color="success.main"
                fontWeight="bold"
                sx={{
                  mt: 1,
                }}
              >
                {analytics.low}
              </Typography>

            </CardContent>

          </Card>

        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
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
                variant="h6"
              >
                Most Common Event
              </Typography>


              <Typography
                variant="h6"
                sx={{
                  mt: 2,
                }}
              >
                {mostCommonEvent}
              </Typography>

            </CardContent>

          </Card>

        </Grid>


      </Grid>


      {/* =====================================
          CHART
      ===================================== */}

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
              mb: 2,
            }}
          >
            AI Activity Overview
          </Typography>


          <Box
            sx={{
              width: "100%",
              maxWidth: 650,
              height: 320,
              mx: "auto",
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={40}
                  dataKey="value"
                  nameKey="name"
                  label
                >

                  {
                    chartData.map(
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
                              index %
                              COLORS.length
                            ]
                          }
                        />

                      )
                    )
                  }

                </Pie>


                <Tooltip />


                <Legend
                  verticalAlign="bottom"
                />

              </PieChart>

            </ResponsiveContainer>

          </Box>

        </CardContent>

      </Card>


      {/* =====================================
          EXAM-WISE STUDENT REPORTS
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
            Exam-wise Student Reports
          </Typography>


          <Typography
            color="text.secondary"
            sx={{
              mb: 3,
            }}
          >
            Select an exam to view each
            student's attempt and download
            an individual exam report.
          </Typography>


          <FormControl
            fullWidth
            sx={{
              maxWidth: 600,
              mb: 3,
            }}
          >

            <InputLabel>
              Select Exam
            </InputLabel>


            <Select
              value={
                selectedReportExam
              }
              label="Select Exam"
              onChange={
                handleReportExamChange
              }
            >

              <MenuItem
                value=""
              >
                Select an Exam
              </MenuItem>


              {
                reportExams.map(
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
                        exam.total_attempts
                      }

                      {" attempts)"}

                    </MenuItem>

                  )
                )
              }

            </Select>

          </FormControl>


          {/* LOADING */}

          {
            examReportLoading && (

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


          {/* NO EXAM SELECTED */}

          {
            !selectedReportExam &&
            !examReportLoading && (

              <Alert
                severity="info"
              >
                Select an exam to view
                student reports.
              </Alert>

            )
          }


          {/* SELECTED EXAM DETAILS */}

          {
            examReportData &&
            !examReportLoading && (

              <>

                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor:
                      "#f5f5f5",
                    borderRadius: 2,
                  }}
                >

                  <Typography
                    variant="h6"
                  >
                    {
                      examReportData
                        .exam
                        ?.title
                    }
                  </Typography>


                  <Typography>
                    Subject:{" "}
                    {
                      examReportData
                        .exam
                        ?.subject
                    }
                  </Typography>


                  <Typography>
                    Total Marks:{" "}
                    {
                      examReportData
                        .exam
                        ?.total_marks
                    }
                  </Typography>


                  <Typography>
                    Total Attempts:{" "}
                    {
                      examReportData
                        .total_attempts ??
                      examReportData
                        .students
                        ?.length ??
                      0
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
                      minWidth: 950,
                    }}
                  >

                    <TableHead>

                      <TableRow>

                        <TableCell>
                          <b>
                            Attempt
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Student
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Email
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Score
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            AI Events
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            AI Points
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Tab Switches
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Risk
                          </b>
                        </TableCell>

                        <TableCell>
                          <b>
                            Date
                          </b>
                        </TableCell>

                        <TableCell
                          align="center"
                        >
                          <b>
                            Report
                          </b>
                        </TableCell>

                      </TableRow>

                    </TableHead>


                    <TableBody>

                      {
                        examReportData
                          .students
                          ?.map(
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
                                  #
                                  {
                                    student
                                      .attempt_id
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
                                      .student_email
                                  }
                                </TableCell>


                                <TableCell>

                                  <b>
                                    {
                                      student
                                        .score
                                    }

                                    {" / "}

                                    {
                                      student
                                        .total_marks
                                    }
                                  </b>

                                </TableCell>


                                <TableCell>
                                  {
                                    student
                                      .total_ai_events
                                  }
                                </TableCell>


                                <TableCell>

                                  <Typography
                                    color="error"
                                    fontWeight="bold"
                                  >
                                    {
                                      student
                                        .total_ai_points
                                    }
                                  </Typography>

                                </TableCell>


                                <TableCell>

                                  <Chip
                                    label={
                                      student
                                        .tab_switch_count
                                    }
                                    size="small"
                                    color={
                                      student
                                        .tab_switch_count >=
                                      3
                                        ? "error"
                                        : student
                                            .tab_switch_count >
                                          0
                                        ? "warning"
                                        : "success"
                                    }
                                  />

                                </TableCell>


                                <TableCell>

                                  <Chip
                                    label={
                                      student
                                        .risk_level
                                    }
                                    color={
                                      getRiskColor(
                                        student
                                          .risk_level
                                      )
                                    }
                                    size="small"
                                  />

                                </TableCell>


                                <TableCell>

                                  {
                                    student
                                      .submitted_at
                                      ? new Date(
                                          student
                                            .submitted_at
                                        ).toLocaleString()
                                      : "-"
                                  }

                                </TableCell>


                                <TableCell
                                  align="center"
                                >

                                  <Button
                                    variant="contained"
                                    size="small"
                                    disabled={
                                      downloadingAttempt ===
                                      student
                                        .attempt_id
                                    }
                                    onClick={
                                      () =>
                                        handleStudentPDF(
                                          student
                                        )
                                    }
                                  >

                                    {
                                      downloadingAttempt ===
                                      student
                                        .attempt_id
                                        ? "Downloading..."
                                        : "Download PDF"
                                    }

                                  </Button>

                                </TableCell>

                              </TableRow>

                            )
                          )
                      }


                      {
                        (
                          !examReportData
                            .students ||
                          examReportData
                            .students
                            .length ===
                            0
                        ) && (

                          <TableRow>

                            <TableCell
                              colSpan={
                                10
                              }
                              align="center"
                              sx={{
                                py: 4,
                              }}
                            >
                              No student attempts
                              found for this exam.
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
          SEARCH / GLOBAL EXPORT
      ===================================== */}

      <Card
        elevation={2}
        sx={{
          mb: 4,
        }}
      >

        <CardContent>

          <Typography
            variant="h6"
            sx={{
              mb: 2,
            }}
          >
            Search & Export
          </Typography>


          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems:
                "center",
            }}
          >

            <TextField
              label="Search AI Events"
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
              sx={{
                flex: 1,
                minWidth: 250,
              }}
            />


            <FormControl
              sx={{
                minWidth: 180,
              }}
            >

              <InputLabel>
                Risk Level
              </InputLabel>


              <Select
                value={
                  riskFilter
                }
                label="Risk Level"
                onChange={
                  (event) =>
                    setRiskFilter(
                      event.target.value
                    )
                }
              >

                <MenuItem
                  value="All"
                >
                  All
                </MenuItem>

                <MenuItem
                  value="Low"
                >
                  Low
                </MenuItem>

                <MenuItem
                  value="Medium"
                >
                  Medium
                </MenuItem>

                <MenuItem
                  value="High"
                >
                  High
                </MenuItem>

              </Select>

            </FormControl>


            <Button
              variant="contained"
              color="success"
              onClick={
                exportCSV
              }
              sx={{
                height: 56,
                minWidth: 140,
              }}
            >
              Export CSV
            </Button>


            <Button
              variant="contained"
              color="secondary"
              onClick={
                exportPDF
              }
              sx={{
                height: 56,
                minWidth: 140,
              }}
            >
              Export PDF
            </Button>


            <Button
              variant="contained"
              color="success"
              onClick={
                handleDownloadCSV
              }
              sx={{
                height: 56,
                minWidth: 190,
              }}
            >
              Download CSV Report
            </Button>

          </Box>

        </CardContent>

      </Card>


      {/* =====================================
          GLOBAL AI EVENT HISTORY
      ===================================== */}

      <Card
        elevation={3}
      >

        <CardContent>


          <Box
            sx={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              mb: 2,
              flexWrap:
                "wrap",
              gap: 1,
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
              Results:{" "}
              {
                filteredReports
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
                minWidth: 850,
              }}
            >

              <TableHead>

                <TableRow>

                  <TableCell>
                    <b>ID</b>
                  </TableCell>

                  <TableCell>
                    <b>
                      Attempt
                    </b>
                  </TableCell>

                  <TableCell>
                    <b>Event</b>
                  </TableCell>

                  <TableCell>
                    <b>Points</b>
                  </TableCell>

                  <TableCell>
                    <b>Risk</b>
                  </TableCell>

                  <TableCell>
                    <b>
                      Created At
                    </b>
                  </TableCell>

                </TableRow>

              </TableHead>


              <TableBody>

                {
                  filteredReports
                    .slice(
                      page *
                        rowsPerPage,
                      page *
                        rowsPerPage +
                        rowsPerPage
                    )
                    .map(
                      (report) => (

                        <TableRow
                          key={
                            report.id
                          }
                          hover
                        >

                          <TableCell>
                            {
                              report.id
                            }
                          </TableCell>


                          <TableCell>
                            {
                              report.attempt_id ||
                              "-"
                            }
                          </TableCell>


                          <TableCell>
                            {
                              report.event
                            }
                          </TableCell>


                          <TableCell>
                            {
                              report.points
                            }
                          </TableCell>


                          <TableCell>

                            <Chip
                              label={
                                report.risk
                              }
                              color={
                                getRiskColor(
                                  report.risk
                                )
                              }
                              size="small"
                            />

                          </TableCell>


                          <TableCell>

                            {
                              report.created_at
                                ? new Date(
                                    report.created_at
                                  ).toLocaleString()
                                : "-"
                            }

                          </TableCell>

                        </TableRow>

                      )
                    )
                }


                {
                  filteredReports
                    .length ===
                    0 && (

                    <TableRow>

                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{
                          py: 4,
                        }}
                      >
                        No AI Events Found
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
              filteredReports
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
              handleRowsPerPage
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


    </Container>
  );
}


export default AIReports;