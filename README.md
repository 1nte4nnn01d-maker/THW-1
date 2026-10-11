# Великая война — модульный проект

Запуск (fetch не работает с file://):  `python3 -m http.server 8080`  →  http://localhost:8080

index.html            оболочка + загрузка
css/style.css         стили
data/game.json        страны, провинции (центры, площади), соседи E, морские коридоры S, столицы
data/provinces.topo.json  TopoJSON: общие дуги (arcs), границы не дублируются
js/loader.js          fetch → декод арок → Дуглас–Пекер → растеризация в сетку id
js/assets.js          рисованные SVG-флаги, manifest с открытыми ассетами
js/supply.js          снабжение, лимит снабжения, истощение, лечение, роспуск
js/ai.js              ИИ: угрозы на границах, приоритетные фронты, резервы
js/diplomat.js        ИИ-дипломат: контекст, DeepSeek/Gemini, команды (альянс, рекруты, война), чат
js/audio.js           эмбиент + звуки (файлы или синтез)
js/game.js            игра (бывший монолит, без голода)
js/boot.js            хоткеи (Space, M), звуки на клики/ход
tools/                пересборка карты: build_provinces.py → build_topojson.py; make_project.py
