import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 15000,
  withCredentials: false,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg = error?.response?.data?.details?.message || error?.response?.data?.error || null;
    if (msg) error.message = msg;
    const code = error?.response?.data?.code || null;
    const status = error?.response?.status || null;
    if ((status === 401 || status === 403) && (code === "ACCOUNT_SUSPENDED" || code === "ACCOUNT_NOT_FOUND")) {
      try {
        window.dispatchEvent(new CustomEvent("auth:force-logout", { detail: { code } }));
      } catch {
        const _IGNORE = 0;
      }
    }
    return Promise.reject(error);
  },
);

export async function createUserRole(userId, { email } = {}) {
  const safeRole = "user";
  const res = await api.post("/create-role", { userId, role: safeRole, email: email || null });
  return res.data;
}

export async function getUserRole(userId) {
  const res = await api.get(`/user-role/${userId}`);
  return res.data?.role || null;
}

export async function getProfile(userId) {
  const res = await api.get(`/profile/${userId}`);
  return {
    profile: res.data?.profile || null,
    role: res.data?.role || null,
  };
}

export async function updateProfile(userId, { fullName, bio }) {
  const res = await api.put(`/profile/${userId}`, { fullName, bio });
  return res.data?.profile || null;
}

export async function getUserSkills(userId) {
  const res = await api.get(`/user-skills/${userId}`);
  return res.data?.skills || [];
}

export async function addUserSkill(userId, { name, category, skillType, proficiency }) {
  const res = await api.post("/user-skills", {
    userId,
    name,
    category,
    skillType,
    proficiency,
  });
  return res.data?.userSkill || null;
}

export async function removeUserSkill(userId, skillId) {
  const res = await api.delete(`/user-skills/${userId}/${skillId}`);
  return res.data;
}

export async function exploreSkills({ category, skillType, search, proficiency, sort } = {}) {
  const params = {};
  if (category) params.category = category;
  if (skillType) params.skillType = skillType;
  if (search) params.search = search;
  if (proficiency) params.proficiency = proficiency;
  if (sort) params.sort = sort;
  const res = await api.get("/explore-skills", { params });
  return res.data?.results || [];
}

export async function createLearningRequest({
  learnerId,
  teacherId,
  userSkillId,
  message,
  preferredDate,
  preferredStartTime,
  durationMinutes,
  exchangeType,
  offeredSkillId,
  offeredCreditAmount,
}) {
  const res = await api.post("/requests", {
    learnerId,
    teacherId,
    userSkillId,
    message,
    preferredDate,
    preferredStartTime,
    durationMinutes,
    exchangeType,
    offeredSkillId,
    offeredCreditAmount,
  });
  return res.data?.request || null;
}

export async function getSentRequests(userId) {
  const res = await api.get("/requests/sent", { params: { userId } });
  return res.data?.requests || [];
}

export async function getReceivedRequests(userId) {
  const res = await api.get("/requests/received", { params: { userId } });
  return res.data?.requests || [];
}

export async function acceptRequest(requestId, { teacherId } = {}) {
  const res = await api.put(`/requests/${requestId}/accept`, { teacherId });
  return res.data;
}

export async function rejectRequest(requestId, { teacherId } = {}) {
  const res = await api.put(`/requests/${requestId}/reject`, { teacherId });
  return res.data;
}

export async function getSessions(userId) {
  const res = await api.get("/sessions", { params: { userId } });
  return res.data?.sessions || [];
}

export async function getNotificationsUnreadCount(userId) {
  const res = await api.get("/notifications/unread-count", { params: { userId } });
  return res.data?.unreadCount ?? 0;
}

export async function getNotifications(userId, { limit, offset, unreadOnly } = {}) {
  const res = await api.get("/notifications", { params: { userId, limit, offset, unreadOnly } });
  return res.data?.notifications || [];
}

export async function markNotificationsSeen(userId) {
  const res = await api.put("/notifications/mark-seen", { userId });
  return res.data;
}

export async function markNotificationRead(userId, notificationId) {
  const res = await api.put(`/notifications/${notificationId}/read`, { userId });
  return res.data;
}

export async function getConversations(userId, { search, limit } = {}) {
  const res = await api.get("/messages/conversations", {
    params: { userId, search, limit },
  });
  return res.data?.conversations || [];
}

export async function getThread(userId, otherUserId, { limit } = {}) {
  const res = await api.get("/messages/thread", {
    params: { userId, otherUserId, limit },
  });
  return res.data?.messages || [];
}

export async function sendMessage({ senderId, receiverId, messageText, requestId, sessionId }) {
  const res = await api.post("/messages", {
    senderId,
    receiverId,
    messageText,
    requestId,
    sessionId,
  });
  return res.data?.message || null;
}

export async function markThreadRead(userId, otherUserId) {
  const res = await api.put("/messages/mark-read", { userId, otherUserId });
  return res.data;
}

export async function getMessagesUnreadCount(userId) {
  const res = await api.get("/messages/unread-count", { params: { userId } });
  return res.data?.unreadCount ?? 0;
}

export async function getWalletSummary(userId) {
  const res = await api.get("/wallet/summary", { params: { userId } });
  return res.data?.summary || null;
}

export async function getWalletTransactions(userId, { type, limit } = {}) {
  const res = await api.get("/wallet/transactions", { params: { userId, type, limit } });
  return res.data?.transactions || [];
}

export async function createReview({ sessionId, reviewerId, reviewedUserId, rating, comment }) {
  const res = await api.post("/reviews", { sessionId, reviewerId, reviewedUserId, rating, comment });
  return res.data?.review || null;
}

export async function getReviewsForUser(userId, { limit } = {}) {
  const res = await api.get(`/reviews/user/${userId}`, { params: { limit } });
  return res.data?.reviews || [];
}

export async function getReputationStats(userId) {
  const res = await api.get(`/reviews/stats/${userId}`);
  return res.data?.stats || null;
}

export async function getPendingReviews(userId) {
  const res = await api.get("/pending-reviews", { params: { userId } });
  return res.data?.pending || [];
}

export async function hasPendingReviews(userId) {
  const res = await api.get("/pending-reviews/exists", { params: { userId } });
  return Boolean(res.data?.pending);
}

export async function getAdminStats(userId) {
  const res = await api.get("/admin/stats", { params: { userId } });
  return res.data?.stats || null;
}

export async function getAdminUsers(userId, { search, limit, offset } = {}) {
  const res = await api.get("/admin/users", { params: { userId, search, limit, offset } });
  return res.data?.users || [];
}

export async function adminSetUserRole(adminUserId, targetUserId, role) {
  const res = await api.put(`/admin/users/${targetUserId}/role`, { userId: adminUserId, role });
  return res.data?.user || null;
}

export async function adminSetUserSuspended(adminUserId, targetUserId, suspended) {
  const res = await api.put(`/admin/users/${targetUserId}/status`, { userId: adminUserId, suspended });
  return res.data?.user || null;
}

export async function adminDeleteUser(adminUserId, targetUserId) {
  const res = await api.delete(`/admin/users/${targetUserId}`, { data: { userId: adminUserId } });
  return res.data;
}

export async function getAdminSkills(userId, { search, limit } = {}) {
  const res = await api.get("/admin/skills", { params: { userId, search, limit } });
  return res.data?.skills || [];
}

export async function getAdminDuplicateSkills(userId) {
  const res = await api.get("/admin/skills/duplicates", { params: { userId } });
  return res.data?.duplicates || [];
}

export async function adminDeleteSkill(adminUserId, skillId) {
  const res = await api.delete(`/admin/skills/${skillId}`, { data: { userId: adminUserId } });
  return res.data;
}

export async function adminMergeSkills(adminUserId, { fromSkillId, toSkillId }) {
  const res = await api.post("/admin/skills/merge", { userId: adminUserId, fromSkillId, toSkillId });
  return res.data;
}

export async function getAdminSessions(userId, { filter, limit } = {}) {
  const res = await api.get("/admin/sessions", { params: { userId, filter, limit } });
  return res.data?.sessions || [];
}

export async function getAdminReports(userId, { limit } = {}) {
  const res = await api.get("/admin/reports", { params: { userId, limit } });
  return res.data?.reports || null;
}

export default api;
