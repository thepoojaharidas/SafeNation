// From AlertsScreen.js - PSI badge label logic
const getPsiLabel = (psiValue) => {
  if (psiValue === null || psiValue === undefined) return "Unknown";
  if (psiValue <= 50) return "Good";
  if (psiValue <= 100) return "Moderate";
  if (psiValue <= 200) return "Unhealthy";
  if (psiValue <= 300) return "Very Unhealthy";
  return "Hazardous";
};

// From TasksScreen.js - Readiness percentage calculation
const calculateReadiness = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
};

// From TasksScreen.js - Total points calculation
const calculateTotalPoints = (tasks) => {
  return tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.points, 0);
};

// From TasksScreen.js / HomeScreen.js - Streak calculation logic
const calculateStreak = (lastDate, currentCount, today) => {
  if (!lastDate) return 1;
  const diff = (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
  if (diff === 1) return currentCount + 1;
  if (diff === 0) return currentCount;
  return 1;
};

// From TasksScreen.js - Level data logic
const getLevelData = (points) => {
  if (points >= 80) return { level: 5, title: "Preparedness Pro" };
  if (points >= 60) return { level: 4, title: "Response Ready" };
  if (points >= 40) return { level: 3, title: "Safety Citizen" };
  if (points >= 20) return { level: 2, title: "Prepared Starter" };
  return { level: 1, title: "Safety Beginner" };
};

// From HomeScreen.js - Most common forecast
const getMostCommonForecast = (forecasts) => {
  if (!Array.isArray(forecasts) || forecasts.length === 0) return "Unavailable";
  const counts = forecasts.reduce((acc, item) => {
    const label = item?.forecast?.trim();
    if (!label) return acc;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "Unavailable";
};

// From TasksScreen.js - Daily mission rotation
const getDailyMission = (day, missions) => {
  const index = (day - 1) % missions.length;
  return missions[index];
};

// From notificationService.js - Environmental alert logic
const shouldSendPsiAlert = (psiValue) => {
  return psiValue !== null && psiValue !== undefined && psiValue > 100;
};

const shouldSendFloodAlert = (floodItems) => {
  return Array.isArray(floodItems) && floodItems.length > 0;
};

// ─── Tests ─────

describe("PSI Label Logic", () => {
  test("returns Good for PSI 30", () => {
    expect(getPsiLabel(30)).toBe("Good");
  });

  test("returns Moderate for PSI 75", () => {
    expect(getPsiLabel(75)).toBe("Moderate");
  });

  test("returns Unhealthy for PSI 150", () => {
    expect(getPsiLabel(150)).toBe("Unhealthy");
  });

  test("returns Very Unhealthy for PSI 250", () => {
    expect(getPsiLabel(250)).toBe("Very Unhealthy");
  });

  test("returns Hazardous for PSI 350", () => {
    expect(getPsiLabel(350)).toBe("Hazardous");
  });

  test("returns Unknown for null PSI", () => {
    expect(getPsiLabel(null)).toBe("Unknown");
  });
});

describe("Readiness Percentage Calculation", () => {
  test("returns 0% when no tasks completed", () => {
    const tasks = [{ completed: false }, { completed: false }];
    expect(calculateReadiness(tasks)).toBe(0);
  });

  test("returns 50% when half tasks completed", () => {
    const tasks = [
      { completed: true },
      { completed: true },
      { completed: false },
      { completed: false },
    ];
    expect(calculateReadiness(tasks)).toBe(50);
  });

  test("returns 100% when all tasks completed", () => {
    const tasks = [
      { completed: true },
      { completed: true },
      { completed: true },
    ];
    expect(calculateReadiness(tasks)).toBe(100);
  });

  test("returns 0 for empty task list", () => {
    expect(calculateReadiness([])).toBe(0);
  });
});

describe("Total Points Calculation", () => {
  test("returns 0 when no tasks completed", () => {
    const tasks = [
      { completed: false, points: 20 },
      { completed: false, points: 15 },
    ];
    expect(calculateTotalPoints(tasks)).toBe(0);
  });

  test("sums points of completed tasks only", () => {
    const tasks = [
      { completed: true, points: 20 },
      { completed: false, points: 15 },
      { completed: true, points: 10 },
    ];
    expect(calculateTotalPoints(tasks)).toBe(30);
  });

  test("returns full points when all tasks completed", () => {
    const tasks = [
      { completed: true, points: 20 },
      { completed: true, points: 15 },
      { completed: true, points: 25 },
    ];
    expect(calculateTotalPoints(tasks)).toBe(60);
  });
});

describe("Streak Calculation Logic", () => {
  test("returns 1 for first ever completion", () => {
    expect(calculateStreak(null, 0, "2025-01-02")).toBe(1);
  });

  test("increments streak when completed on consecutive day", () => {
    expect(calculateStreak("2025-01-01", 3, "2025-01-02")).toBe(4);
  });

  test("keeps streak the same when completed same day", () => {
    expect(calculateStreak("2025-01-01", 3, "2025-01-01")).toBe(3);
  });

  test("resets streak to 1 when a day is missed", () => {
    expect(calculateStreak("2025-01-01", 5, "2025-01-05")).toBe(1);
  });
});

describe("Level Data Logic", () => {
  test("returns Level 1 Safety Beginner for 0 points", () => {
    expect(getLevelData(0)).toEqual({ level: 1, title: "Safety Beginner" });
  });

  test("returns Level 2 Prepared Starter for 20 points", () => {
    expect(getLevelData(20)).toEqual({ level: 2, title: "Prepared Starter" });
  });

  test("returns Level 5 Preparedness Pro for 80 points", () => {
    expect(getLevelData(80)).toEqual({ level: 5, title: "Preparedness Pro" });
  });
});

describe("Most Common Forecast Logic", () => {
  test("returns most frequent forecast", () => {
    const forecasts = [
      { forecast: "Cloudy" },
      { forecast: "Cloudy" },
      { forecast: "Sunny" },
    ];
    expect(getMostCommonForecast(forecasts)).toBe("Cloudy");
  });

  test("returns Unavailable for empty array", () => {
    expect(getMostCommonForecast([])).toBe("Unavailable");
  });

  test("returns Unavailable for non-array input", () => {
    expect(getMostCommonForecast(null)).toBe("Unavailable");
  });
});

describe("Daily Mission Rotation", () => {
  const missions = [
    { id: 101, title: "Quick Safety Check" },
    { id: 102, title: "Emergency Contacts Recall" },
    { id: 103, title: "Flood Safety Check" },
  ];

  test("returns first mission on day 1", () => {
    expect(getDailyMission(1, missions)).toEqual({
      id: 101,
      title: "Quick Safety Check",
    });
  });

  test("returns second mission on day 2", () => {
    expect(getDailyMission(2, missions)).toEqual({
      id: 102,
      title: "Emergency Contacts Recall",
    });
  });

  test("rotates back to first mission after last", () => {
    expect(getDailyMission(4, missions)).toEqual({
      id: 101,
      title: "Quick Safety Check",
    });
  });
});

describe("Environmental Alert Logic", () => {
  test("sends PSI alert when PSI is above 100", () => {
    expect(shouldSendPsiAlert(150)).toBe(true);
  });

  test("does not send PSI alert when PSI is 100 or below", () => {
    expect(shouldSendPsiAlert(57)).toBe(false);
  });

  test("does not send PSI alert for null PSI value", () => {
    expect(shouldSendPsiAlert(null)).toBe(false);
  });

  test("sends flood alert when flood items are present", () => {
    expect(shouldSendFloodAlert([{ name: "Bukit Timah" }])).toBe(true);
  });

  test("does not send flood alert when no flood items", () => {
    expect(shouldSendFloodAlert([])).toBe(false);
  });

  test("does not send flood alert for non-array input", () => {
    expect(shouldSendFloodAlert(null)).toBe(false);
  });
});
