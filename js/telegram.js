/**
 * Telegram WebApp integration
 */

const tg = window.Telegram?.WebApp;

// Инициализация Telegram WebApp
function initTelegram() {
    if (!tg) {
        console.log('Not running in Telegram WebApp');
        return null;
    }

    // Раскрываем на весь экран
    tg.expand();

    // Устанавливаем тему
    if (tg.colorScheme === 'dark') {
        document.body.classList.add('tg-theme-dark');
    }

    // Включаем кнопку закрытия
    tg.enableClosingConfirmation();

    return tg;
}

// Получаем данные пользователя
function getTelegramUser() {
    if (!tg || !tg.initDataUnsafe?.user) {
        // Для тестирования без Telegram
        return {
            id: 123456789,
            first_name: 'Тест',
            last_name: 'Пользователь'
        };
    }
    return tg.initDataUnsafe.user;
}

// Haptic feedback
function hapticFeedback(type = 'light') {
    if (tg?.HapticFeedback) {
        switch(type) {
            case 'light':
                tg.HapticFeedback.impactOccurred('light');
                break;
            case 'medium':
                tg.HapticFeedback.impactOccurred('medium');
                break;
            case 'heavy':
                tg.HapticFeedback.impactOccurred('heavy');
                break;
            case 'success':
                tg.HapticFeedback.notificationOccurred('success');
                break;
            case 'warning':
                tg.HapticFeedback.notificationOccurred('warning');
                break;
            case 'error':
                tg.HapticFeedback.notificationOccurred('error');
                break;
        }
    }
}

// Показать главную кнопку
function showMainButton(text, callback) {
    if (tg?.MainButton) {
        tg.MainButton.text = text;
        tg.MainButton.onClick(callback);
        tg.MainButton.show();
    }
}

// Скрыть главную кнопку
function hideMainButton() {
    if (tg?.MainButton) {
        tg.MainButton.hide();
    }
}

// Показать кнопку "Назад"
function showBackButton(callback) {
    if (tg?.BackButton) {
        tg.BackButton.onClick(callback);
        tg.BackButton.show();
    }
}

// Скрыть кнопку "Назад"
function hideBackButton() {
    if (tg?.BackButton) {
        tg.BackButton.hide();
    }
}

// Закрыть WebApp
function closeWebApp() {
    if (tg) {
        tg.close();
    }
}

// Отправить данные в бота
function sendDataToBot(data) {
    if (tg) {
        tg.sendData(JSON.stringify(data));
    }
}

// Показать popup
function showPopup(params) {
    if (tg) {
        tg.showPopup(params);
    } else {
        alert(params.message);
    }
}

// Показать alert
function showAlert(message) {
    if (tg) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

// Показать confirm
function showConfirm(message, callback) {
    if (tg) {
        tg.showConfirm(message, callback);
    } else {
        callback(confirm(message));
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initTelegram();
});
