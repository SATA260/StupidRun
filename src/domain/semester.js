export function buildSemesterStats(userInfo = {}, runInfo = {}, runStandard = {}, activityInfo = {}) {
  const user = userInfo || {};
  const run = runInfo || {};
  const standard = runStandard || {};
  const activity = activityInfo || {};

  const completedActivities = Number(activity.joinNum || 0);
  const totalActivities = Number(activity.totalNum || 0);

  const totalRequiredRuns =
    user.gender === '1'
      ? Number(standard.boyAllRunTime || 0)
      : user.gender === '2'
        ? Number(standard.girlAllRunTime || 0)
        : 0;
  const completedRuns = Number(run.runValidCount || 0);

  const totalDistanceMeters = Number(run.runValidDistance || 0);
  const totalDistanceKm = (Math.floor((totalDistanceMeters / 1000) * 10) / 10).toFixed(1);
  const targetDistanceKm =
    user.gender === '1'
      ? (Number(standard.boyAllRunDistance || 0) / 1000).toFixed(1)
      : user.gender === '2'
        ? (Number(standard.girlAllRunDistance || 0) / 1000).toFixed(1)
        : '0.0';
  const targetDistanceNumber = Number(targetDistanceKm);
  const currentDistanceNumber = Number(totalDistanceKm);
  const distancePercentage = targetDistanceNumber
    ? Math.min(100, (currentDistanceNumber / targetDistanceNumber) * 100)
    : 0;

  const semYear = String(standard.semesterYear || '');
  const semesterFlag = semYear.slice(-1);
  const semesterEndDateText =
    semesterFlag === '1'
      ? standard.firstSemesterDateEnd || ''
      : semesterFlag === '2'
        ? standard.secondSemesterDateEnd || ''
        : '';

  return {
    semesterEndDateText,
    completedActivities,
    totalActivities,
    completedRuns,
    totalRequiredRuns,
    totalDistanceKm,
    targetDistanceKm: targetDistanceNumber > 0 ? targetDistanceKm : '0',
    distancePercentage,
  };
}
