import { useEffect, useMemo, useState } from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Chip,
  CircularProgress,
  Grid,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TablePagination,
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
  LineChart,
  Line,
} from "recharts";

import { useNavigate } from "react-router-dom";

import {
  getAdvancedAnalytics,
} from "../../services/advancedAnalyticsService";

// ==========================================
// STANDARD ATTEMPT RISK
// ==========================================

const getAttemptRisk = (points) => {
  const score = Number(points || 0);

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

function AdvancedAnalytics() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] =
    useState(10);

  // ==========================================
  // NORMALIZE RISK USING CURRENT THRESHOLDS
  // ==========================================

  const normalizedReports =
  useMemo(() => {

    return reports.map(
      (report) => ({

        ...report,

        risk_level:
          getAttemptRisk(
            report.total_points
          ),
      })
    );

  }, [reports]);


  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadReports = async () => {
    try {
      const data =
        await getAdvancedAnalytics();

      setReports(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadReports();

    const interval = setInterval(() => {
      loadReports();
    }, 30000);

    return () =>
      clearInterval(interval);
  }, []);


  // ==========================================
  // FILTER DATA
  // ==========================================

  const filteredReports = useMemo(() => {
    return normalizedReports.filter((report) => {
      const student =
        report.student_name || "";

      const exam =
        report.exam_title || "";

      const searchText =
        search.toLowerCase();

      const matchesSearch =
        student
          .toLowerCase()
          .includes(searchText) ||
        exam
          .toLowerCase()
          .includes(searchText);

      const matchesRisk =
        riskFilter === "All" ||
        report.risk_level ===
          riskFilter;

      const reportDate =
        new Date(report.created_at);

      const matchesFrom =
        !fromDate ||
        reportDate >=
          new Date(
            `${fromDate}T00:00:00`
          );

      const matchesTo =
        !toDate ||
        reportDate <=
          new Date(
            `${toDate}T23:59:59`
          );

      return (
        matchesSearch &&
        matchesRisk &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    normalizedReports,
    search,
    riskFilter,
    fromDate,
    toDate,
  ]);


  useEffect(() => {
    setPage(0);
  }, [
    search,
    riskFilter,
    fromDate,
    toDate,
  ]);


  // ==========================================
  // SUMMARY VALUES
  // ==========================================

  const totalAIPoints =
    filteredReports.reduce(
      (sum, report) =>
        sum +
        Number(
          report.total_points || 0
        ),
      0
    );


  const totalAIEvents =
    filteredReports.reduce(
      (sum, report) =>
        sum +
        Number(
          report.total_events || 0
        ),
      0
    );


  const averageAIPoints =
    filteredReports.length > 0
      ? Number(
          (
            totalAIPoints /
            filteredReports.length
          ).toFixed(2)
        )
      : 0;


  const averageAIEvents =
    filteredReports.length > 0
      ? Number(
          (
            totalAIEvents /
            filteredReports.length
          ).toFixed(2)
        )
      : 0;


  const averageScore =
    filteredReports.length > 0
      ? Number(
          (
            filteredReports.reduce(
              (sum, report) =>
                sum +
                Number(
                  report.score || 0
                ),
              0
            ) /
            filteredReports.length
          ).toFixed(2)
        )
      : 0;


  const criticalRisk =
    filteredReports.filter(
      (report) =>
        report.risk_level ===
        "Critical"
    ).length;


  const highRisk =
    filteredReports.filter(
      (report) =>
        report.risk_level ===
        "High"
    ).length;


  const mediumRisk =
    filteredReports.filter(
      (report) =>
        report.risk_level ===
        "Medium"
    ).length;


  const warningRisk =
    filteredReports.filter(
      (report) =>
        report.risk_level ===
        "Warning"
    ).length;


  const lowRisk =
    filteredReports.filter(
      (report) =>
        report.risk_level ===
        "Low"
    ).length;


  // ==========================================
  // RISK CHART
  // ==========================================

  const riskChart = [
    {
      name: "Critical",
      value: criticalRisk,
    },
    {
      name: "High",
      value: highRisk,
    },
    {
      name: "Medium",
      value: mediumRisk,
    },
    {
      name: "Warning",
      value: warningRisk,
    },
    {
      name: "Low",
      value: lowRisk,
    },
  ];


  const COLORS = [
    "#b71c1c",
    "#f44336",
    "#ff9800",
    "#ffc107",
    "#4caf50",
  ];


  const totalForRisk =
    filteredReports.length || 1;


    const riskPercentage = {

      critical:
        Math.round(
          (
            criticalRisk *
            100
          ) /
          totalForRisk
        ),
      high:
        Math.round(
          (
            highRisk *
            100
          ) /
          totalForRisk
        ),
      medium:
        Math.round(
          (
            mediumRisk *
            100
          ) /
          totalForRisk
        ),
      warning:
        Math.round(
          (
            warningRisk *
            100
          ) /
          totalForRisk
        ),
      low:
        Math.round(
          (
            lowRisk *
            100
          ) /
          totalForRisk
        ),
    };


  // ==========================================
  // EXAM-WISE POINTS
  // ==========================================

  const examChart = useMemo(() => {
    const grouped = {};

    filteredReports.forEach(
      (report) => {
        const exam =
          report.exam_title ||
          "Unknown Exam";

        grouped[exam] =
          (grouped[exam] || 0) +
          Number(
            report.total_points || 0
          );
      }
    );

    return Object.entries(
      grouped
    ).map(([exam, points]) => ({
      exam,
      points,
    }));
  }, [filteredReports]);


  // ==========================================
  // STUDENT-WISE POINTS
  // ==========================================

  const studentChart = useMemo(() => {
    const grouped = {};

    filteredReports.forEach(
      (report) => {
        const student =
          report.student_name ||
          "Unknown";

        grouped[student] =
          (grouped[student] ||
            0) +
          Number(
            report.total_points || 0
          );
      }
    );

    return Object.entries(
      grouped
    ).map(
      ([student, points]) => ({
        student,
        points,
      })
    );
  }, [filteredReports]);


  // ==========================================
  // TREND DATA
  // ==========================================

  const trendData = useMemo(() => {
    return [...filteredReports]
      .sort(
        (a, b) =>
          a.attempt_id -
          b.attempt_id
      )
      .map((report) => ({
        attempt:
          report.attempt_id,
        points:
          report.total_points,
      }));
  }, [filteredReports]);


  // ==========================================
  // TOP SUSPICIOUS STUDENTS
  // ==========================================

  const topStudents =
    useMemo(() => {

      const grouped = {};


      filteredReports.forEach(
        (report) => {

          const name =
            report.student_name ||
            "Unknown";


          if (!grouped[name]) {

            grouped[name] = {

              student_name:
                name,

              total_points:
                0,

              attempts:
                0,
            };
          }


          grouped[name]
            .total_points +=
            Number(
              report.total_points ||
              0
            );


          grouped[name]
            .attempts += 1;
        }
      );


      return Object.values(
        grouped
      )
        .map(
          (student) => ({

            ...student,

            risk_level:
              getAttemptRisk(
                student.total_points
              ),
          })
        )
        .sort(
          (a, b) =>
            b.total_points -
            a.total_points
        )
        .slice(
          0,
          5
        );

    }, [filteredReports]);


  // ==========================================
  // EXPORT CSV
  // ==========================================

  const exportCSV = () => {
    const rows = [
      [
        "Attempt ID",
        "Student",
        "Exam",
        "Score",
        "AI Events",
        "AI Points",
        "Risk Level",
      ],
    ];

    filteredReports.forEach(
      (report) => {
        rows.push([
          report.attempt_id,
          report.student_name,
          report.exam_title,
          report.score,
          report.total_events,
          report.total_points,
          report.risk_level,
        ]);
      }
    );

    const csvContent = rows
      .map((row) =>
        row.join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "advanced_analytics.csv";

    link.click();

    URL.revokeObjectURL(url);
  };


  // ==========================================
  // EXPORT PDF
  // ==========================================

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "Advanced Analytics Report",
      14,
      20
    );

    autoTable(doc, {
      head: [
        [
          "Attempt",
          "Student",
          "Exam",
          "Score",
          "Events",
          "Points",
          "Risk",
        ],
      ],

      body:
        filteredReports.map(
          (report) => [
            report.attempt_id,
            report.student_name,
            report.exam_title,
            report.score,
            report.total_events,
            report.total_points,
            report.risk_level,
          ]
        ),

      startY: 30,
    });

    doc.save(
      "Advanced_Analytics_Report.pdf"
    );
  };


  // ==========================================
  // PAGINATION
  // ==========================================

  const handleChangePage = (
    event,
    newPage
  ) => {
    setPage(newPage);
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
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <Container
        sx={{
          mt: 5,
          textAlign: "center",
        }}
      >
        <CircularProgress />
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

      {/* HEADER */}

      <Box
        sx={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          mb: 4,
          gap: 2,
          flexWrap: "wrap",
        }}
      >

        <Typography
          variant="h4"
          fontWeight="bold"
        >
          Advanced Student Analytics
        </Typography>


        <Button
          variant="contained"
          onClick={loadReports}
        >
          Refresh Analytics
        </Button>

      </Box>


      {/* SUMMARY CARDS */}

      <Grid
        container
        spacing={3}
        sx={{ mb: 4 }}
      >
        {[
          {
            title:
              "Total Attempts",

            value:
              filteredReports.length,

            color:
              "primary",
          },

          {
            title:
              "Critical Risk",

            value:
              criticalRisk,

            color:
              "error",
          },

          {
            title:
              "High Risk",

            value:
              highRisk,

            color:
              "error",
          },

          {
            title:
              "Medium Risk",

            value:
              mediumRisk,

            color:
              "warning.main",
          },

          {
            title:
              "Warning",

            value:
              warningRisk,

            color:
              "warning.main",
          },

          {
            title:
              "Low Risk",

            value:
              lowRisk,

            color:
              "success.main",
          },

          {
            title:
              "Average Score",

            value:
              averageScore,

            color:
              "primary",
          },
        ].map((item) => (
          <Grid
            key={item.title}
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
                  {item.title}
                </Typography>

                <Typography
                  variant="h3"
                  color={item.color}
                  fontWeight="bold"
                  sx={{ mt: 1 }}
                >
                  {item.value}
                </Typography>

              </CardContent>

            </Card>

          </Grid>

        ))}

      </Grid>

      {/* CHARTS ROW 1 */}

      <Grid
        container
        spacing={3}
        sx={{ mb: 4 }}
      >
        {/* RISK */}

        <Grid
          size={{
            xs: 12,
            md: 4,
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
                Risk Distribution
              </Typography>

              <Box
                sx={{
                  height: 330,
                }}
              >

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>

                    <Pie
                      data={riskChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={95}
                      innerRadius={40}
                      label
                    >

                      {riskChart.map(
                        (
                          entry,
                          index
                        ) => (

                          <Cell
                            key={index}
                            fill={
                              COLORS[
                                index
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

              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-around",
                  flexWrap: "wrap",
                  gap: 2,
                  mt: 1,
                }}
              >

                <Typography>
                  Critical:{" "}
                  {
                    riskPercentage
                      .critical
                  }
                  %
                </Typography>


                <Typography>
                  High:{" "}
                  {
                    riskPercentage
                      .high
                  }
                  %
                </Typography>


                <Typography>
                  Medium:{" "}
                  {
                    riskPercentage
                      .medium
                  }
                  %
                </Typography>

                <Typography>
                  Warning:{" "}
                  {
                    riskPercentage
                      .warning
                  }
                  %
                </Typography>

                <Typography>
                  Low:{" "}
                  {
                    riskPercentage
                      .low
                  }
                  %
                </Typography>

              </Box>
            </CardContent>

          </Card>

        </Grid>

        {/* EXAM POINTS */}

        <Grid
          size={{
            xs: 12,
            md: 8,
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
                Exam Wise Suspicious Points
              </Typography>

              <Box
                sx={{
                  height: 360,
                }}
              >

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={examChart}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 50,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="exam"
                      angle={-20}
                      textAnchor="end"
                      height={80}
                    />

                    <YAxis />

                    <Tooltip />

                    <Bar
                      dataKey="points"
                      fill="#1976d2"
                      name="Suspicious Points"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </Box>

            </CardContent>

          </Card>

        </Grid>

      </Grid>


      {/* STUDENT POINTS */}

      <Card
        elevation={3}
        sx={{ mb: 4 }}
      >

        <CardContent>

          <Typography
            variant="h5"
            sx={{ mb: 2 }}
          >
            Student Wise Suspicious Points
          </Typography>


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
                data={studentChart}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="student"
                />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="points"
                  fill="#ff9800"
                  name="Suspicious Points"
                />

              </BarChart>

            </ResponsiveContainer>

          </Box>

        </CardContent>

      </Card>


      {/* FILTERS */}

      <Card
        elevation={3}
        sx={{ mb: 4 }}
      >

        <CardContent>

          <Typography
            variant="h5"
            sx={{ mb: 2 }}
          >
            Search & Filters
          </Typography>


          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >

            <TextField
              label="Search Student or Exam"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              sx={{
                flex: 1,
                minWidth: 240,
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
                value={riskFilter}
                label="Risk Level"
                onChange={(e) =>
                  setRiskFilter(
                    e.target.value
                  )
                }
              >

                <MenuItem value="All">
                  All
                </MenuItem>

                <MenuItem value="Low">
                  Low
                </MenuItem>

                <MenuItem value="Warning">
                  Warning
                </MenuItem>

                <MenuItem value="Medium">
                  Medium
                </MenuItem>

                <MenuItem value="High">
                  High
                </MenuItem>

                <MenuItem value="Critical">
                  Critical
                </MenuItem>

              </Select>

            </FormControl>


            <TextField
              label="From"
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(
                  e.target.value
                )
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />


            <TextField
              label="To"
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(
                  e.target.value
                )
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />


            <Button
              variant="outlined"
              color="secondary"
              sx={{ height: 56 }}
              onClick={() => {
                setSearch("");
                setRiskFilter("All");
                setFromDate("");
                setToDate("");
              }}
            >
              Clear Filters
            </Button>

          </Box>


          {/* FILTER SUMMARY */}

          <Grid
            container
            spacing={2}
            sx={{ mt: 2 }}
          >

            {[
              [
                "Showing Attempts",
                filteredReports.length,
              ],

              [
                "Total AI Points",
                totalAIPoints,
              ],

              [
                "Total AI Events",
                totalAIEvents,
              ],

              [
                "Average AI Points",
                averageAIPoints,
              ],

              [
                "Average AI Events",
                averageAIEvents,
              ],

              [
                "Average Score",
                averageScore,
              ],
            ].map(
              ([label, value]) => (

                <Grid
                  key={label}
                  size={{
                    xs: 6,
                    sm: 4,
                    md: 2,
                  }}
                >

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign:
                        "center",
                    }}
                  >

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {label}
                    </Typography>

                    <Typography
                      variant="h6"
                      fontWeight="bold"
                    >
                      {value}
                    </Typography>

                  </Paper>

                </Grid>

              )
            )}

          </Grid>


          <Box
            sx={{
              display: "flex",
              gap: 2,
              mt: 3,
              flexWrap: "wrap",
            }}
          >

            <Button
              variant="contained"
              color="success"
              onClick={exportCSV}
            >
              Export CSV
            </Button>


            <Button
              variant="contained"
              color="secondary"
              onClick={exportPDF}
            >
              Export PDF
            </Button>

          </Box>

        </CardContent>

      </Card>


      {/* ATTEMPT TABLE */}

      <Card
        elevation={3}
        sx={{ mb: 4 }}
      >

        <CardContent>

          <Box
            sx={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              flexWrap: "wrap",
              gap: 1,
              mb: 2,
            }}
          >

            <Typography variant="h5">
              Exam Attempt Analytics
            </Typography>

            <Typography
              color="text.secondary"
            >
              Results:{" "}
              {filteredReports.length}
            </Typography>

          </Box>


          <TableContainer>

            <Table
              sx={{
                minWidth: 900,
              }}
            >

              <TableHead>

                <TableRow>

                  <TableCell>
                    <b>Attempt</b>
                  </TableCell>

                  <TableCell>
                    <b>Student</b>
                  </TableCell>

                  <TableCell>
                    <b>Exam</b>
                  </TableCell>

                  <TableCell>
                    <b>Score</b>
                  </TableCell>

                  <TableCell>
                    <b>AI Events</b>
                  </TableCell>

                  <TableCell>
                    <b>Points</b>
                  </TableCell>

                  <TableCell>
                    <b>Risk</b>
                  </TableCell>

                  <TableCell>
                    <b>Action</b>
                  </TableCell>

                </TableRow>

              </TableHead>


              <TableBody>

                {filteredReports
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
                          report.attempt_id
                        }
                        hover
                      >

                        <TableCell>
                          {
                            report.attempt_id
                          }
                        </TableCell>

                        <TableCell>
                          {
                            report.student_name
                          }
                        </TableCell>

                        <TableCell>
                          {
                            report.exam_title
                          }
                        </TableCell>

                        <TableCell>
                          {
                            report.score
                          }
                        </TableCell>

                        <TableCell>
                          {
                            report.total_events
                          }
                        </TableCell>

                        <TableCell>
                          {
                            report.total_points
                          }
                        </TableCell>

                        <TableCell>

                        <Chip
                          label={
                            report.risk_level
                          }
                          color={
                            getRiskColor(
                              report.risk_level
                            )
                          }
                          size="small"
                        />

                        </TableCell>


                        <TableCell>

                          <Button
                            size="small"
                            onClick={() =>
                              navigate(
                                `/admin/attempt/${report.attempt_id}`
                              )
                            }
                          >
                            View
                          </Button>

                        </TableCell>

                      </TableRow>

                    )
                  )}


                {filteredReports.length ===
                  0 && (

                  <TableRow>

                    <TableCell
                      colSpan={8}
                      align="center"
                      sx={{ py: 4 }}
                    >
                      No analytics records found.
                    </TableCell>

                  </TableRow>

                )}

              </TableBody>

            </Table>

          </TableContainer>


          <TablePagination
            component="div"
            count={
              filteredReports.length
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


      {/* TREND */}

      <Card
        elevation={3}
        sx={{ mb: 4 }}
      >

        <CardContent>

          <Typography
            variant="h5"
            sx={{ mb: 2 }}
          >
            Suspicious Points Trend
          </Typography>


          <Box
            sx={{
              height: 350,
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={trendData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="attempt"
                  minTickGap={25}
                  interval="preserveStartEnd"
                />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="#1976d2"
                  name="Suspicious Points"
                  dot={false}
                  activeDot={{
                    r: 5,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </Box>

        </CardContent>

      </Card>


      {/* TOP SUSPICIOUS STUDENTS */}

      <Card elevation={3}>

        <CardContent>

          <Typography
            variant="h5"
            sx={{ mb: 2 }}
          >
            Top Suspicious Students
          </Typography>


          <Table>

            <TableHead>

              <TableRow>

                <TableCell>
                  <b>Rank</b>
                </TableCell>

                <TableCell>
                  <b>Student</b>
                </TableCell>

                <TableCell>
                  <b>Total Points</b>
                </TableCell>

                <TableCell>
                  <b>Attempts</b>
                </TableCell>

                <TableCell>
                  <b>Risk</b>
                </TableCell>

              </TableRow>

            </TableHead>


            <TableBody>

              {topStudents.map(
                (student, index) => (

                  <TableRow
                    key={
                      student.student_name
                    }
                    hover
                  >

                    <TableCell>
                      {index + 1}
                    </TableCell>

                    <TableCell>
                      {
                        student.student_name
                      }
                    </TableCell>

                    <TableCell>
                      {
                        student.total_points
                      }
                    </TableCell>

                    <TableCell>
                      {
                        student.attempts
                      }
                    </TableCell>

                    <TableCell>

                    <Chip
                      label={
                        student.risk_level
                      }
                      color={
                        getRiskColor(
                          student.risk_level
                        )
                      }
                      size="small"
                    />

                    </TableCell>

                  </TableRow>

                )
              )}

            </TableBody>

          </Table>

        </CardContent>

      </Card>

    </Container>
  );
}


export default AdvancedAnalytics;