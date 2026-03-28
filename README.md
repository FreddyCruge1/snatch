# Snatch

> Скачивай видео с YouTube, Twitter/X, Instagram, TikTok, Twitch, ВКонтакте и 1000+ других сайтов в пару кликов.

![Platform](https://img.shields.io/badge/platform-Windows-blue?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Version](https://img.shields.io/badge/version-2.0.0-purple?style=flat-square)

---

## ✨ Возможности

- **Скачивание одним кликом** — вставил ссылку, выбрал качество, нажал кнопку
- **Реальный прогресс-бар** — показывает процент загрузки в реальном времени
- **Предпросмотр видео** — показывает превью и название до скачивания
- **Выбор формата** — лучшее качество, 1080p, 720p, 480p, 360p или только MP3
- **Встроенный видеоплеер** — смотри скачанные видео прямо в приложении (Plyr)
- **Автосортировка** — Videos/YouTube, Music/SoundCloud и т.д.
- **Несколько потоков** — быстрее скачивание за счёт параллельных фрагментов
- **Автоповтор** — при обрыве сети повторяет попытку автоматически
- **Предупреждение о дубликатах** — не даст скачать одно и то же дважды
- **Уведомления Windows** — всплывает когда видео скачалось
- **Автовставка из буфера** — при открытии сразу вставляет ссылку
- **История загрузок** — все скачанные видео с миниатюрами
- **Обновление yt-dlp** — одной кнопкой прямо в настройках
- **Скачивание плейлистов** — определяет количество видео автоматически
- **Поддержка cookies** — для сайтов требующих авторизацию (ВКонтакте и др.)
- **2 темы** — тёмная и светлая
- **Всё включено** — yt-dlp и ffmpeg уже вшиты в установщик

---

## 📥 Установка

### Простой способ (рекомендуется)

1. Скачай последний релиз: **[Snatch Setup.exe](https://github.com/FreddyCruge1/snatch/releases/latest)**
2. Запусти установщик
3. Готово — запускай Snatch из меню Пуск

### Запуск из исходников

Требования: [Node.js](https://nodejs.org) 18+

```bash
git clone https://github.com/FreddyCruge1/snatch.git
cd snatch
npm install
npm start
```

---

## 🔐 Скачивание с сайтов требующих авторизацию (ВКонтакте и др.)

Некоторые сайты (ВКонтакте, Bilibili и др.) требуют авторизацию для доступа к видео. Snatch поддерживает два способа передачи cookies.

### Способ 1 — Файл cookies.txt (рекомендуется, браузер можно держать открытым)

**Шаг 1 — Установи расширение для экспорта cookies:**

| Браузер | Расширение |
|---------|-----------|
| Chrome | [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) |
| Firefox | [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/) |
| Edge | [Get cookies.txt LOCALLY](https://microsoftedge.microsoft.com/addons/detail/get-cookiestxt-locally/helkgkhjbclbhdkbmclopcfpdbdbikge) |
| Vivaldi | [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (поддерживает расширения Chrome) |
| Opera | [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) |
| Brave | [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) |

**Шаг 2 — Экспортируй cookies:**
1. Зайди на **vkvideo.ru** (или другой нужный сайт) и авторизуйся
2. Нажми на иконку расширения в панели браузера
3. Нажми **Export** → сохрани файл как `cookies.txt`

**Шаг 3 — Настрой Snatch:**
1. Открой **Настройки** в Snatch
2. Включи **"Использовать cookies из браузера"**
3. В поле **"Путь к файлу cookies.txt"** укажи путь к файлу, например: `C:/Users/Acer/Downloads/cookies.txt`
4. Нажми **Сохранить**

**Шаг 4 — Скачивай:**
1. На главном экране включи переключатель **COOKIES** (правый верхний угол карточки)
2. Вставь ссылку на видео ВКонтакте
3. Нажми **Скачать**

> ⚠️ **Важно:** Для YouTube cookies включать не нужно — оставь переключатель выключенным.

---

### Способ 2 — Напрямую из браузера (браузер должен быть закрыт)

1. В настройках включи **"Использовать cookies из браузера"**
2. Выбери свой браузер из списка
3. **Полностью закрой браузер** перед скачиванием
4. Включи переключатель COOKIES на главном экране и скачивай

---

## 🎯 Поддерживаемые сайты

Через yt-dlp поддерживается более 1000 сайтов, включая:

| Сайт | Требует cookies? |
|------|----------------|
| YouTube | ❌ |
| Twitter / X | ❌ |
| Instagram | ❌ |
| TikTok | ❌ |
| Twitch | ❌ |
| Reddit | ❌ |
| ВКонтакте | ✅ |
| Bilibili | Зависит от видео |
| Facebook | Зависит от видео |

Полный список: [yt-dlp/supportedsites.md](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

---

## 🛠️ Технологии

| Технология | Назначение | Лицензия |
|------------|-----------|----------|
| [Electron](https://electronjs.org) | Desktop-фреймворк | MIT |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Скачивание видео | Unlicense |
| [ffmpeg](https://ffmpeg.org) | Обработка видео | LGPL 2.1+ |
| [Plyr](https://plyr.io) | Видеоплеер | MIT |

---

## 📄 Лицензия

MIT © 2026

This application uses [yt-dlp](https://github.com/yt-dlp/yt-dlp), [ffmpeg](https://ffmpeg.org) and [Plyr](https://plyr.io) under their respective open source licenses.
