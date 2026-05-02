export type AttendanceRecord = {
  status: "PRESENT" | "ABSENT" | "EXCUSED";
};

const presentStatuses = new Set(["PRESENT", "EXCUSED"]);

export const summarizeAttendance = (records: AttendanceRecord[]) => {
  const total = records.length;
  const present = records.filter((record) => presentStatuses.has(record.status))
    .length;
  const percent = total ? Math.round((present / total) * 1000) / 10 : 0;

  return {
    total,
    present,
    percent,
  };
};
