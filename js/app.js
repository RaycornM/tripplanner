/* =========================================================
   主应用：路由、视图渲染、交互
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const S = window.Store;
  const el = (tag, props, ...kids) => {
    const node = document.createElement(tag);
    if (props) {
      for (const k in props) {
        if (k === 'class') node.className = props[k];
        else if (k === 'html') node.innerHTML = props[k];
        else if (k.startsWith('on') && typeof props[k] === 'function') node.addEventListener(k.slice(2).toLowerCase(), props[k]);
        else if (k === 'dataset') Object.assign(node.dataset, props[k]);
        else if (props[k] != null) node.setAttribute(k, props[k]);
      }
    }
    kids.flat().forEach(c => {
      if (c == null || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  };
  const money = (n) => '¥' + S.num(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 });

  const COVER_GRADS = [
    'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    'linear-gradient(135deg, #ef4444, #f97316)',
    'linear-gradient(135deg, #10b981, #06b6d4)',
    'linear-gradient(135deg, #f97316, #eab308)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)'
  ];

  const TRANSPORT_META = {
    flight: { label: '飞机', icon: '✈' },
    train: { label: '高铁/火车', icon: '🚄' },
    bus: { label: '大巴', icon: '🚌' },
    car: { label: '自驾/包车', icon: '🚗' },
    other: { label: '其他', icon: '🚶' }
  };
  const CAT_META = {
    attraction: { label: '景点', cls: 'cat-attraction' },
    food: { label: '美食', cls: 'cat-food' },
    shopping: { label: '购物', cls: 'cat-shopping' },
    other: { label: '其他', cls: 'cat-other' }
  };

  // ---------- Toast ----------
  function toast(msg) {
    const root = $('#toastRoot');
    const t = el('div', { class: 'toast' }, msg);
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 2200);
  }

  // ---------- Modal ----------
  function openModal(title, bodyNode, opts) {
    opts = opts || {};
    const root = $('#modalRoot');
    const overlay = el('div', { class: 'modal-overlay' });
    const modal = el('div', { class: 'modal' });
    const head = el('div', { class: 'modal-head' },
      el('h3', { class: 'modal-title' }, title),
      el('button', { class: 'modal-close', onclick: () => closeModal() }, '×')
    );
    const body = el('div', { class: 'modal-body' });
    body.appendChild(bodyNode);
    modal.appendChild(head); modal.appendChild(body);

    if (opts.foot) {
      const foot = el('div', { class: 'modal-foot' });
      opts.foot.forEach(b => foot.appendChild(b));
      modal.appendChild(foot);
    }
    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    root.appendChild(overlay);
    return overlay;
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; }

  // ---------- Router ----------
  function parseHash() {
    const h = location.hash.slice(1);
    const parts = h.split('/').filter(Boolean);
    return { route: parts[0] || 'home', params: parts.slice(1) };
  }
  function navigate(hash) { location.hash = hash; }

  /* 框架控制：NavBar 标题/按钮、TabBar active、FAB 显示 */
  function updateFrame(route, params) {
    const navLeft = $('#navLeft'); const navTitle = $('#navTitle'); const navRight = $('#navRight');
    const fab = $('#fab'); const tabBar = $('#tabBar');
    navLeft.innerHTML = ''; navRight.innerHTML = '';
    // 行程详情等子页：显示返回 + 隐藏 TabBar
    const isSubPage = (route === 'trip' || route === 'templates');
    if (isSubPage) {
      tabBar.style.display = 'none';
      fab.style.display = 'none';
      navLeft.appendChild(el('button', { class: 'nav-btn', onclick: () => navigate('home') }, '‹'));
    } else {
      tabBar.style.display = 'flex';
      // TabBar active 切换
      $$('.tab-item', tabBar).forEach(t => {
        const tab = t.dataset.tab;
        const active = (route === 'home' && tab === 'trips') ||
                       (route === 'checklist' && tab === 'checklist') ||
                       (route === 'cost' && tab === 'cost') ||
                       (route === 'me' && tab === 'me');
        t.classList.toggle('active', active);
      });
    }
    // NavBar 标题与右侧操作
    const titles = {
      home: '', checklist: '出行清单', cost: '花费统计', me: '我的',
      templates: '行程模板', trip: ''
    };
    navTitle.textContent = titles[route] || '';
    // 首页右侧：导入导出隐藏到「我的」，首页留新建快捷
    if (route === 'home') {
      navRight.appendChild(el('button', { class: 'nav-btn', onclick: () => navigate('templates'), title: '模板' }, '📋'));
    }
    // FAB 仅首页显示
    fab.style.display = (route === 'home') ? 'grid' : 'none';
    if (route === 'home') {
      fab.onclick = () => openCreateTripModal();
    }
    // 行程详情标题
    if (route === 'trip' && params && params[0]) {
      const trip = S.getTrip(params[0]);
      if (trip) navTitle.textContent = (trip.emoji || '🧳') + ' ' + trip.name;
      navRight.appendChild(el('button', { class: 'nav-btn', onclick: () => openEditTripModal(trip), title: '编辑' }, '✎'));
    }
  }

  function render() {
    const { route, params } = parseHash();
    const app = $('#app');
    app.innerHTML = '';
    // 销毁旧地图/图表
    if (window._currentMap) { try { window._currentMap.remove(); } catch (e) {} window._currentMap = null; }
    if (window._currentChart) { try { window._currentChart.destroy(); } catch (e) {} window._currentChart = null; }

    updateFrame(route, params);

    if (route === 'home') renderHome(app);
    else if (route === 'trip') renderTrip(app, params[0], params[1]);
    else if (route === 'templates') renderTemplates(app);
    else if (route === 'checklist') renderChecklistHub(app);
    else if (route === 'cost') renderCostHub(app);
    else if (route === 'me') renderMe(app);
    else renderHome(app);
  }
  window.addEventListener('hashchange', render);

  /* ====================================================
     首页：行程列表
     ==================================================== */
  function renderHome(app) {
    const trips = S.listTrips();

    app.appendChild(el('div', { class: 'greeting' },
      el('p', { class: 'g-hi' }, '你好，旅人'),
      el('h1', { class: 'g-name' }, '我的旅行')
    ));

    const list = el('div', { class: 'trip-list' });

    if (trips.length === 0) {
      app.appendChild(emptyState('🧳', '还没有行程', '点击右下角按钮新建行程，或从模板快速开始', [
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => openCreateTripModal() }, '新建行程'),
        el('button', { class: 'btn btn-ghost btn-sm', onclick: () => navigate('templates') }, '浏览模板')
      ]));
      return;
    }

    trips.forEach(trip => list.appendChild(tripCard(trip)));
    list.appendChild(el('div', { class: 'new-card', onclick: () => openCreateTripModal() },
      el('div', { class: 'plus' }, '＋'),
      el('div', {}, '新建行程')
    ));
    app.appendChild(list);
  }

  function emptyState(icon, title, sub, actions) {
    const c = el('div', { class: 'empty-state' },
      el('span', { class: 'em-ic' }, icon),
      el('div', { class: 'em-title' }, title),
      el('div', { class: 'em-sub' }, sub)
    );
    if (actions && actions.length) {
      const w = el('div', { style: 'display:flex;gap:8px;justify-content:center;' });
      actions.forEach(b => w.appendChild(b));
      c.appendChild(w);
    }
    return c;
  }

  function tripCard(trip) {
    const est = S.estimateCost(trip);
    const days = trip.days.length;
    const today = S.todayStr();
    let status = '未开始';
    if (today >= trip.startDate && today <= trip.endDate) status = '进行中';
    else if (today > trip.endDate) status = '已结束';
    // 进度
    let progress = 0;
    if (days) {
      const ref = today < trip.startDate ? trip.startDate : (today > trip.endDate ? trip.endDate : today);
      progress = Math.min(100, Math.round((S.daysBetween(trip.startDate, ref) / days) * 100));
    }
    // 封面
    const cover = el('div', { class: 'trip-cover' });
    cover.innerHTML = `<div class="cover-grad"></div>
      <div class="cover-top">
        <span class="cover-emoji">${trip.emoji || '🧳'}</span>
        <span class="trip-status">${status}</span>
      </div>
      <div class="trip-name-cover">${trip.name}</div>`;
    // body
    const meta = el('div', { class: 'trip-meta-row' },
      el('span', {}, `📅 ${trip.startDate || '未定'}${days ? ' · ' + days + '天' : ''}`),
      el('span', {}, `📍 ${trip.destination || '自由'}`)
    );
    const prog = el('div', { class: 'trip-progress' },
      el('div', { class: 'tp-label' },
        el('span', {}, status === '进行中' ? `行程进度 ${progress}%` : `共 ${days} 天`),
        el('span', {}, `👥 ${trip.members.length}人`)
      ),
      el('div', { class: 'progress-bar' },
        el('div', { class: 'progress-fill', style: `width:${progress}%` })
      )
    );
    // 头像堆叠
    const avatars = el('div', { class: 'avatar-stack' });
    trip.members.slice(0, 4).forEach(m => {
      avatars.appendChild(el('div', { class: 'avatar' }, (m.name || '?').slice(0, 1)));
    });
    if (trip.members.length > 4) avatars.appendChild(el('span', { class: 'avatar-more' }, `+${trip.members.length - 4}`));
    const foot = el('div', { class: 'trip-foot' },
      avatars,
      el('div', { class: 'trip-cost' }, money(est), el('small', {}, ' · 预估'))
    );
    const body = el('div', { class: 'trip-body' }, meta, prog, foot);
    const card = el('div', { class: 'trip-card', onclick: () => navigate('trip/' + trip.id) }, cover, body);
    return card;
  }

  function confirmDeleteTrip(trip) {
    const body = el('div', {},
      el('p', { style: 'color:var(--text-soft)' }, `确定要删除「${trip.name}」吗？该操作不可恢复。`)
    );
    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-danger', onclick: () => {
        S.deleteTrip(trip.id); closeModal(); toast('行程已删除'); render();
      } }, '确认删除')
    ];
    openModal('删除行程', body, { foot });
  }

  /* ====================================================
     创建行程模态框
     ==================================================== */
  function openCreateTripModal(prefill) {
    prefill = prefill || {};
    const today = S.todayStr();
    const form = el('div', {},
      field('行程名称', el('input', { class: 'form-control', id: 'f_name', value: prefill.name || '', placeholder: '例如：日本东京5日游' })),
      field('目的地', el('input', { class: 'form-control', id: 'f_dest', value: prefill.destination || '', placeholder: '城市或地区' })),
      field('出行日期', el('div', { class: 'form-row' },
        el('input', { class: 'form-control', type: 'date', id: 'f_start', value: prefill.startDate || today }),
        el('input', { class: 'form-control', type: 'date', id: 'f_end', value: prefill.endDate || today })
      )),
      field('同行成员（回车添加）', memberInput(prefill.members || ['我'])),
      field('封面表情', emojiPicker(prefill.emoji || '🧳')),
      field('主题色', colorPicker(prefill.coverColor || 0))
    );

    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const name = $('#f_name').value.trim();
        if (!name) { toast('请填写行程名称'); return; }
        const start = $('#f_start').value;
        const end = $('#f_end').value;
        if (!start || !end) { toast('请选择日期'); return; }
        if (end < start) { toast('结束日期不能早于开始日期'); return; }
        const members = window._memberChips || [];
        const trip = S.createTrip({
          name,
          destination: $('#f_dest').value.trim(),
          startDate: start,
          endDate: end,
          members: members.length ? members : ['我'],
          emoji: window._pickedEmoji || '🧳',
          coverColor: window._pickedColor || 0
        });
        closeModal();
        toast('行程已创建');
        navigate('trip/' + trip.id);
      } }, '创建行程')
    ];
    openModal('新建行程', form, { foot });
  }

  function field(label, control) {
    return el('div', { class: 'form-group' },
      el('label', { class: 'form-label' }, label), control);
  }

  function memberInput(initial) {
    window._memberChips = (initial || ['我']).slice();
    const wrap = el('div', { class: 'chip-input-wrap' });
    const input = el('input', { placeholder: '输入成员名，回车添加' });
    function render() {
      // 清空除 input 外
      Array.from(wrap.children).forEach(c => { if (c !== input) c.remove(); });
      window._memberChips.forEach((name, idx) => {
        const chip = el('span', { class: 'chip' }, name,
          el('span', { class: 'chip-x', onclick: () => { window._memberChips.splice(idx, 1); render(); } }, '×'));
        wrap.insertBefore(chip, input);
      });
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        e.preventDefault();
        window._memberChips.push(input.value.trim());
        input.value = '';
        render();
      } else if (e.key === 'Backspace' && !input.value && window._memberChips.length) {
        window._memberChips.pop(); render();
      }
    });
    wrap.appendChild(input);
    render();
    return wrap;
  }

  const EMOJI_CHOICES = ['🧳', '🏖️', '🏔️', '🏯', '🌸', '🌊', '🐼', '🏙️', '🎡', '🌋', '🏝️', '🚂', '✈️', '🚗', '⛺', '🏰'];
  function emojiPicker(initial) {
    window._pickedEmoji = initial;
    const wrap = el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;' });
    EMOJI_CHOICES.forEach(e => {
      const b = el('button', {
        class: 'btn btn-ghost btn-sm' + (e === initial ? ' btn-primary' : ''),
        style: 'font-size:18px;padding:6px 10px;',
        onclick: () => {
          window._pickedEmoji = e;
          Array.from(wrap.children).forEach(c => c.classList.remove('btn-primary'));
          b.classList.add('btn-primary');
        }
      }, e);
      wrap.appendChild(b);
    });
    return wrap;
  }
  function colorPicker(initial) {
    window._pickedColor = initial;
    const wrap = el('div', { style: 'display:flex;gap:8px;' });
    COVER_GRADS.forEach((g, i) => {
      const sw = el('div', {
        style: `width:30px;height:30px;border-radius:8px;background:${g};cursor:pointer;border:3px solid ${i === initial ? '#fff' : 'transparent'};box-shadow:0 0 0 ${i === initial ? '2px var(--primary)' : '1px var(--border)'};`,
        onclick: () => {
          window._pickedColor = i;
          Array.from(wrap.children).forEach((c, j) => {
            c.style.border = j === i ? '3px solid #fff' : '3px solid transparent';
            c.style.boxShadow = j === i ? '0 0 0 2px var(--primary)' : '0 0 0 1px var(--border)';
          });
        }
      });
      wrap.appendChild(sw);
    });
    return wrap;
  }

  /* ====================================================
     模板库
     ==================================================== */
  function renderTemplates(app) {

    app.appendChild(el('h1', { class: 'page-title' }, '行程模板'));
    app.appendChild(el('p', { class: 'page-sub' }, '选择一个模板快速开始，套用后可自由修改'));

    const grid = el('div', { class: 'grid' });
    window.TEMPLATES.forEach(tpl => {
      const card = el('div', { class: 'tpl-card', onclick: () => applyTemplate(tpl) });
      card.appendChild(el('div', { class: 'tpl-emoji' }, tpl.emoji));
      card.appendChild(el('h4', {}, tpl.name));
      card.appendChild(el('p', {}, tpl.desc));
      const tags = el('div', { class: 'tpl-tags' });
      (tpl.tags || []).forEach(tag => tags.appendChild(el('span', { class: 'tpl-tag' }, tag)));
      tags.appendChild(el('span', { class: 'tpl-tag' }, `📅 ${tpl.duration}天`));
      card.appendChild(tags);
      grid.appendChild(card);
    });
    app.appendChild(grid);
  }

  function applyTemplate(tpl) {
    const today = S.todayStr();
    const form = el('div', {},
      el('div', { class: 'form-group' },
        el('label', { class: 'form-label' }, '行程名称'),
        el('input', { class: 'form-control', id: 't_name', value: tpl.name })
      ),
      el('div', { class: 'form-group' },
        el('label', { class: 'form-label' }, '开始日期'),
        el('input', { class: 'form-control', type: 'date', id: 't_start', value: today })
      ),
      el('div', { class: 'form-group' },
        el('label', { class: 'form-label' }, '同行成员（回车添加）'),
        memberInput(['我'])
      ),
      el('p', { class: 'hint' }, `模板共 ${tpl.duration} 天，将自动生成 ${tpl.duration} 天的行程框架`)
    );
    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const name = $('#t_name').value.trim() || tpl.name;
        const start = $('#t_start').value || today;
        const members = window._memberChips.length ? window._memberChips : ['我'];
        const trip = S.createFromTemplate(tpl, { name, startDate: start, members });
        closeModal();
        toast('已套用模板，开始编辑吧');
        navigate('trip/' + trip.id);
      } }, '套用模板')
    ];
    openModal('套用：' + tpl.name, form, { foot });
  }

  /* ====================================================
     行程详情页
     ==================================================== */
  function renderTrip(app, tripId, activeTab) {
    const trip = S.getTrip(tripId);
    if (!trip) { toast('行程不存在'); navigate('home'); return; }

    activeTab = activeTab || 'itinerary';


    // 头部
    const header = el('div', { class: 'trip-header' });
    const top = el('div', { class: 'trip-header-top' },
      el('div', {},
        el('h1', {}, `${trip.emoji || '🧳'} ${trip.name}`),
        el('div', { class: 'sub' }, `${trip.destination || '自由行程'} · ${trip.startDate} ~ ${trip.endDate} · ${trip.days.length}天 · ${trip.members.length}人`)
      ),
      el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;' },
        el('button', { class: 'btn btn-ghost btn-sm', onclick: () => openEditTripModal(trip) }, '编辑'),
        el('button', { class: 'btn btn-ghost btn-sm', onclick: () => openMembersModal(trip) }, `成员 ${trip.members.length}`),
        el('button', { class: 'btn btn-ghost btn-sm', onclick: () => openDatesModal(trip) }, '调整日期')
      )
    );
    const est = S.estimateCost(trip);
    const statRow = el('div', { class: 'trip-stat-row' },
      chip('📅', `${trip.days.length} 天行程`),
      chip('👥', `${trip.members.length} 人出行`),
      chip('💰', `预估总花费 ${money(est)}`),
      chip('🧑', `人均 ${money(S.perPersonEstimate(trip))}`),
      chip('✅', `清单 ${trip.checklist.filter(c => c.done).length}/${trip.checklist.length}`)
    );
    header.appendChild(top); header.appendChild(statRow);
    app.appendChild(header);

    // Tabs
    const tabs = el('div', { class: 'tabs' });
    const TABS = [
      ['itinerary', '🗓️ 行程'],
      ['map', '🗺️ 地图'],
      ['cost', '💰 花费'],
      ['checklist', '✅ 清单'],
      ['timeline', '📜 时间线'],
      ['chart', '📊 图表']
    ];
    TABS.forEach(([key, label]) => {
      const tab = el('button', { class: 'tab' + (key === activeTab ? ' active' : ''), onclick: () => navigate('trip/' + tripId + '/' + key) }, label);
      tabs.appendChild(tab);
    });
    app.appendChild(tabs);

    // 内容区
    if (activeTab === 'itinerary') renderItineraryTab(app, trip);
    else if (activeTab === 'map') renderMapTab(app, trip);
    else if (activeTab === 'cost') renderCostTab(app, trip);
    else if (activeTab === 'checklist') renderChecklistTab(app, trip);
    else if (activeTab === 'timeline') renderTimelineTab(app, trip);
    else if (activeTab === 'chart') renderChartTab(app, trip);
  }

  function chip(icon, text) {
    return el('span', { class: 'stat-chip' }, el('span', {}, icon), el('strong', {}, text));
  }

  function openEditTripModal(trip) {
    const form = el('div', {},
      field('行程名称', el('input', { class: 'form-control', id: 'e_name', value: trip.name })),
      field('目的地', el('input', { class: 'form-control', id: 'e_dest', value: trip.destination || '' })),
      field('封面表情', emojiPicker(trip.emoji || '🧳')),
      field('主题色', colorPicker(trip.coverColor || 0))
    );
    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        S.updateTrip(trip.id, {
          name: $('#e_name').value.trim() || trip.name,
          destination: $('#e_dest').value.trim(),
          emoji: window._pickedEmoji,
          coverColor: window._pickedColor
        });
        closeModal(); toast('已更新'); render();
      } }, '保存')
    ];
    openModal('编辑行程', form, { foot });
  }

  function openDatesModal(trip) {
    const form = el('div', {},
      field('出行日期', el('div', { class: 'form-row' },
        el('input', { class: 'form-control', type: 'date', id: 'd_start', value: trip.startDate }),
        el('input', { class: 'form-control', type: 'date', id: 'd_end', value: trip.endDate })
      )),
      el('p', { class: 'hint' }, '调整日期会自动重建行程天数，已填写的当日数据（按日期匹配）会保留。')
    );
    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const start = $('#d_start').value, end = $('#d_end').value;
        if (end < start) { toast('结束日期不能早于开始日期'); return; }
        S.updateTrip(trip.id, { startDate: start, endDate: end });
        closeModal(); toast('日期已更新'); render();
      } }, '保存')
    ];
    openModal('调整日期', form, { foot });
  }

  function openMembersModal(trip) {
    const body = el('div', {});
    const list = el('div', { style: 'margin-bottom:12px;' });
    function renderList() {
      list.innerHTML = '';
      if (!trip.members.length) list.appendChild(el('div', { class: 'empty-state' }, '暂无成员'));
      trip.members.forEach(m => {
        list.appendChild(el('div', { class: 'item-row' },
          el('div', { class: 'item-main' }, el('div', { class: 'item-title' }, m.name)),
          el('button', { class: 'btn btn-ghost btn-sm', onclick: () => {
            if (trip.members.length <= 1) { toast('至少保留1名成员'); return; }
            S.removeMember(trip.id, m.id); renderList();
          } }, '移除')
        ));
      });
    }
    renderList();
    const input = el('input', { class: 'form-control', id: 'new_member', placeholder: '输入成员名', style: 'margin-bottom:8px;' });
    const addBtn = el('button', { class: 'btn btn-primary btn-block', onclick: () => {
      const v = $('#new_member').value.trim();
      if (!v) return;
      S.addMember(trip.id, v);
      $('#new_member').value = '';
      renderList();
    } }, '＋ 添加成员');
    body.appendChild(list); body.appendChild(input); body.appendChild(addBtn);
    const foot = [el('button', { class: 'btn btn-primary', onclick: () => { closeModal(); toast('已更新'); render(); } }, '完成')];
    openModal('同行成员', body, { foot });
  }

  /* ====================================================
     行程 Tab：按天切换卡片
     ==================================================== */
  let currentDayId = null;

  function renderItineraryTab(app, trip) {
    if (!trip.days.length) {
      app.appendChild(emptyState('📅', '还没有行程天数，点击「调整日期」设置出行日期'));
      return;
    }
    if (!currentDayId || !trip.days.find(d => d.id === currentDayId)) currentDayId = trip.days[0].id;

    // 天切换器
    const switcher = el('div', { class: 'day-switcher' });
    trip.days.forEach(day => {
      const pill = el('div', { class: 'day-pill' + (day.id === currentDayId ? ' active' : ''), onclick: () => { currentDayId = day.id; render(); } },
        el('div', { class: 'dp-label' }, `第 ${day.dayIndex} 天`),
        el('div', { class: 'dp-date' }, S.fmtDateCn(day.date))
      );
      switcher.appendChild(pill);
    });
    app.appendChild(switcher);

    const day = trip.days.find(d => d.id === currentDayId);
    if (!day) return;

    // 当天概览
    const dayTotal = dayCost(day);
    app.appendChild(el('div', { class: 'card', style: 'background:var(--surface-2);' },
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' },
        el('div', {},
          el('div', { style: 'font-weight:700;font-size:16px;' }, `第 ${day.dayIndex} 天 · ${S.fmtDateCn(day.date)}`),
          el('div', { style: 'font-size:13px;color:var(--text-soft);' }, `${day.activities.length}个游玩地点 · ${day.transport.length}段交通`)
        ),
        el('div', { style: 'text-align:right;' },
          el('div', { style: 'font-size:12px;color:var(--text-soft);' }, '当日花费'),
          el('div', { style: 'font-size:18px;font-weight:700;color:var(--accent);' }, money(dayTotal))
        )
      )
    ));

    // 交通
    app.appendChild(transportCard(trip, day));
    // 酒店
    app.appendChild(hotelCard(trip, day));
    // 游玩
    app.appendChild(activitiesCard(trip, day));
    // 餐饮
    app.appendChild(mealsCard(trip, day));
    // 当天备注
    app.appendChild(noteCard(trip, day));
  }

  function dayCost(day) {
    let t = 0;
    day.transport.forEach(x => t += S.num(x.cost));
    if (day.hotel) t += S.num(day.hotel.cost);
    day.activities.forEach(x => t += S.num(x.cost));
    day.meals.forEach(x => t += S.num(x.cost));
    return t;
  }

  function sectionCard(title, icon, iconBg, content, addAction) {
    const card = el('div', { class: 'card' });
    const head = el('div', { class: 'card-head' },
      el('h3', { class: 'card-title' }, el('span', { class: 'ic', style: `background:${iconBg}` }, icon), title)
    );
    if (addAction) head.appendChild(el('button', { class: 'btn btn-ghost btn-sm', onclick: addAction.fn }, addAction.label));
    card.appendChild(head);
    const body = el('div', {});
    content(body);
    card.appendChild(body);
    return card;
  }

  function transportCard(trip, day) {
    const card = sectionCard('交通', '🚄', 'var(--accent-soft)', (body) => {
      if (!day.transport.length) {
        body.appendChild(emptyState('🚄', '暂无交通信息'));
        return;
      }
      day.transport.forEach(t => {
        const meta = TRANSPORT_META[t.type] || TRANSPORT_META.other;
        body.appendChild(el('div', { class: 'item-row' },
          el('div', { style: 'font-size:20px;' }, meta.icon),
          el('div', { class: 'item-main' },
            el('div', { class: 'item-title' }, `${t.from || '?'} → ${t.to || '?'}`),
            el('div', { class: 'item-sub' }, `${meta.label} · ${t.departTime || '--'}-${t.arriveTime || '--'}${t.number ? ' · ' + t.number : ''}${t.note ? ' · ' + t.note : ''}`)
          ),
          t.cost ? el('div', { class: 'item-cost' }, money(t.cost)) : null,
          el('div', { class: 'item-actions' },
            el('button', { class: 'btn btn-ghost btn-sm', onclick: () => openTransportModal(trip, day, t) }, '编辑'),
            el('button', { class: 'btn btn-ghost btn-sm', onclick: () => { S.deleteTransport(trip.id, day.id, t.id); toast('已删除'); render(); } }, '🗑')
          )
        ));
      });
    }, { label: '＋ 添加交通', fn: () => openTransportModal(trip, day, null) });
    return card;
  }

  function hotelCard(trip, day) {
    const card = sectionCard('住宿', '🏨', 'var(--purple-soft)', (body) => {
      if (!day.hotel) {
        body.appendChild(emptyState('🏨', '暂无住宿信息'));
        return;
      }
      const h = day.hotel;
      body.appendChild(el('div', { class: 'item-row' },
        el('div', { style: 'font-size:20px;' }, '🏨'),
        el('div', { class: 'item-main' },
          el('div', { class: 'item-title' }, h.name || '未命名酒店'),
          el('div', { class: 'item-sub' }, `${h.checkIn || ''}-${h.checkOut || ''}${h.address ? ' · ' + h.address : ''}${h.note ? ' · ' + h.note : ''}`)
        ),
        h.cost ? el('div', { class: 'item-cost' }, money(h.cost)) : null,
        el('div', { class: 'item-actions' },
          el('button', { class: 'btn btn-ghost btn-sm', onclick: () => openHotelModal(trip, day, h) }, '编辑'),
          el('button', { class: 'btn btn-ghost btn-sm', onclick: () => { S.clearHotel(trip.id, day.id); toast('已清除'); render(); } }, '🗑')
        )
      ));
    }, { label: '＋ 添加住宿', fn: () => openHotelModal(trip, day, null) });
    return card;
  }

  function activitiesCard(trip, day) {
    const card = sectionCard('游玩地点', '📍', 'var(--primary-soft)', (body) => {
      if (!day.activities.length) {
        body.appendChild(emptyState('📍', '添加游玩地点，可在地图查看并规划路线'));
        return;
      }
      const list = el('div', { id: 'activityList' });
      const sorted = day.activities.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
      sorted.forEach((a, idx) => {
        const meta = CAT_META[a.category] || CAT_META.other;
        const row = el('div', { class: 'item-row', 'data-id': a.id },
          el('div', { class: 'drag-handle', title: '拖拽排序' }, '⠿'),
          el('div', { style: `width:24px;height:24px;border-radius:50%;background:var(--primary);color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700;` }, String(idx + 1)),
          el('div', { class: 'item-main' },
            el('div', { class: 'item-title' }, a.name),
            el('div', { class: 'item-sub' },
              el('span', { class: 'cat-badge ' + meta.cls }, meta.label),
              ` ${a.startTime || '--'}-${a.endTime || '--'}`,
              a.address ? ` · ${a.address}` : '',
              a.note ? ` · ${a.note}` : ''
            )
          ),
          a.cost ? el('div', { class: 'item-cost' }, money(a.cost)) : null,
          el('div', { class: 'item-actions' },
            el('button', { class: 'btn btn-ghost btn-sm', onclick: () => openActivityModal(trip, day, a) }, '编辑'),
            el('button', { class: 'btn btn-ghost btn-sm', onclick: () => { S.deleteActivity(trip.id, day.id, a.id); toast('已删除'); render(); } }, '🗑')
          )
        );
        list.appendChild(row);
      });
      body.appendChild(list);

      // 路线规划信息
      if (sorted.length >= 2) {
        const withCoords = sorted.filter(a => a.lat && a.lng);
        if (withCoords.length >= 2) {
          let totalDist = 0;
          for (let i = 0; i < withCoords.length - 1; i++) {
            totalDist += haversine(withCoords[i].lat, withCoords[i].lng, withCoords[i + 1].lat, withCoords[i + 1].lng);
          }
          body.appendChild(el('div', { class: 'route-info', style: 'margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);' },
            el('span', {}, `🧭 路线共 ${withCoords.length} 个地点（${sorted.length - withCoords.length} 个缺坐标）`),
            el('span', {}, `📏 直线距离约 ${totalDist.toFixed(1)} km`),
            el('span', {}, `🚗 估算通行约 ${(totalDist * 1.5).toFixed(0)} 分钟（按 40km/h）`)
          ));
        }
      }

      // 拖拽排序
      if (window.Sortable) {
        Sortable.create(list, {
          handle: '.drag-handle', animation: 150,
          onEnd: (evt) => {
            const newOrder = Array.from(list.querySelectorAll('.item-row')).map(r => r.dataset.id);
            S.reorderActivities(trip.id, day.id, newOrder);
            toast('顺序已更新');
            render();
          }
        });
      }
    }, { label: '＋ 添加游玩地点', fn: () => openActivityModal(trip, day, null) });
    return card;
  }

  function mealsCard(trip, day) {
    const card = sectionCard('餐饮', '🍜', 'var(--accent-soft)', (body) => {
      if (!day.meals.length) {
        body.appendChild(emptyState('🍜', '记录每餐花费，便于分摊统计'));
        return;
      }
      day.meals.forEach(m => {
        body.appendChild(el('div', { class: 'item-row' },
          el('div', { style: 'font-size:20px;' }, '🍜'),
          el('div', { class: 'item-main' },
            el('div', { class: 'item-title' }, m.name),
            el('div', { class: 'item-sub' }, `${m.time || ''}${m.note ? ' · ' + m.note : ''}`)
          ),
          m.cost ? el('div', { class: 'item-cost' }, money(m.cost)) : null,
          el('div', { class: 'item-actions' },
            el('button', { class: 'btn btn-ghost btn-sm', onclick: () => openMealModal(trip, day, m) }, '编辑'),
            el('button', { class: 'btn btn-ghost btn-sm', onclick: () => { S.deleteMeal(trip.id, day.id, m.id); toast('已删除'); render(); } }, '🗑')
          )
        ));
      });
    }, { label: '＋ 添加餐饮', fn: () => openMealModal(trip, day, null) });
    return card;
  }

  function noteCard(trip, day) {
    const card = el('div', { class: 'card' },
      el('div', { class: 'card-head' }, el('h3', { class: 'card-title' }, el('span', { class: 'ic', style: 'background:var(--surface-2)' }, '📝'), '当日备注')),
      el('textarea', {
        class: 'form-control', placeholder: '记录当天的提醒、感受、待办...',
        onblur: (e) => { day.note = e.target.value; S.save(); }
      }, day.note || '')
    );
    return card;
  }

  function emptyState(icon, text) {
    return el('div', { class: 'empty-state' },
      el('span', { class: 'em-ic' }, icon), el('div', {}, text));
  }

  /* ====================================================
     交通/酒店/活动/餐饮 编辑模态
     ==================================================== */
  function openTransportModal(trip, day, t) {
    const isNew = !t;
    t = t || { type: 'flight', from: '', to: '', departTime: '', arriveTime: '', number: '', cost: '', note: '' };
    const typeOpts = Object.keys(TRANSPORT_META).map(k => el('option', Object.assign({ value: k }, t.type === k ? { selected: 'selected' } : {}), TRANSPORT_META[k].label));
    const form = el('div', {},
      field('交通方式', el('select', { class: 'form-control', id: 't_type' }, ...typeOpts)),
      field('出发 / 到达', el('div', { class: 'form-row' },
        el('input', { class: 'form-control', id: 't_from', value: t.from || '', placeholder: '出发地' }),
        el('input', { class: 'form-control', id: 't_to', value: t.to || '', placeholder: '到达地' })
      )),
      field('出发时间 / 到达时间', el('div', { class: 'form-row' },
        el('input', { class: 'form-control', id: 't_dep', value: t.departTime || '', placeholder: '08:00' }),
        el('input', { class: 'form-control', id: 't_arr', value: t.arriveTime || '', placeholder: '10:30' })
      )),
      field('班次号', el('input', { class: 'form-control', id: 't_num', value: t.number || '', placeholder: '航班号/车次号' })),
      field('花费（元）', el('input', { class: 'form-control', type: 'number', id: 't_cost', value: t.cost || '', placeholder: '0' })),
      field('备注', el('input', { class: 'form-control', id: 't_note', value: t.note || '', placeholder: '行李、座位等' }))
    );
    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const data = {
          type: $('#t_type').value,
          from: $('#t_from').value.trim(),
          to: $('#t_to').value.trim(),
          departTime: $('#t_dep').value.trim(),
          arriveTime: $('#t_arr').value.trim(),
          number: $('#t_num').value.trim(),
          cost: $('#t_cost').value,
          note: $('#t_note').value.trim()
        };
        if (isNew) S.addTransport(trip.id, day.id, data);
        else S.updateTransport(trip.id, day.id, t.id, data);
        closeModal(); toast('已保存'); render();
      } }, '保存')
    ];
    openModal(isNew ? '添加交通' : '编辑交通', form, { foot });
  }

  function openHotelModal(trip, day, h) {
    const isNew = !h;
    h = h || { name: '', address: '', checkIn: '14:00', checkOut: '12:00', cost: '', lat: '', lng: '', note: '' };
    const form = el('div', {},
      field('酒店名称', el('input', { class: 'form-control', id: 'h_name', value: h.name || '', placeholder: '如：西湖边民宿' })),
      field('地址', el('input', { class: 'form-control', id: 'h_addr', value: h.address || '', placeholder: '详细地址' })),
      field('入住 / 退房时间', el('div', { class: 'form-row' },
        el('input', { class: 'form-control', id: 'h_in', value: h.checkIn || '', placeholder: '14:00' }),
        el('input', { class: 'form-control', id: 'h_out', value: h.checkOut || '', placeholder: '12:00' })
      )),
      field('花费（元/晚）', el('input', { class: 'form-control', type: 'number', id: 'h_cost', value: h.cost || '', placeholder: '0' })),
      field('经纬度（可选，用于地图）', el('div', { class: 'form-row' },
        el('input', { class: 'form-control', id: 'h_lat', value: h.lat || '', placeholder: '纬度 lat' }),
        el('input', { class: 'form-control', id: 'h_lng', value: h.lng || '', placeholder: '经度 lng' })
      )),
      el('p', { class: 'hint' }, '可在「地图」标签点击地图快速获取坐标'),
      field('备注', el('input', { class: 'form-control', id: 'h_note', value: h.note || '', placeholder: '房间号、订单号等' }))
    );
    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const data = {
          name: $('#h_name').value.trim(),
          address: $('#h_addr').value.trim(),
          checkIn: $('#h_in').value.trim(),
          checkOut: $('#h_out').value.trim(),
          cost: $('#h_cost').value,
          lat: $('#h_lat').value,
          lng: $('#h_lng').value,
          note: $('#h_note').value.trim()
        };
        S.setHotel(trip.id, day.id, data);
        closeModal(); toast('已保存'); render();
      } }, '保存')
    ];
    openModal(isNew ? '添加住宿' : '编辑住宿', form, { foot });
  }

  function openActivityModal(trip, day, a) {
    const isNew = !a;
    a = a || { name: '', category: 'attraction', startTime: '', endTime: '', cost: '', lat: '', lng: '', address: '', note: '' };
    const catOpts = Object.keys(CAT_META).map(k => el('option', Object.assign({ value: k }, a.category === k ? { selected: 'selected' } : {}), CAT_META[k].label));
    const form = el('div', {},
      field('地点名称', el('input', { class: 'form-control', id: 'a_name', value: a.name || '', placeholder: '如：故宫博物院' })),
      field('类型', el('select', { class: 'form-control', id: 'a_cat' }, ...catOpts)),
      field('开始 / 结束时间', el('div', { class: 'form-row' },
        el('input', { class: 'form-control', id: 'a_start', value: a.startTime || '', placeholder: '14:00' }),
        el('input', { class: 'form-control', id: 'a_end', value: a.endTime || '', placeholder: '17:30' })
      )),
      field('花费（元）', el('input', { class: 'form-control', type: 'number', id: 'a_cost', value: a.cost || '', placeholder: '0' })),
      field('地址', el('input', { class: 'form-control', id: 'a_addr', value: a.address || '', placeholder: '详细地址' })),
      field('经纬度（可选）', el('div', { class: 'form-row' },
        el('input', { class: 'form-control', id: 'a_lat', value: a.lat || '', placeholder: '纬度 lat' }),
        el('input', { class: 'form-control', id: 'a_lng', value: a.lng || '', placeholder: '经度 lng' })
      )),
      el('p', { class: 'hint' }, '可在「地图」标签点击地图快速获取坐标，方便路线规划'),
      field('备注', el('input', { class: 'form-control', id: 'a_note', value: a.note || '', placeholder: '门票预约、注意事项等' }))
    );
    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const data = {
          name: $('#a_name').value.trim(),
          category: $('#a_cat').value,
          startTime: $('#a_start').value.trim(),
          endTime: $('#a_end').value.trim(),
          cost: $('#a_cost').value,
          address: $('#a_addr').value.trim(),
          lat: $('#a_lat').value,
          lng: $('#a_lng').value,
          note: $('#a_note').value.trim()
        };
        if (!data.name) { toast('请填写地点名称'); return; }
        if (isNew) S.addActivity(trip.id, day.id, data);
        else S.updateActivity(trip.id, day.id, a.id, data);
        closeModal(); toast('已保存'); render();
      } }, '保存')
    ];
    openModal(isNew ? '添加游玩地点' : '编辑游玩地点', form, { foot });
  }

  function openMealModal(trip, day, m) {
    const isNew = !m;
    m = m || { name: '', time: '', cost: '', note: '' };
    const form = el('div', {},
      field('餐名', el('input', { class: 'form-control', id: 'm_name', value: m.name || '', placeholder: '如：午餐 · 全聚德' })),
      field('时间', el('input', { class: 'form-control', id: 'm_time', value: m.time || '', placeholder: '12:30' })),
      field('花费（元）', el('input', { class: 'form-control', type: 'number', id: 'm_cost', value: m.cost || '', placeholder: '0' })),
      field('备注', el('input', { class: 'form-control', id: 'm_note', value: m.note || '', placeholder: '菜品、人均等' }))
    );
    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const data = {
          name: $('#m_name').value.trim(),
          time: $('#m_time').value.trim(),
          cost: $('#m_cost').value,
          note: $('#m_note').value.trim()
        };
        if (!data.name) { toast('请填写餐名'); return; }
        if (isNew) S.addMeal(trip.id, day.id, data);
        else S.updateMeal(trip.id, day.id, m.id, data);
        closeModal(); toast('已保存'); render();
      } }, '保存')
    ];
    openModal(isNew ? '添加餐饮' : '编辑餐饮', form, { foot });
  }

  /* ====================================================
     地图 Tab
     ==================================================== */
  function renderMapTab(app, trip) {
    app.appendChild(el('div', { class: 'map-legend' },
      el('strong', {}, '🗺️ 行程地图'),
      el('div', { style: 'font-size:12px;color:var(--text-soft);margin-top:4px;' }, '点击地图任意位置可复制坐标，用于填写游玩/酒店位置。蓝色为景点，橙色为交通点，紫色为酒店。')
    ));
    const mapWrap = el('div', { id: 'mapView' });
    app.appendChild(mapWrap);

    const coordDisplay = el('div', { class: 'card', style: 'margin-top:12px;' },
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' },
        el('div', {},
          el('div', { style: 'font-weight:600;' }, '点击坐标'),
          el('div', { id: 'coordText', style: 'font-size:13px;color:var(--text-soft);' }, '点击地图获取坐标')
        ),
        el('button', { class: 'btn btn-ghost btn-sm', onclick: () => {
          const t = $('#coordText').textContent;
          if (t.includes('点击地图')) return;
          navigator.clipboard && navigator.clipboard.writeText(t).then(() => toast('坐标已复制'));
        } }, '复制')
      )
    );
    app.appendChild(coordDisplay);

    // 收集所有地点
    const points = [];
    trip.days.forEach(day => {
      day.transport.forEach(t => {
        // 交通点：from/to 暂不定位（无坐标）
      });
      if (day.hotel && day.hotel.lat && day.hotel.lng) {
        points.push({ lat: +day.hotel.lat, lng: +day.hotel.lng, name: day.hotel.name, type: 'hotel', day: day.dayIndex, date: day.date });
      }
      day.activities.forEach(a => {
        if (a.lat && a.lng) points.push({ lat: +a.lat, lng: +a.lng, name: a.name, type: 'activity', day: day.dayIndex, date: day.date, order: a.order });
      });
    });

    setTimeout(() => initMap(mapWrap, points, trip), 50);
  }

  function initMap(container, points, trip) {
    if (!window.L) { container.innerHTML = '<div class="empty-state">地图加载失败，请检查网络</div>'; return; }
    const map = L.map(container).setView([35.0, 110.0], 4);
    window._currentMap = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 18
    }).addTo(map);

    // 点击获取坐标
    map.on('click', (e) => {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      $('#coordText').textContent = `lat: ${lat}, lng: ${lng}`;
    });

    if (!points.length) return;

    // 按天分组绘制
    const colors = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#eab308'];
    const bounds = [];
    const byDay = {};
    points.forEach(p => {
      const key = p.day;
      (byDay[key] = byDay[key] || []).push(p);
    });

    Object.keys(byDay).sort((a, b) => +a - +b).forEach(dayIdx => {
      const color = colors[(dayIdx - 1) % colors.length];
      const dayPoints = byDay[dayIdx].slice().sort((a, b) => (a.order || 0) - (b.order || 0));
      const latlngs = [];
      dayPoints.forEach((p, i) => {
        const iconHtml = p.type === 'hotel' ? '🏨' : `<b>${i + 1}</b>`;
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${p.type === 'hotel' ? '#8b5cf6' : color};color:#fff;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff;"><span style="transform:rotate(45deg)">${iconHtml}</span></div>`,
          iconSize: [28, 28], iconAnchor: [14, 28]
        });
        const meta = p.type === 'hotel' ? '住宿' : '景点';
        L.marker([p.lat, p.lng], { icon }).addTo(map)
          .bindPopup(`<b>${p.name}</b><br>第${p.day}天 · ${meta}<br>${S.fmtDateCn(p.date)}`);
        latlngs.push([p.lat, p.lng]);
        bounds.push([p.lat, p.lng]);
      });
      // 连线（当天路线）
      if (latlngs.length >= 2) {
        L.polyline(latlngs, { color, weight: 3, opacity: 0.6, dashArray: '6,6' }).addTo(map);
      }
    });

    if (bounds.length) {
      try { map.fitBounds(bounds, { padding: [40, 40] }); } catch (e) {}
    }
  }

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* ====================================================
     花费 Tab
     ==================================================== */
  function renderCostTab(app, trip) {
    const est = S.estimateCost(trip);
    const actualCats = S.actualCostByCategory(trip);
    const actual = S.actualTotal(trip);
    const perPerson = trip.members.length ? est / trip.members.length : 0;

    // 概览
    const grid = el('div', { class: 'cost-grid' });
    grid.appendChild(costBox('预估总花费', money(est), 'estimated', `${trip.members.length}人 · 人均 ${money(perPerson)}`));
    grid.appendChild(costBox('实际总花费', money(actual), 'actual', '含所有交通/住宿/游玩/餐饮'));
    grid.appendChild(costBox('交通', money(actualCats.transport), '', `${trip.days.reduce((s, d) => s + d.transport.length, 0)} 段`));
    grid.appendChild(costBox('住宿', money(actualCats.hotel), '', `${trip.days.filter(d => d.hotel).length} 晚`));
    grid.appendChild(costBox('游玩', money(actualCats.attraction), '', `${trip.days.reduce((s, d) => s + d.activities.length, 0)} 个地点`));
    grid.appendChild(costBox('餐饮', money(actualCats.food), '', `${trip.days.reduce((s, d) => s + d.meals.length, 0)} 餐`));
    app.appendChild(grid);

    // 按天花费明细
    const dayCard = el('div', { class: 'card' });
    dayCard.appendChild(el('div', { class: 'card-head' }, el('h3', { class: 'card-title' }, el('span', { class: 'ic', style: 'background:var(--primary-soft)' }, '📅'), '每日花费明细')));
    if (!trip.days.length) {
      dayCard.appendChild(emptyState('📅', '暂无行程数据'));
    } else {
      trip.days.forEach(day => {
        const dc = dayCost(day);
        dayCard.appendChild(el('div', { class: 'item-row' },
          el('div', { class: 'item-main' },
            el('div', { class: 'item-title' }, `第 ${day.dayIndex} 天 · ${S.fmtDateCn(day.date)}`),
            el('div', { class: 'item-sub' },
              `交通 ${money(day.transport.reduce((s, t) => s + S.num(t.cost), 0))} · 住宿 ${money(day.hotel ? S.num(day.hotel.cost) : 0)} · 游玩 ${money(day.activities.reduce((s, a) => s + S.num(a.cost), 0))} · 餐饮 ${money(day.meals.reduce((s, m) => s + S.num(m.cost), 0))}`)
          ),
          el('div', { class: 'item-cost' }, money(dc))
        ));
      });
    }
    app.appendChild(dayCard);

    // 分摊结算
    app.appendChild(settlementCard(trip));

    // 自定义分摊
    app.appendChild(customSplitsCard(trip));
  }

  function costBox(label, value, cls, sub) {
    return el('div', { class: 'cost-box' },
      el('div', { class: 'cb-label' }, label),
      el('div', { class: 'cb-value ' + (cls || '') }, value),
      sub ? el('div', { class: 'cb-sub' }, sub) : null
    );
  }

  function settlementCard(trip) {
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'card-head' },
      el('h3', { class: 'card-title' }, el('span', { class: 'ic', style: 'background:var(--green-soft)' }, '⚖️'), '分摊结算'),
      el('button', { class: 'btn btn-ghost btn-sm', onclick: () => openSplitModal(trip) }, '＋ 自定义分摊')
    ));
    card.appendChild(el('p', { class: 'hint', style: 'margin-top:0;' }, '默认按人头均摊所有花费。可在「自定义分摊」中按参与人指定金额。正数为应收，负数为应付。'));

    const settlements = S.computeSettlement(trip);
    const table = el('table', { class: 'split-table' });
    table.appendChild(el('tr', {},
      el('th', {}, '成员'),
      el('th', {}, '已垫付'),
      el('th', {}, '应分摊'),
      el('th', {}, '结算')
    ));

    // 计算每个成员垫付/分摊
    const memberCount = trip.members.length || 1;
    trip.members.forEach(m => {
      let paid = 0;
      // 自定义分摊中 payer 垫付
      trip.splits.forEach(s => { if (s.payerId === m.id) paid += S.num(s.amount); });
      // 默认假设每日花费也由成员共同分摊，无明确 payer，这里 paid 显示自定义垫付
      const totalEst = S.estimateCost(trip) + trip.splits.reduce((s, sp) => s + S.num(sp.amount), 0);
      // 简化：每个成员的应分摊 = (默认均摊总额) + 其在自定义分摊中承担的部分
      const settlement = settlements.find(x => x.member.id === m.id);
      const balance = settlement ? settlement.balance : 0;
      table.appendChild(el('tr', {},
        el('td', {}, m.name),
        el('td', {}, money(paid)),
        el('td', {}, money(paid - balance)),
        el('td', {}, balance >= 0
          ? el('span', { class: 'credit' }, `+${money(balance)} 应收`)
          : el('span', { class: 'owe' }, `${money(balance)} 应付`))
      ));
    });
    card.appendChild(table);

    // 建议转账
    const suggestions = computeTransferSuggestions(settlements);
    if (suggestions.length) {
      const sugDiv = el('div', { style: 'margin-top:14px;' },
        el('div', { style: 'font-weight:600;margin-bottom:8px;' }, '💡 建议转账（让账目两清）')
      );
      suggestions.forEach(s => sugDiv.appendChild(el('div', { class: 'item-row', style: 'background:var(--surface-2);' },
        el('div', { class: 'item-main' }, el('div', { class: 'item-title' }, `${s.from} → ${s.to}`)),
        el('div', { class: 'item-cost' }, money(s.amount))
      )));
      card.appendChild(sugDiv);
    }
    return card;
  }

  function computeTransferSuggestions(settlements) {
    // 贪心算法：欠款人付款给应收人
    const debtors = settlements.filter(s => s.balance < -0.01).map(s => ({ name: s.member.name, amt: -s.balance }));
    const creditors = settlements.filter(s => s.balance > 0.01).map(s => ({ name: s.member.name, amt: s.balance }));
    const result = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const pay = Math.min(debtors[i].amt, creditors[j].amt);
      result.push({ from: debtors[i].name, to: creditors[j].name, amount: pay });
      debtors[i].amt -= pay; creditors[j].amt -= pay;
      if (debtors[i].amt < 0.01) i++;
      if (creditors[j].amt < 0.01) j++;
    }
    return result;
  }

  function customSplitsCard(trip) {
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'card-head' },
      el('h3', { class: 'card-title' }, el('span', { class: 'ic', style: 'background:var(--accent-soft)' }, '🎯'), '自定义分摊记录'),
      el('button', { class: 'btn btn-ghost btn-sm', onclick: () => openSplitModal(trip) }, '＋ 添加分摊')
    ));
    if (!trip.splits.length) {
      card.appendChild(el('p', { class: 'hint', style: 'margin-top:0;' }, '暂无自定义分摊。当某些花费不是全员均摊时（例如某人没参加某项活动），可在此手动指定。'));
      card.appendChild(emptyState('🎯', '点击「添加分摊」创建'));
    } else {
      trip.splits.forEach(s => {
        const payer = trip.members.find(m => m.id === s.payerId);
        card.appendChild(el('div', { class: 'item-row' },
          el('div', { class: 'item-main' },
            el('div', { class: 'item-title' }, s.title),
            el('div', { class: 'item-sub' }, `${payer ? payer.name : '?'} 垫付 · ${s.splits && s.splits.length ? '自定义分摊 ' + s.splits.length + '人' : '全员均摊'}`)
          ),
          el('div', { class: 'item-cost' }, money(s.amount)),
          el('div', { class: 'item-actions' },
            el('button', { class: 'btn btn-ghost btn-sm', onclick: () => { S.deleteSplit(trip.id, s.id); toast('已删除'); render(); } }, '🗑')
          )
        ));
      });
    }
    return card;
  }

  function openSplitModal(trip) {
    const form = el('div', {},
      field('分摊项目名称', el('input', { class: 'form-control', id: 'sp_title', placeholder: '例如：长城包车' })),
      field('金额（元）', el('input', { class: 'form-control', type: 'number', id: 'sp_amount', placeholder: '0' })),
      field('谁垫付的？', el('select', { class: 'form-control', id: 'sp_payer' },
        ...trip.members.map(m => el('option', { value: m.id }, m.name))
      )),
      el('div', { class: 'form-label', style: 'margin-bottom:8px;' }, '分摊方式'),
      el('div', { class: 'split-mode-tabs' },
        el('button', { class: 'split-mode-tab active', id: 'mode_even', onclick: () => switchSplitMode('even') }, '按人头均摊'),
        el('button', { class: 'split-mode-tab', id: 'mode_custom', onclick: () => switchSplitMode('custom') }, '自定义金额')
      ),
      el('div', { id: 'sp_even_area' },
        el('p', { class: 'hint' }, '所有成员均摊，自动计算每人份额。')
      ),
      el('div', { id: 'sp_custom_area', style: 'display:none;' },
        el('p', { class: 'hint' }, '为每位参与人指定分摊金额（可只选部分人）。'),
        el('div', { id: 'sp_members' })
      )
    );

    // 渲染自定义成员
    const memWrap = $('#sp_members');
    function renderMemWrap() {
      const w = $('#sp_members');
      if (!w) return;
      w.innerHTML = '';
      trip.members.forEach(m => {
        const row = el('div', { class: 'custom-split-row' },
          el('label', { class: 'name' },
            el('input', { type: 'checkbox', 'data-mid': m.id, style: 'margin-right:6px;', checked: 'checked', onchange: updateEvenSplit }),
            m.name
          ),
          el('input', { type: 'number', 'data-amount-mid': m.id, placeholder: '0', oninput: updateCustomTotal })
        );
        w.appendChild(row);
      });
    }

    function switchSplitMode(mode) {
      const evenBtn = $('#mode_even'), customBtn = $('#mode_custom');
      const evenArea = $('#sp_even_area'), customArea = $('#sp_custom_area');
      if (mode === 'even') {
        evenBtn.classList.add('active'); customBtn.classList.remove('active');
        evenArea.style.display = 'block'; customArea.style.display = 'none';
        updateEvenSplit();
      } else {
        evenBtn.classList.remove('active'); customBtn.classList.add('active');
        evenArea.style.display = 'none'; customArea.style.display = 'block';
        renderMemWrap();
      }
    }
    window._switchSplitMode = switchSplitMode;

    function updateEvenSplit() {
      // 仅显示提示，实际均摊由后端计算
    }
    function updateCustomTotal() {
      let total = 0;
      $$('[data-amount-mid]').forEach(i => total += S.num(i.value));
      const amount = S.num($('#sp_amount').value);
      const diff = amount - total;
      const hint = $('#custom_total_hint');
      if (hint) hint.textContent = `已分配 ${money(total)} / ${money(amount)}${Math.abs(diff) < 0.01 ? ' ✓' : `，差额 ${money(diff)}`}`;
    }

    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const title = $('#sp_title').value.trim() || '分摊项';
        const amount = S.num($('#sp_amount').value);
        if (amount <= 0) { toast('请填写金额'); return; }
        const payerId = $('#sp_payer').value;
        const isCustom = $('#mode_custom').classList.contains('active');
        let splits = [];
        if (isCustom) {
          $$('[data-amount-mid]').forEach(inp => {
            const amt = S.num(inp.value);
            if (amt > 0) splits.push({ memberId: inp.dataset.amountMid, amount: amt });
          });
          const total = splits.reduce((s, x) => s + x.amount, 0);
          if (Math.abs(total - amount) > 0.01) { toast(`金额不匹配：已分配 ${money(total)}，应等于 ${money(amount)}`); return; }
        }
        S.addSplit(trip.id, { title, amount, payerId, splits });
        closeModal(); toast('分摊已添加'); render();
      } }, '保存')
    ];
    openModal('添加自定义分摊', form, { foot });
    // patch: 由于上面用 $ 在 modal 未挂载时找不到，重写 switchSplitMode 绑定
    $('#mode_even').onclick = () => {
      $('#mode_even').classList.add('active'); $('#mode_custom').classList.remove('active');
      $('#sp_even_area').style.display = 'block'; $('#sp_custom_area').style.display = 'none';
    };
    $('#mode_custom').onclick = () => {
      $('#mode_custom').classList.add('active'); $('#mode_even').classList.remove('active');
      $('#sp_custom_area').style.display = 'block'; $('#sp_even_area').style.display = 'none';
      renderMemWrap();
    };
  }

  /* ====================================================
     清单 Tab
     ==================================================== */
  function renderChecklistTab(app, trip) {
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'card-head' },
      el('h3', { class: 'card-title' }, el('span', { class: 'ic', style: 'background:var(--green-soft)' }, '✅'), '出行清单'),
      el('div', { style: 'display:flex;gap:6px;' },
        el('button', { class: 'btn btn-ghost btn-sm', onclick: () => loadPresetChecklist(trip) }, '载入常用清单'),
        el('button', { class: 'btn btn-primary btn-sm', onclick: () => openChecklistItemModal(trip) }, '＋ 添加')
      )
    ));

    const done = trip.checklist.filter(c => c.done).length;
    const total = trip.checklist.length;
    const pct = total ? Math.round(done / total * 100) : 0;
    card.appendChild(el('div', {},
      el('div', { style: 'display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;' },
        el('span', {}, `已完成 ${done}/${total}`),
        el('span', { style: 'color:var(--text-soft);' }, `${pct}%`)
      ),
      el('div', { class: 'progress-bar' }, el('div', { class: 'progress-fill', style: `width:${pct}%` }))
    ));

    // 按分类分组
    const groups = {};
    trip.checklist.forEach(c => { (groups[c.category || '通用'] = groups[c.category || '通用'] || []).push(c); });

    if (!total) {
      card.appendChild(emptyState('✅', '还没有清单项，点击「载入常用清单」快速添加，或手动添加'));
    } else {
      Object.keys(groups).forEach(cat => {
        card.appendChild(el('div', { style: 'font-weight:600;font-size:13px;color:var(--text-soft);margin:12px 0 6px;text-transform:uppercase;letter-spacing:.5px;' }, cat));
        groups[cat].forEach(item => {
          const li = el('div', { class: 'check-item' + (item.done ? ' done' : '') },
            el('input', { type: 'checkbox', checked: item.done ? 'checked' : null, onchange: (e) => { S.updateChecklistItem(trip.id, item.id, { done: e.target.checked }); render(); } }),
            el('span', { class: 'ci-text' }, item.text),
            el('button', { class: 'btn btn-ghost btn-sm', style: 'padding:2px 6px;', onclick: () => { S.deleteChecklistItem(trip.id, item.id); render(); } }, '×')
          );
          card.appendChild(li);
        });
      });
    }
    app.appendChild(card);
  }

  const PRESET_CHECKLIST = [
    { category: '证件', text: '身份证' },
    { category: '证件', text: '护照/港澳通行证（出境）' },
    { category: '证件', text: '学生证/军官证等优惠证件' },
    { category: '证件', text: '机票/火车票/酒店订单截图' },
    { category: '电子', text: '手机及充电器' },
    { category: '电子', text: '充电宝（≤100Wh）' },
    { category: '电子', text: '转换插头（出境）' },
    { category: '衣物', text: '换洗衣物（按天数+1）' },
    { category: '衣物', text: '舒适运动鞋' },
    { category: '衣物', text: '外套/防风衣' },
    { category: '洗护', text: '牙刷牙膏' },
    { category: '洗护', text: '护肤品/防晒霜' },
    { category: '洗护', text: '毛巾/浴巾' },
    { category: '健康', text: '常用药品（感冒、肠胃、创可贴）' },
    { category: '健康', text: '口罩' },
    { category: '其他', text: '雨伞' },
    { category: '其他', text: '水杯' },
    { category: '其他', text: '少量现金' }
  ];

  function loadPresetChecklist(trip) {
    const body = el('div', {});
    body.appendChild(el('p', { style: 'color:var(--text-soft);' }, '勾选要添加的项目，已存在的会自动跳过。'));
    const list = el('div', { style: 'max-height:50vh;overflow-y:auto;' });
    PRESET_CHECKLIST.forEach(item => {
      list.appendChild(el('div', { class: 'member-check' },
        el('input', { type: 'checkbox', checked: 'checked', 'data-text': item.text, 'data-cat': item.category }),
        el('div', {}, el('div', { style: 'font-weight:500;' }, item.text), el('div', { style: 'font-size:11px;color:var(--text-mute);' }, item.category))
      ));
    });
    body.appendChild(list);
    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        let added = 0;
        $$('input[data-text]', list).forEach(inp => {
          if (!inp.checked) return;
          const exists = trip.checklist.find(c => c.text === inp.dataset.text);
          if (!exists) { S.addChecklistItem(trip.id, inp.dataset.text, inp.dataset.cat); added++; }
        });
        closeModal(); toast(`已添加 ${added} 项`); render();
      } }, '添加选中项')
    ];
    openModal('载入常用清单', body, { foot });
  }

  function openChecklistItemModal(trip) {
    const form = el('div', {},
      field('清单内容', el('input', { class: 'form-control', id: 'c_text', placeholder: '如：护照' })),
      field('分类', el('input', { class: 'form-control', id: 'c_cat', value: '通用', placeholder: '如：证件/电子/衣物' }))
    );
    const foot = [
      el('button', { class: 'btn btn-ghost', onclick: closeModal }, '取消'),
      el('button', { class: 'btn btn-primary', onclick: () => {
        const text = $('#c_text').value.trim();
        if (!text) { toast('请填写内容'); return; }
        S.addChecklistItem(trip.id, text, $('#c_cat').value.trim() || '通用');
        closeModal(); toast('已添加'); render();
      } }, '添加')
    ];
    openModal('添加清单项', form, { foot });
  }

  /* ====================================================
     时间线 Tab
     ==================================================== */
  function renderTimelineTab(app, trip) {
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'card-head' }, el('h3', { class: 'card-title' }, el('span', { class: 'ic', style: 'background:var(--primary-soft)' }, '📜'), '旅行时间线')));
    card.appendChild(el('p', { class: 'hint' }, '按时间顺序回顾整段旅程'));

    if (!trip.days.length) { card.appendChild(emptyState('📜', '暂无行程数据')); app.appendChild(card); return; }

    const timeline = el('div', { class: 'timeline' });
    trip.days.forEach(day => {
      timeline.appendChild(el('div', { class: 'tl-day-label' }, `第 ${day.dayIndex} 天 · ${S.fmtDateCn(day.date)}`));

      // 收集当天所有事件并按时间排序
      const events = [];
      day.transport.forEach(t => events.push({ type: 'transport', time: t.departTime, obj: t, sortKey: t.departTime || '00:00' }));
      day.activities.forEach(a => events.push({ type: 'activity', time: a.startTime, obj: a, sortKey: a.startTime || '99:99' }));
      day.meals.forEach(m => events.push({ type: 'activity', time: m.time, obj: { name: '🍜 ' + m.name, startTime: m.time, cost: m.cost, note: m.note }, sortKey: m.time || '99:99' }));
      if (day.hotel) events.push({ type: 'hotel', time: day.hotel.checkIn, obj: day.hotel, sortKey: '23:59' });

      events.sort((a, b) => (a.sortKey || '').localeCompare(b.sortKey || ''));

      events.forEach(ev => {
        const dotCls = ev.type;
        const icon = ev.type === 'transport' ? '🚄' : (ev.type === 'hotel' ? '🏨' : '📍');
        let title = '', sub = '';
        if (ev.type === 'transport') {
          const meta = TRANSPORT_META[ev.obj.type] || TRANSPORT_META.other;
          title = `${meta.icon} ${ev.obj.from || ''} → ${ev.obj.to || ''}`;
          sub = `${meta.label}${ev.obj.departTime ? ' · ' + ev.obj.departTime : ''}${ev.obj.number ? ' · ' + ev.obj.number : ''}`;
        } else if (ev.type === 'hotel') {
          title = `🏨 入住 ${ev.obj.name || ''}`;
          sub = `${ev.obj.checkIn || ''}入住${ev.obj.address ? ' · ' + ev.obj.address : ''}`;
        } else {
          title = `${ev.obj.name || ''}`;
          sub = `${ev.obj.startTime || ''}${ev.obj.endTime ? '-' + ev.obj.endTime : ''}${ev.obj.address ? ' · ' + ev.obj.address : ''}`;
        }
        timeline.appendChild(el('div', { class: 'tl-item' },
          el('div', { class: 'tl-dot ' + dotCls }, icon),
          el('div', { class: 'tl-content' },
            el('div', { class: 'tl-title' }, title),
            el('div', { class: 'tl-time' }, sub + (ev.obj.cost ? ' · ' + money(ev.obj.cost) : ''))
          )
        ));
      });
      if (!events.length) timeline.appendChild(el('div', { class: 'tl-item' },
        el('div', { class: 'tl-dot' }, '—'),
        el('div', { class: 'tl-content' }, el('div', { class: 'tl-title', style: 'color:var(--text-mute);' }, '今日暂无安排'))
      ));
    });
    card.appendChild(timeline);
    app.appendChild(card);
  }

  /* ====================================================
     图表 Tab（实际花费饼图）
     ==================================================== */
  function renderChartTab(app, trip) {
    const cats = S.actualCostByCategory(trip);
    const total = S.actualTotal(trip);

    const wrap = el('div', { class: 'chart-wrap' });
    wrap.appendChild(el('div', { class: 'card-head' }, el('h3', { class: 'card-title' }, el('span', { class: 'ic', style: 'background:var(--accent-soft)' }, '📊'), '实际花费构成')));
    wrap.appendChild(el('p', { class: 'hint', style: 'margin-top:0;' }, `总花费 ${money(total)} · 按类别统计`));

    const canvasWrap = el('div', { class: 'chart-canvas-wrap' },
      el('canvas', { id: 'pieChart' })
    );
    wrap.appendChild(canvasWrap);
    app.appendChild(wrap);

    // 每日花费柱图
    const dayWrap = el('div', { class: 'chart-wrap', style: 'margin-top:14px;' });
    dayWrap.appendChild(el('div', { class: 'card-head' }, el('h3', { class: 'card-title' }, el('span', { class: 'ic', style: 'background:var(--primary-soft)' }, '📅'), '每日花费对比')));
    const dayCanvas = el('div', { class: 'chart-canvas-wrap' }, el('canvas', { id: 'barChart' }));
    dayWrap.appendChild(dayCanvas);
    app.appendChild(dayWrap);

    setTimeout(() => drawCharts(trip, cats), 50);
  }

  function drawCharts(trip, cats) {
    if (!window.Chart) return;
    const labels = ['交通', '住宿', '游玩', '餐饮', '购物', '其他'];
    const data = [cats.transport, cats.hotel, cats.attraction, cats.food, cats.shopping, cats.other];
    const colors = ['#f97316', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#94a3b8'];

    const ctx = $('#pieChart');
    if (ctx) {
      window._currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 2, borderColor: '#fff'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 14, font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total ? (ctx.parsed / total * 100).toFixed(1) : 0;
                  return ` ${ctx.label}: ${money(ctx.parsed)} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // 每日柱图
    const barCtx = $('#barChart');
    if (barCtx) {
      const dayLabels = trip.days.map(d => `第${d.dayIndex}天`);
      const dayData = trip.days.map(d => dayCost(d));
      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: dayLabels,
          datasets: [{
            label: '每日花费',
            data: dayData,
            backgroundColor: '#3b82f6',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ' ' + money(c.parsed.y) } } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => '¥' + v } } }
        }
      });
    }
  }

  /* 导入导出功能已移至「我的」页面（renderMe） */

  /* ====================================================
     清单中心（聚合所有行程的清单）
     ==================================================== */
  function renderChecklistHub(app) {
    const trips = S.listTrips();
    if (!trips.length) { app.appendChild(emptyState('✅', '还没有清单', '创建行程后可管理出行清单')); return; }
    trips.forEach(trip => {
      const done = trip.checklist.filter(c => c.done).length;
      const total = trip.checklist.length;
      const pct = total ? Math.round(done / total * 100) : 0;
      app.appendChild(el('div', { class: 'card', onclick: () => navigate('trip/' + trip.id + '/checklist') },
        el('div', { class: 'card-head' },
          el('div', { class: 'card-title' }, el('span', { class: 'ic' }, '🧳'), trip.name),
          el('span', { class: 'caption' }, `${done}/${total}`)
        ),
        el('div', { class: 'progress-bar' }, el('div', { class: 'progress-fill', style: `width:${pct}%` }))
      ));
    });
  }

  /* ====================================================
     花费中心（聚合所有行程花费统计）
     ==================================================== */
  function renderCostHub(app) {
    const trips = S.listTrips();
    if (!trips.length) { app.appendChild(emptyState('💰', '还没有花费', '创建行程后可记账统计')); return; }
    let grandTotal = 0;
    const summary = el('div', { class: 'cost-box' },
      el('div', { class: 'cb-label' }, '全部行程总花费'),
      el('div', { class: 'cb-value actual' }, '¥0')
    );
    app.appendChild(summary);
    trips.forEach(trip => {
      const total = S.actualTotal(trip);
      grandTotal += total;
      const per = trip.members.length ? Math.round(total / trip.members.length) : 0;
      app.appendChild(el('div', { class: 'card', onclick: () => navigate('trip/' + trip.id + '/cost') },
        el('div', { class: 'card-head' },
          el('div', { class: 'card-title' }, el('span', { class: 'ic' }, (trip.emoji||'🧳')), trip.name),
          el('span', { class: 'caption' }, `${trip.members.length}人`)
        ),
        el('div', { class: 'trip-foot' },
          el('span', { class: 'text-soft', style: 'font-size:13px;' }, '总花费'),
          el('span', { class: 'trip-cost' }, money(total))
        ),
        el('div', { class: 'text-soft', style: 'font-size:12px;margin-top:6px;' }, `人均 ${money(per)}`)
      ));
    });
    summary.querySelector('.cb-value').textContent = money(grandTotal);
  }

  /* ====================================================
     我的（设置 / 导入导出 / 关于）
     ==================================================== */
  function renderMe(app) {
    const trips = S.listTrips();
    const totalCost = trips.reduce((s, t) => s + S.actualTotal(t), 0);
    app.appendChild(el('div', { class: 'trip-header' },
      el('h1', {}, '👋 旅人'),
      el('div', { class: 'sub' }, `已记录 ${trips.length} 段旅程 · 累计 ${money(totalCost)}`)
    ));
    app.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title', style: 'margin-bottom:14px;' }, '数据管理'),
      el('button', { class: 'btn btn-secondary btn-block', style: 'margin-bottom:8px;', onclick: () => {
        const blob = new Blob([S.exportAll()], { type: 'application/json' });
        const a = el('a', { href: URL.createObjectURL(blob), download: 'tripplanner-backup-' + S.todayStr() + '.json' });
        a.click();
        toast('已导出备份');
      } }, '📤 导出备份'),
      el('label', { class: 'btn btn-ghost btn-block', style: 'margin-bottom:8px;' }, '📥 导入备份',
        el('input', { type: 'file', accept: 'application/json', hidden: true, onchange: (e) => {
          const f = e.target.files[0]; if (!f) return;
          const r = new FileReader();
          r.onload = () => { try { S.importAll(r.result); toast('导入成功'); render(); } catch (err) { toast('导入失败：' + err.message); } };
          r.readAsText(f);
        } })
      )
    ));
    app.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-title', style: 'margin-bottom:10px;' }, '关于'),
      el('p', { class: 'caption' }, '旅途伴旅 · 旅行规划工具'),
      el('p', { class: 'caption' }, '数据存储在本地浏览器，安全私密')
    ));
  }

  // 初始化
  render();

  // 暴露给全局（TabBar onclick 用）
  window.App = { navigate };
})();
