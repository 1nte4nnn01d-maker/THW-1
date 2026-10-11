# Ассеты (необязательно: без них игра рисует флаги и синтезирует звук сама)

Положи файлы рядом с именами из `manifest.json`:
- `audio/ambient.ogg|mp3` — тихий эмбиент, зациклится (громкость ~12%).
- `audio/click.ogg|mp3`, `audio/turn.ogg|mp3` — клик и конец хода.
- Флаги: в `manifest.json` задай `"flags": "assets/flags/{iso}.svg"` (iso в нижнем регистре, `de.svg`). Если файла нет, подставится нарисованный флаг.

Источники без авторских прав / с разрешающими лицензиями (проверяй лицензию каждого файла и пиши её в `credits`):
- Kenney.nl (CC0): звуки интерфейса. OpenGameArt.org (фильтр CC0). Freesound.org (фильтр CC0).
- Флаги: проект flag-icons (MIT) или Wikimedia Commons (public domain).
