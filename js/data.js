/* =========================================================
   数据层：localStorage 持久化 + 行程数据模型
   ========================================================= */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'tripplanner_data_v1';

  // 默认空数据结构
  function emptyState() {
    return { trips: [], version: 1 };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.trips)) return emptyState();
      return parsed;
    } catch (e) {
      console.warn('数据读取失败，重置为空', e);
      return emptyState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('保存失败', e);
    }
  }

  // ---------- ID 生成 ----------
  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- 日期工具 ----------
  function parseDate(str) {
    if (!str) return null;
    const d = new Date(str + 'T00:00:00');
    return isNaN(d) ? null : d;
  }
  function fmtDate(d) {
    if (!d) return '';
    const dt = d instanceof Date ? d : parseDate(d);
    if (!dt) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function fmtDateCn(str) {
    const d = parseDate(str);
    if (!d) return '';
    const weeks = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 周${weeks[d.getDay()]}`;
  }
  function daysBetween(start, end) {
    const s = parseDate(start), e = parseDate(end);
    if (!s || !e) return 0;
    return Math.round((e - s) / 86400000) + 1;
  }
  function addDays(str, n) {
    const d = parseDate(str);
    if (!d) return '';
    d.setDate(d.getDate() + n);
    return fmtDate(d);
  }
  function todayStr() { return fmtDate(new Date()); }

  // 生成日期区间内的所有日期
  function dateRange(start, end) {
    const out = [];
    const n = daysBetween(start, end);
    for (let i = 0; i < n; i++) out.push(addDays(start, i));
    return out;
  }

  // ---------- 行程 CRUD ----------
  function listTrips() {
    return state.trips.slice().sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }

  function getTrip(id) {
    return state.trips.find(t => t.id === id) || null;
  }

  function createTrip(data) {
    const trip = {
      id: uid('trip'),
      name: data.name || '未命名行程',
      destination: data.destination || '',
      startDate: data.startDate || todayStr(),
      endDate: data.endDate || data.startDate || todayStr(),
      coverColor: data.coverColor || 0,
      emoji: data.emoji || '🧳',
      members: data.members && data.members.length
        ? data.members.map(n => ({ id: uid('m'), name: n }))
        : [{ id: uid('m'), name: '我' }],
      currency: data.currency || 'CNY',
      days: [],
      checklist: [],
      splits: [], // 自定义分摊记录
      createdAt: Date.now()
    };
    rebuildDays(trip);
    state.trips.push(trip);
    save();
    return trip;
  }

  function updateTrip(id, patch) {
    const trip = getTrip(id);
    if (!trip) return null;
    const datesChanged = (patch.startDate && patch.startDate !== trip.startDate) ||
                         (patch.endDate && patch.endDate !== trip.endDate);
    Object.assign(trip, patch);
    if (datesChanged) rebuildDays(trip);
    save();
    return trip;
  }

  function deleteTrip(id) {
    const idx = state.trips.findIndex(t => t.id === id);
    if (idx >= 0) { state.trips.splice(idx, 1); save(); return true; }
    return false;
  }

  // 根据起止日期重建 days 数组（保留已有数据）
  function rebuildDays(trip) {
    const dates = dateRange(trip.startDate, trip.endDate);
    const oldDays = trip.days || [];
    const newDays = dates.map((date, i) => {
      const existing = oldDays.find(d => d.date === date);
      if (existing) return existing;
      return {
        id: uid('day'),
        date,
        dayIndex: i + 1,
        transport: [],   // {id, type:flight/train/bus/car/other, from, to, departTime, arriveTime, number, cost, note}
        hotel: null,     // {name, address, checkIn, checkOut, cost, lat, lng, note}
        activities: [],  // {id, name, category, startTime, endTime, cost, lat, lng, address, note, order}
        meals: [],       // {id, name, time, cost, note}
        note: ''
      };
    });
    newDays.forEach((d, i) => d.dayIndex = i + 1);
    trip.days = newDays;
  }

  function getDay(tripId, dayId) {
    const trip = getTrip(tripId);
    if (!trip) return null;
    return trip.days.find(d => d.id === dayId) || null;
  }

  // ---------- 交通 ----------
  function addTransport(tripId, dayId, data) {
    const day = getDay(tripId, dayId); if (!day) return null;
    const t = Object.assign({ id: uid('t') }, data);
    day.transport.push(t); save(); return t;
  }
  function updateTransport(tripId, dayId, tid, patch) {
    const day = getDay(tripId, dayId); if (!day) return null;
    const t = day.transport.find(x => x.id === tid); if (!t) return null;
    Object.assign(t, patch); save(); return t;
  }
  function deleteTransport(tripId, dayId, tid) {
    const day = getDay(tripId, dayId); if (!day) return false;
    const i = day.transport.findIndex(x => x.id === tid);
    if (i >= 0) { day.transport.splice(i, 1); save(); return true; }
    return false;
  }

  // ---------- 酒店 ----------
  function setHotel(tripId, dayId, data) {
    const day = getDay(tripId, dayId); if (!day) return null;
    day.hotel = Object.assign({ id: uid('h') }, data); save(); return day.hotel;
  }
  function clearHotel(tripId, dayId) {
    const day = getDay(tripId, dayId); if (!day) return false;
    day.hotel = null; save(); return true;
  }

  // ---------- 活动 ----------
  function addActivity(tripId, dayId, data) {
    const day = getDay(tripId, dayId); if (!day) return null;
    const a = Object.assign({ id: uid('a'), order: day.activities.length }, data);
    day.activities.push(a); save(); return a;
  }
  function updateActivity(tripId, dayId, aid, patch) {
    const day = getDay(tripId, dayId); if (!day) return null;
    const a = day.activities.find(x => x.id === aid); if (!a) return null;
    Object.assign(a, patch); save(); return a;
  }
  function deleteActivity(tripId, dayId, aid) {
    const day = getDay(tripId, dayId); if (!day) return false;
    const i = day.activities.findIndex(x => x.id === aid);
    if (i >= 0) { day.activities.splice(i, 1); reindexActivities(day); save(); return true; }
    return false;
  }
  function reorderActivities(tripId, dayId, newOrderIds) {
    const day = getDay(tripId, dayId); if (!day) return false;
    const map = {}; day.activities.forEach(a => map[a.id] = a);
    day.activities = newOrderIds.map((id, i) => { map[id].order = i; return map[id]; });
    save(); return true;
  }
  function reindexActivities(day) {
    day.activities.forEach((a, i) => a.order = i);
  }

  // ---------- 餐饮 ----------
  function addMeal(tripId, dayId, data) {
    const day = getDay(tripId, dayId); if (!day) return null;
    const m = Object.assign({ id: uid('meal') }, data);
    day.meals.push(m); save(); return m;
  }
  function updateMeal(tripId, dayId, mid, patch) {
    const day = getDay(tripId, dayId); if (!day) return null;
    const m = day.meals.find(x => x.id === mid); if (!m) return null;
    Object.assign(m, patch); save(); return m;
  }
  function deleteMeal(tripId, dayId, mid) {
    const day = getDay(tripId, dayId); if (!day) return false;
    const i = day.meals.findIndex(x => x.id === mid);
    if (i >= 0) { day.meals.splice(i, 1); save(); return true; }
    return false;
  }

  // ---------- 成员 ----------
  function addMember(tripId, name) {
    const trip = getTrip(tripId); if (!trip) return null;
    const m = { id: uid('m'), name: name || '新成员' };
    trip.members.push(m); save(); return m;
  }
  function removeMember(tripId, memberId) {
    const trip = getTrip(tripId); if (!trip) return false;
    const i = trip.members.findIndex(m => m.id === memberId);
    if (i >= 0) { trip.members.splice(i, 1); save(); return true; }
    return false;
  }

  // ---------- 清单 ----------
  function addChecklistItem(tripId, text, category) {
    const trip = getTrip(tripId); if (!trip) return null;
    const item = { id: uid('c'), text, category: category || '通用', done: false };
    trip.checklist.push(item); save(); return item;
  }
  function updateChecklistItem(tripId, itemId, patch) {
    const trip = getTrip(tripId); if (!trip) return null;
    const it = trip.checklist.find(c => c.id === itemId); if (!it) return null;
    Object.assign(it, patch); save(); return it;
  }
  function deleteChecklistItem(tripId, itemId) {
    const trip = getTrip(tripId); if (!trip) return false;
    const i = trip.checklist.findIndex(c => c.id === itemId);
    if (i >= 0) { trip.checklist.splice(i, 1); save(); return true; }
    return false;
  }

  // ---------- 自定义分摊 ----------
  function addSplit(tripId, data) {
    const trip = getTrip(tripId); if (!trip) return null;
    const s = Object.assign({
      id: uid('sp'),
      title: data.title || '分摊项',
      amount: data.amount || 0,
      payerId: data.payerId,
      splits: data.splits || [], // [{memberId, amount}]
      createdAt: Date.now()
    }, data);
    trip.splits.push(s); save(); return s;
  }
  function deleteSplit(tripId, splitId) {
    const trip = getTrip(tripId); if (!trip) return false;
    const i = trip.splits.findIndex(s => s.id === splitId);
    if (i >= 0) { trip.splits.splice(i, 1); save(); return true; }
    return false;
  }

  // ---------- 统计 ----------
  // 估算花费 = 所有交通 + 酒店 + 活动 + 餐饮 的 cost 之和
  function estimateCost(trip) {
    let total = 0;
    trip.days.forEach(day => {
      day.transport.forEach(t => total += num(t.cost));
      if (day.hotel) total += num(day.hotel.cost);
      day.activities.forEach(a => total += num(a.cost));
      day.meals.forEach(m => total += num(m.cost));
    });
    return total;
  }
  // 人均估算 = 总估算 / 人数
  function perPersonEstimate(trip) {
    const total = estimateCost(trip);
    const n = trip.members.length || 1;
    return total / n;
  }

  // 实际花费：使用分摊记录 + 估算（如果没有分摊，回退估算）
  function actualCostByCategory(trip) {
    const cats = { transport: 0, hotel: 0, attraction: 0, food: 0, shopping: 0, other: 0 };
    trip.days.forEach(day => {
      day.transport.forEach(t => cats.transport += num(t.cost));
      if (day.hotel) cats.hotel += num(day.hotel.cost);
      day.activities.forEach(a => {
        const c = a.category || 'attraction';
        const key = (c === 'food') ? 'food' : (c === 'shopping' ? 'shopping' : (c === 'attraction' ? 'attraction' : 'other'));
        cats[key] += num(a.cost);
      });
      day.meals.forEach(m => cats.food += num(m.cost));
    });
    return cats;
  }
  function actualTotal(trip) {
    const cats = actualCostByCategory(trip);
    return Object.values(cats).reduce((a, b) => a + b, 0);
  }

  // 分摊结算：计算每个成员净额（应收/应付）
  // 简化：每项花费按参与人均摊；分摊记录优先使用其自定义 splits
  function computeSettlement(trip) {
    const balance = {};
    trip.members.forEach(m => balance[m.id] = 0);
    const memberCount = trip.members.length || 1;

    // 1. 默认按人头均摊每日花费
    trip.days.forEach(day => {
      const items = [];
      day.transport.forEach(t => items.push(num(t.cost)));
      if (day.hotel) items.push(num(day.hotel.cost));
      day.activities.forEach(a => items.push(num(a.cost)));
      day.meals.forEach(m => items.push(num(m.cost)));
      const dayTotal = items.reduce((a, b) => a + b, 0);
      const share = dayTotal / memberCount;
      trip.members.forEach(m => balance[m.id] -= share);
    });

    // 2. 自定义分摊：payer 付钱(+)，参与者按 splits 扣减(-)，未指定 splits 时全员均摊
    trip.splits.forEach(s => {
      if (!balance[s.payerId]) balance[s.payerId] = 0;
      balance[s.payerId] += num(s.amount);
      if (s.splits && s.splits.length) {
        s.splits.forEach(sp => {
          if (balance[sp.memberId] !== undefined) balance[sp.memberId] -= num(sp.amount);
        });
      } else {
        const share = num(s.amount) / memberCount;
        trip.members.forEach(m => balance[m.id] -= share);
      }
    });

    return trip.members.map(m => ({
      member: m,
      balance: balance[m.id] || 0,
      // balance > 0 表示别人欠他，<0 表示他欠别人
    }));
  }

  function num(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  // ---------- 导入导出 ----------
  function exportAll() {
    return JSON.stringify(state, null, 2);
  }
  function importAll(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.trips)) throw new Error('文件格式不正确');
    state = parsed;
    save();
    return true;
  }

  // ---------- 从模板创建 ----------
  function createFromTemplate(template, overrides) {
    const trip = createTrip(Object.assign({
      name: template.name,
      destination: template.destination,
      startDate: overrides.startDate || todayStr(),
      endDate: overrides.endDate || addDays(overrides.startDate || todayStr(), template.duration - 1),
      emoji: template.emoji,
      coverColor: template.coverColor || 0,
      members: overrides.members
    }, overrides));

    // 填充模板预设内容
    if (template.days && template.days.length) {
      template.days.forEach((tplDay, i) => {
        if (!trip.days[i]) return;
        const day = trip.days[i];
        if (tplDay.transport) tplDay.transport.forEach(t => day.transport.push(Object.assign({ id: uid('t') }, t)));
        if (tplDay.hotel) day.hotel = Object.assign({ id: uid('h') }, tplDay.hotel);
        if (tplDay.activities) tplDay.activities.forEach((a, idx) => day.activities.push(Object.assign({ id: uid('a'), order: idx }, a)));
      });
    }
    if (template.checklist && template.checklist.length) {
      trip.checklist = template.checklist.map(c => ({ id: uid('c'), done: false, category: c.category || '通用', text: c.text }));
    }
    save();
    return trip;
  }

  global.Store = {
    uid, parseDate, fmtDate, fmtDateCn, daysBetween, addDays, todayStr, dateRange, num,
    listTrips, getTrip, createTrip, updateTrip, deleteTrip, getDay, rebuildDays,
    addTransport, updateTransport, deleteTransport,
    setHotel, clearHotel,
    addActivity, updateActivity, deleteActivity, reorderActivities,
    addMeal, updateMeal, deleteMeal,
    addMember, removeMember,
    addChecklistItem, updateChecklistItem, deleteChecklistItem,
    addSplit, deleteSplit,
    estimateCost, perPersonEstimate, actualCostByCategory, actualTotal, computeSettlement,
    exportAll, importAll, createFromTemplate
  };

})(window);
