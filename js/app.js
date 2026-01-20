/**
 * Доктор Дент - Mini App JavaScript
 */


// Состояние приложения
const appState = {
    user: null,
    booking: {
        service: null,
        doctor: null,
        branch: null,
        date: null,
        time: null
    }
};

// ===== API HELPERS =====

async function apiGet(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) throw new Error('API Error');
        return await response.json();
    } catch (error) {
        console.error('API GET Error:', error);
        return null;
    }
}

async function apiPost(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('API POST Error:', error);
        return null;
    }
}

async function apiDelete(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
    } catch (error) {
        console.error('API DELETE Error:', error);
        return null;
    }
}

// ===== RENDERING HELPERS =====

function formatPrice(price, priceFrom, priceTo, priceType) {
    if (priceType === 'fixed') {
        return `${price.toLocaleString('ru-RU')} ₽`;
    } else if (priceType === 'from') {
        return `от ${priceFrom.toLocaleString('ru-RU')} ₽`;
    } else if (priceType === 'range') {
        return `${priceFrom.toLocaleString('ru-RU')} — ${priceTo.toLocaleString('ru-RU')} ₽`;
    }
    return 'Уточняйте';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'long'
    });
}

// ===== LOADERS =====

async function loadCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    const categories = await apiGet('/services/categories');

    if (!categories || categories.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>Категории не найдены</p></div>';
        return;
    }

    container.innerHTML = categories.map(cat => `
        <a href="/services?category=${cat.id}" class="list-item" onclick="hapticFeedback('light')">
            <div class="list-item-icon">${cat.icon}</div>
            <div class="list-item-content">
                <div class="list-item-title">${cat.name}</div>
                <div class="list-item-subtitle">${cat.services_count} услуг</div>
            </div>
            <div class="list-item-arrow">›</div>
        </a>
    `).join('');
}

async function loadServices(containerId, categoryId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    let endpoint = '/services';
    if (categoryId) endpoint += `?category=${categoryId}`;

    const services = await apiGet(endpoint);

    if (!services || services.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🦷</div><p>Услуги не найдены</p></div>';
        return;
    }

    container.innerHTML = services.map(s => `
        <div class="service-card" onclick="selectService(${s.id}, '${s.name}', ${s.price || s.price_from})">
            <div>
                <div class="service-name">
                    ${s.name}
                    ${s.is_popular ? '<span class="badge badge-popular">Популярное</span>' : ''}
                    ${s.is_promo ? '<span class="badge badge-promo">Акция</span>' : ''}
                </div>
                <div class="service-duration">${s.duration_min} мин</div>
            </div>
            <div class="service-price ${s.is_promo ? 'promo' : ''}">${s.price_display}</div>
        </div>
    `).join('');
}

async function loadDoctors(containerId, branchId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    let endpoint = '/doctors';
    if (branchId) endpoint += `?branch=${branchId}`;

    const doctors = await apiGet(endpoint);

    if (!doctors || doctors.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👨‍⚕️</div><p>Врачи не найдены</p></div>';
        return;
    }

    container.innerHTML = doctors.map(d => `
        <a href="/doctors/${d.id}" class="doctor-card" onclick="hapticFeedback('light')">
            <img src="${d.photo_url}" alt="${d.name}" class="doctor-photo"
                 onerror="this.src='https://via.placeholder.com/80x80?text=👨‍⚕️'">
            <div class="doctor-info">
                <div class="doctor-name">
                    ${d.name}
                    ${d.is_promo ? '<span class="badge badge-promo">Акция</span>' : ''}
                </div>
                <div class="doctor-specialty">${d.specialty}</div>
                <div class="doctor-meta">
                    <span class="doctor-rating">⭐ ${d.rating}</span>
                    <span>Стаж ${d.experience_years} лет</span>
                </div>
            </div>
        </a>
    `).join('');
}

async function loadBranches(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const branches = await apiGet('/branches');

    if (!branches) return;

    container.innerHTML = branches.map(b => `
        <div class="branch-chip" data-id="${b.id}" onclick="selectBranch(${b.id}, '${b.short_name}')">
            ${b.short_name}
        </div>
    `).join('');
}

async function loadAppointments(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    const user = getTelegramUser();
    const appointments = await apiGet(`/appointments?telegram_id=${user.id}`);

    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>У вас пока нет записей</p>
                <a href="/book" class="btn btn-primary" style="margin-top: 16px">Записаться на приём</a>
            </div>
        `;
        return;
    }

    container.innerHTML = appointments.map(a => `
        <div class="appointment-card">
            <div class="appointment-header">
                <div class="appointment-date">${formatDate(a.appointment_date)}</div>
                <div class="appointment-time">${a.appointment_time}</div>
            </div>
            <div class="appointment-body">
                <div class="appointment-service">${a.service?.name || 'Услуга'}</div>
                <div class="appointment-doctor">👨‍⚕️ ${a.doctor?.name || 'Врач'}</div>
                <div class="appointment-branch">📍 ${a.branch?.address || 'Адрес'}</div>
            </div>
            <div class="appointment-actions">
                <button class="btn btn-secondary" onclick="cancelAppointment(${a.id})">Отменить</button>
                <a href="/reschedule/${a.id}" class="btn btn-primary">Перенести</a>
            </div>
        </div>
    `).join('');
}

// ===== BOOKING FLOW =====

function selectService(id, name, price) {
    appState.booking.service = { id, name, price };
    localStorage.setItem('booking', JSON.stringify(appState.booking));
    hapticFeedback('medium');
    window.location.href = '/book/doctor';
}

function selectDoctor(id, name) {
    appState.booking.doctor = { id, name };
    localStorage.setItem('booking', JSON.stringify(appState.booking));
    hapticFeedback('medium');
    window.location.href = '/book/datetime';
}

function selectBranch(id, name) {
    appState.booking.branch = { id, name };
    localStorage.setItem('booking', JSON.stringify(appState.booking));

    // Обновляем UI
    document.querySelectorAll('.branch-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.id == id);
    });

    hapticFeedback('light');
}

function selectDate(dateStr) {
    appState.booking.date = dateStr;
    localStorage.setItem('booking', JSON.stringify(appState.booking));

    // Обновляем UI
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.toggle('selected', day.dataset.date === dateStr);
    });

    hapticFeedback('light');
    loadTimeSlots();
}

function selectTime(time) {
    appState.booking.time = time;
    localStorage.setItem('booking', JSON.stringify(appState.booking));

    // Обновляем UI
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.toggle('selected', slot.textContent === time);
    });

    hapticFeedback('medium');
}

async function loadTimeSlots() {
    const container = document.getElementById('time-slots');
    if (!container) return;

    const booking = JSON.parse(localStorage.getItem('booking') || '{}');

    if (!booking.doctor?.id || !booking.date) {
        container.innerHTML = '<div class="empty-state">Выберите дату</div>';
        return;
    }

    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    const data = await apiGet(`/slots?doctor=${booking.doctor.id}&date=${booking.date}`);

    if (!data || !data.slots || data.slots.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет свободных слотов на эту дату</div>';
        return;
    }

    // Запоминаем филиал из расписания
    if (data.branch_id) {
        appState.booking.branch = { id: data.branch_id };
        localStorage.setItem('booking', JSON.stringify(appState.booking));
    }

    container.innerHTML = data.slots.map(slot => `
        <div class="time-slot" onclick="selectTime('${slot}')">${slot}</div>
    `).join('');
}

async function confirmBooking() {
    const booking = JSON.parse(localStorage.getItem('booking') || '{}');
    const user = getTelegramUser();

    if (!booking.service?.id || !booking.doctor?.id || !booking.date || !booking.time) {
        showAlert('Пожалуйста, заполните все поля');
        return;
    }

    const result = await apiPost('/appointments', {
        telegram_id: user.id,
        service_id: booking.service.id,
        doctor_id: booking.doctor.id,
        branch_id: booking.branch?.id || 1,
        date: booking.date,
        time: booking.time
    });

    if (result && result.id) {
        hapticFeedback('success');
        localStorage.removeItem('booking');
        window.location.href = '/book/success';
    } else {
        hapticFeedback('error');
        showAlert(result?.error || 'Ошибка при создании записи');
    }
}

async function cancelAppointment(id) {
    showConfirm('Вы уверены, что хотите отменить запись?', async (confirmed) => {
        if (confirmed) {
            const result = await apiDelete(`/appointments/${id}`);
            if (result?.success) {
                hapticFeedback('success');
                loadAppointments('appointments-list');
            } else {
                hapticFeedback('error');
                showAlert('Ошибка при отмене записи');
            }
        }
    });
}

// ===== CALENDAR =====

function generateCalendar(containerId, selectedDate = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7; // Понедельник = 0

    let html = `
        <div class="calendar">
            <div class="calendar-header">
                <button class="calendar-nav" onclick="prevMonth()">‹</button>
                <span>${monthNames[currentMonth]} ${currentYear}</span>
                <button class="calendar-nav" onclick="nextMonth()">›</button>
            </div>
            <div class="calendar-days">
    `;

    // Названия дней
    dayNames.forEach(day => {
        html += `<div class="calendar-day-name">${day}</div>`;
    });

    // Пустые ячейки в начале
    for (let i = 0; i < startDay; i++) {
        html += `<div class="calendar-day disabled"></div>`;
    }

    // Дни месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = date.toISOString().split('T')[0];
        const isPast = date < new Date(today.toDateString());
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = dateStr === selectedDate;

        let classes = 'calendar-day';
        if (isPast) classes += ' disabled';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';

        html += `<div class="${classes}" data-date="${dateStr}"
                     ${!isPast ? `onclick="selectDate('${dateStr}')"` : ''}>${day}</div>`;
    }

    html += `</div></div>`;
    container.innerHTML = html;
}

// ===== CONFETTI =====

function showConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti';
    document.body.appendChild(container);

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            animation: fall ${2 + Math.random() * 2}s linear forwards;
        `;
        container.appendChild(confetti);
    }

    // Добавляем анимацию
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fall {
            to {
                top: 100%;
                transform: rotate(${Math.random() * 720}deg);
            }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => container.remove(), 4000);
}

// ===== FLOATING ACTION BUTTON =====

function toggleContactMenu() {
    const menu = document.getElementById('contactMenu');
    if (menu) {
        menu.classList.toggle('show');
        hapticFeedback('light');
    }
}

// Закрытие меню при клике вне
document.addEventListener('click', (e) => {
    const fab = document.querySelector('.fab');
    const menu = document.getElementById('contactMenu');
    if (menu && !fab?.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('show');
    }
});

// ===== INITIALIZATION =====

function loadBookingState() {
    const saved = localStorage.getItem('booking');
    if (saved) {
        Object.assign(appState.booking, JSON.parse(saved));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadBookingState();
});
