// ============================================
// NO ZERO DAY - APPLICATION COMPLÈTE
// Version 2.0.0 - Tout fonctionne avec notifications !
// ============================================

// Données de l'application
let appData = {
    // Données utilisateur
    streak: 0,
    bestStreak: 0,
    totalDays: 0,
    completedDays: 0,
    totalTime: 0,
    
    // Données du jour
    today: new Date().toISOString().split('T')[0],
    todayCompleted: false,
    completedExercises: 0,
    
    // Exercices
    exercises: [],
    currentLevel: 'beginner',
    
    // Calendrier (30 derniers jours)
    calendar: {},
    
    // Paramètres
    settings: {
        theme: 'dark',
        level: 'beginner',
        notifications: true,
        reminderTime: '18:00',
        vibration: true
    },
    
    // Timer
    timer: {
        running: false,
        seconds: 0,
        totalSeconds: 0,
        interval: null,
        exercise: ''
    },
    
    // Succès
    achievements: []
};

// Configuration des exercices par niveau
const exercisesConfig = {
    beginner: [
        { id: 1, name: "Gainage", duration: "30 secondes", time: 30, icon: "🛏️", completed: false },
        { id: 2, name: "Corde à sauter", duration: "1 minute", time: 60, icon: "🏃", completed: false },
        { id: 3, name: "Pompes", duration: "5 répétitions", time: 45, icon: "💪", completed: false },
        { id: 4, name: "Superman", duration: "30 secondes", time: 30, icon: "🦸", completed: false }
    ],
    intermediate: [
        { id: 1, name: "Gainage", duration: "45 secondes", time: 45, icon: "🛏️", completed: false },
        { id: 2, name: "Corde à sauter", duration: "2 minutes", time: 120, icon: "🏃", completed: false },
        { id: 3, name: "Pompes", duration: "10 répétitions", time: 60, icon: "💪", completed: false },
        { id: 4, name: "Superman", duration: "45 secondes", time: 45, icon: "🦸", completed: false },
        { id: 5, name: "Squats", duration: "15 répétitions", time: 45, icon: "🦵", completed: false }
    ],
    advanced: [
        { id: 1, name: "Gainage", duration: "1 minute", time: 60, icon: "🛏️", completed: false },
        { id: 2, name: "Corde à sauter", duration: "3 minutes", time: 180, icon: "🏃", completed: false },
        { id: 3, name: "Pompes", duration: "15 répétitions", time: 75, icon: "💪", completed: false },
        { id: 4, name: "Superman", duration: "1 minute", time: 60, icon: "🦸", completed: false },
        { id: 5, name: "Squats", duration: "20 répétitions", time: 60, icon: "🦵", completed: false },
        { id: 6, name: "Burpees", duration: "10 répétitions", time: 90, icon: "⚡", completed: false }
    ]
};

// Configuration des succès
const achievementsConfig = [
    { id: 1, name: "Premier jour", desc: "Valide ta première journée", icon: "🎯", unlocked: false },
    { id: 2, name: "3 jours de suite", desc: "3 jours consécutifs", icon: "🔥", unlocked: false },
    { id: 3, name: "Semaine complète", desc: "7 jours consécutifs", icon: "🏆", unlocked: false },
    { id: 4, name: "Mois complet", desc: "30 jours consécutifs", icon: "🚀", unlocked: false },
    { id: 5, name: "Mode fatigué", desc: "Utilise le mode fatigué", icon: "😴", unlocked: false },
    { id: 6, name: "Journée parfaite", desc: "Tous les exercices faits", icon: "⭐", unlocked: false }
];

// Notification ID pour le rappel quotidien
let notificationId = 'no-zero-day-reminder';
let reminderNotificationId = null;

// ============================================
// INITIALISATION
// ============================================

// Au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Initialiser l'application
function initApp() {
    // Charger les données
    loadData();
    
    // Initialiser l'interface
    initUI();
    
    // Demander la permission des notifications
    initNotifications();
    
    // Cacher l'écran de chargement
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('app').style.display = 'flex';
        showToast('Bienvenue sur No Zero Day !', 'success');
        
        // Vérifier si le rappel quotidien doit être envoyé aujourd'hui
        checkDailyReminder();
    }, 1000);
}

// Initialiser l'interface
function initUI() {
    // Mettre à jour la date
    updateDate();
    
    // Charger les exercices
    loadExercises();
    
    // Mettre à jour l'affichage
    updateDisplay();
    
    // Configurer le thème
    setTheme(appData.settings.theme);
    
    // Configurer les événements
    setupEventListeners();
    
    // Ajouter les labels ARIA manquants
    addAriaLabels();
}

// ============================================
// GESTION DES DONNÉES
// ============================================

// Charger les données depuis localStorage
function loadData() {
    try {
        const saved = localStorage.getItem('noZeroDayData');
        if (saved) {
            const data = JSON.parse(saved);
            
            // Vérifier si c'est un nouveau jour
            checkNewDay(data);
            
            // Fusionner les données
            appData = { ...appData, ...data };
            
            // S'assurer que les exercices ont la propriété completed
            if (appData.exercises && appData.exercises.length > 0) {
                appData.exercises = appData.exercises.map(ex => ({
                    ...ex,
                    completed: ex.completed || false
                }));
            }
        } else {
            // Créer des données par défaut
            createDefaultData();
        }
    } catch (error) {
        console.error('Erreur de chargement:', error);
        // Créer des données par défaut
        createDefaultData();
    }
    
    // Initialiser le calendrier si vide
    if (!appData.calendar || Object.keys(appData.calendar).length === 0) {
        initCalendar();
    }
    
    // Initialiser les succès
    if (!appData.achievements || appData.achievements.length === 0) {
        appData.achievements = JSON.parse(JSON.stringify(achievementsConfig));
    }
}

// Vérifier si c'est un nouveau jour
function checkNewDay(savedData) {
    const today = new Date().toISOString().split('T')[0];
    
    if (savedData.today !== today) {
        // Nouveau jour, réinitialiser les exercices du jour
        appData.today = today;
        appData.todayCompleted = false;
        appData.completedExercises = 0;
        
        // Réinitialiser les exercices complétés
        if (appData.exercises && appData.exercises.length > 0) {
            appData.exercises = appData.exercises.map(ex => ({
                ...ex,
                completed: false
            }));
        }
        
        // Vérifier si la streak est cassée
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (savedData.calendar && savedData.calendar[yesterdayStr]) {
            if (!savedData.calendar[yesterdayStr].completed) {
                appData.streak = 0;
                showToast('Streak cassée 😢 Recommence aujourd\'hui !', 'warning');
            }
        }
        
        // Envoyer une notification pour le nouveau jour
        if (appData.settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
            showNewDayNotification();
        }
        
        saveData();
    }
}

// Créer des données par défaut
function createDefaultData() {
    appData = {
        streak: 0,
        bestStreak: 0,
        totalDays: 0,
        completedDays: 0,
        totalTime: 0,
        today: new Date().toISOString().split('T')[0],
        todayCompleted: false,
        completedExercises: 0,
        exercises: JSON.parse(JSON.stringify(exercisesConfig.beginner)),
        currentLevel: 'beginner',
        calendar: {},
        settings: {
            theme: 'dark',
            level: 'beginner',
            notifications: true,
            reminderTime: '18:00',
            vibration: true
        },
        timer: {
            running: false,
            seconds: 0,
            totalSeconds: 0,
            interval: null,
            exercise: ''
        },
        achievements: JSON.parse(JSON.stringify(achievementsConfig))
    };
    
    initCalendar();
    saveData();
}

// Initialiser le calendrier (30 derniers jours)
function initCalendar() {
    const calendar = {};
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        calendar[dateStr] = {
            completed: false,
            exercises: 0,
            time: 0
        };
    }
    
    appData.calendar = calendar;
}

// Sauvegarder les données
function saveData() {
    try {
        localStorage.setItem('noZeroDayData', JSON.stringify(appData));
    } catch (error) {
        console.error('Erreur de sauvegarde:', error);
        showToast('Erreur de sauvegarde', 'error');
    }
}

// ============================================
// INTERFACE UTILISATEUR
// ============================================

// Mettre à jour la date
function updateDate() {
    const now = new Date();
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    document.getElementById('currentDay').textContent = days[now.getDay()];
    document.getElementById('currentDate').textContent = 
        `${now.getDate()} ${months[now.getMonth()]}`;
}

// Charger les exercices
function loadExercises() {
    const level = appData.settings.level;
    appData.exercises = JSON.parse(JSON.stringify(exercisesConfig[level]));
    
    // Si des exercices existent déjà, garder leur état
    if (appData.exercises && appData.exercises.length > 0) {
        appData.exercises = appData.exercises.map(ex => ({
            ...ex,
            completed: ex.completed || false
        }));
    }
    
    renderExercises();
}

// Afficher les exercices
function renderExercises() {
    const container = document.getElementById('exercisesList');
    container.innerHTML = '';
    
    appData.exercises.forEach((exercise) => {
        const exerciseElement = document.createElement('div');
        exerciseElement.className = `exercise-item ${exercise.completed ? 'completed' : ''}`;
        exerciseElement.dataset.id = exercise.id;
        
        exerciseElement.innerHTML = `
            <div class="exercise-content" onclick="toggleExercise(${exercise.id})" role="button" tabindex="0">
                <div class="exercise-checkbox" id="check${exercise.id}">
                    ${exercise.completed ? '✓' : ''}
                </div>
                <div>
                    <div class="exercise-name">${exercise.icon} ${exercise.name}</div>
                    <div class="exercise-duration">${exercise.duration}</div>
                </div>
            </div>
            <button class="exercise-timer" onclick="startExerciseTimer(${exercise.id})" aria-label="Démarrer le timer pour ${exercise.name}">
                ⏱️
            </button>
        `;
        
        container.appendChild(exerciseElement);
    });
    
    updateProgress();
}

// Cocher/décocher un exercice
function toggleExercise(id) {
    const exerciseIndex = appData.exercises.findIndex(ex => ex.id === id);
    if (exerciseIndex === -1) return;
    
    const exercise = appData.exercises[exerciseIndex];
    exercise.completed = !exercise.completed;
    
    // Mettre à jour le compteur
    if (exercise.completed) {
        appData.completedExercises++;
    } else {
        appData.completedExercises--;
    }
    
    // Mettre à jour l'affichage
    const exerciseElement = document.querySelector(`.exercise-item[data-id="${id}"]`);
    const checkbox = document.getElementById(`check${id}`);
    
    if (exerciseElement && checkbox) {
        exerciseElement.classList.toggle('completed', exercise.completed);
        checkbox.textContent = exercise.completed ? '✓' : '';
        
        // Animation
        if (exercise.completed) {
            exerciseElement.style.transform = 'scale(1.02)';
            setTimeout(() => {
                exerciseElement.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    // Mettre à jour la progression
    updateProgress();
    
    // Sauvegarder
    saveData();
    
    // Vérifier les succès
    checkAchievements();
    
    // Jouer un son
    playClickSound();
}

// Mettre à jour la progression
function updateProgress() {
    const total = appData.exercises.length;
    const percentage = total > 0 ? (appData.completedExercises / total) * 100 : 0;
    
    // Mettre à jour le texte
    document.getElementById('todayProgress').textContent = 
        `${appData.completedExercises}/${total}`;
    
    // Mettre à jour la barre
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = `${percentage}%`;
    
    // Mettre à jour le bouton de validation
    const validateBtn = document.getElementById('validateBtn');
    if (appData.completedExercises > 0 && !appData.todayCompleted) {
        validateBtn.disabled = false;
        validateBtn.style.opacity = '1';
    } else {
        validateBtn.disabled = true;
        validateBtn.style.opacity = '0.5';
    }
}

// Mettre à jour l'affichage principal
function updateDisplay() {
    // Streak
    document.getElementById('streakCount').textContent = appData.streak;
    document.getElementById('currentStreak').textContent = appData.streak;
    document.getElementById('bestStreak').textContent = appData.bestStreak;
    document.getElementById('totalDays').textContent = appData.completedDays;
    document.getElementById('totalTime').textContent = Math.floor(appData.totalTime / 60);
    
    // Progression
    updateProgress();
    
    // Chaine de la semaine
    updateWeekChain();
    
    // Calendrier
    updateCalendar();
    
    // Succès
    updateAchievements();
    
    // Paramètres
    updateSettings();
}

// Mettre à jour la chaine de la semaine
function updateWeekChain() {
    const container = document.getElementById('weekChain');
    container.innerHTML = '';
    
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = appData.calendar[dateStr];
        
        const dayElement = document.createElement('div');
        dayElement.className = 'day-circle';
        
        if (i === 0) {
            dayElement.classList.add('today');
        } else if (dayData && dayData.completed) {
            dayElement.classList.add('done');
        }
        
        dayElement.textContent = date.getDate();
        container.appendChild(dayElement);
    }
}

// Mettre à jour le calendrier
function updateCalendar() {
    const container = document.getElementById('calendar');
    container.innerHTML = '';
    
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Jours vides au début
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day';
        container.appendChild(empty);
    }
    
    // Jours du mois
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(today.getFullYear(), today.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = appData.calendar[dateStr];
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        if (day === today.getDate() && today.getMonth() === new Date().getMonth()) {
            dayElement.classList.add('today');
        } else if (dayData && dayData.completed) {
            dayElement.classList.add('done');
        }
        
        container.appendChild(dayElement);
    }
}

// Mettre à jour les succès
function updateAchievements() {
    const container = document.getElementById('achievements');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.achievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement ${achievement.unlocked ? '' : 'locked'}`;
        
        achievementElement.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.desc}</div>
        `;
        
        container.appendChild(achievementElement);
    });
}

// Mettre à jour les paramètres
function updateSettings() {
    const reminderTime = document.getElementById('reminderTime');
    const notificationsToggle = document.getElementById('notificationsToggle');
    
    if (reminderTime) {
        reminderTime.value = appData.settings.reminderTime;
        reminderTime.setAttribute('aria-label', 'Heure de rappel quotidien');
    }
    
    if (notificationsToggle) {
        notificationsToggle.checked = appData.settings.notifications;
        notificationsToggle.setAttribute('aria-label', 'Activer/désactiver les notifications');
    }
    
    // Mettre à jour les boutons de niveau
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('active');
        const level = btn.querySelector('span').textContent.toLowerCase();
        if (level.includes(appData.settings.level)) {
            btn.classList.add('active');
        }
    });
    
    // Mettre à jour les boutons de thème
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((appData.settings.theme === 'light' && btn.textContent.includes('Clair')) ||
            (appData.settings.theme === 'dark' && btn.textContent.includes('Sombre'))) {
            btn.classList.add('active');
        }
    });
}

// ============================================
// FONCTIONNALITÉS PRINCIPALES
// ============================================

// Valider la journée
function validateDay() {
    if (appData.todayCompleted) {
        showToast('Journée déjà validée !', 'info');
        return;
    }
    
    if (appData.completedExercises === 0) {
        showToast('Fais au moins un exercice !', 'error');
        return;
    }
    
    // Calculer le temps total
    const totalTime = appData.exercises
        .filter(ex => ex.completed)
        .reduce((sum, ex) => sum + ex.time, 0);
    
    // Mettre à jour les données
    appData.todayCompleted = true;
    appData.streak++;
    appData.totalDays++;
    appData.completedDays++;
    appData.totalTime += totalTime;
    
    // Mettre à jour la meilleure streak
    if (appData.streak > appData.bestStreak) {
        appData.bestStreak = appData.streak;
    }
    
    // Mettre à jour le calendrier
    appData.calendar[appData.today] = {
        completed: true,
        exercises: appData.completedExercises,
        time: totalTime
    };
    
    // Effets
    showToast(`🔥 Nouvelle streak : ${appData.streak} jours !`, 'success');
    playSuccessSound();
    vibrate([100, 50, 100]);
    
    // Animation
    const streakElement = document.getElementById('streakCount');
    streakElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
        streakElement.style.transform = 'scale(1)';
    }, 300);
    
    // Mettre à jour le bouton
    const validateBtn = document.getElementById('validateBtn');
    validateBtn.disabled = true;
    validateBtn.style.opacity = '0.5';
    validateBtn.innerHTML = '<span>✅ Journée validée !</span>';
    
    // Mettre à jour l'affichage
    updateDisplay();
    
    // Sauvegarder
    saveData();
    
    // Vérifier les succès
    checkAchievements();
}

// Mode fatigué
function toggleTiredMode() {
    const tiredCard = document.getElementById('tiredCard');
    tiredCard.classList.toggle('hidden');
    playClickSound();
    
    // Ajouter un label ARIA
    const isHidden = tiredCard.classList.contains('hidden');
    document.querySelector('.btn-secondary[onclick="toggleTiredMode()"]')
        .setAttribute('aria-label', isHidden ? 'Afficher le mode fatigué' : 'Cacher le mode fatigué');
}

function completeTired(type) {
    playClickSound();
    
    if (type === 'plank') {
        // Simuler le gainage
        if (appData.exercises[0]) {
            toggleExercise(appData.exercises[0].id);
        }
    } else if (type === 'squats') {
        // Ajouter un exercice rapide
        appData.completedExercises++;
        updateProgress();
        saveData();
    }
    
    // Débloquer le succès "Mode fatigué"
    const tiredAchievement = appData.achievements.find(a => a.id === 5);
    if (tiredAchievement && !tiredAchievement.unlocked) {
        tiredAchievement.unlocked = true;
        showToast('Succès débloqué : Mode fatigué !', 'success');
    }
    
    toggleTiredMode();
    showToast('Exercice rapide ajouté !', 'success');
}

// ============================================
// TIMER
// ============================================

// Démarrer le timer pour un exercice
function startExerciseTimer(exerciseId) {
    const exercise = appData.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    playClickSound();
    
    // Afficher le timer
    const timerCard = document.getElementById('timerCard');
    timerCard.classList.remove('hidden');
    document.getElementById('timerExercise').textContent = exercise.name;
    
    // Configurer le timer
    appData.timer.seconds = 0;
    appData.timer.totalSeconds = exercise.time;
    appData.timer.exercise = exercise.name;
    
    // Mettre à jour l'affichage
    updateTimerDisplay();
}

// Démarrer le timer
function startTimer() {
    if (appData.timer.running) return;
    
    playClickSound();
    appData.timer.running = true;
    appData.timer.interval = setInterval(() => {
        appData.timer.seconds++;
        updateTimerDisplay();
        
        // Vérifier si le temps est écoulé
        if (appData.timer.seconds >= appData.timer.totalSeconds) {
            clearInterval(appData.timer.interval);
            appData.timer.running = false;
            showToast(`⏱️ ${appData.timer.exercise} terminé !`, 'success');
            playSuccessSound();
            vibrate([200, 100, 200]);
            
            // Cocher automatiquement l'exercice
            const exercise = appData.exercises.find(ex => ex.name === appData.timer.exercise);
            if (exercise && !exercise.completed) {
                toggleExercise(exercise.id);
            }
        }
    }, 1000);
}

// Mettre en pause le timer
function pauseTimer() {
    if (!appData.timer.running) return;
    
    playClickSound();
    clearInterval(appData.timer.interval);
    appData.timer.running = false;
}

// Réinitialiser le timer
function resetTimer() {
    playClickSound();
    pauseTimer();
    appData.timer.seconds = 0;
    updateTimerDisplay();
}

// Cacher le timer
function hideTimer() {
    playClickSound();
    document.getElementById('timerCard').classList.add('hidden');
    resetTimer();
}

// Mettre à jour l'affichage du timer
function updateTimerDisplay() {
    const minutes = Math.floor(appData.timer.seconds / 60);
    const seconds = appData.timer.seconds % 60;
    document.getElementById('timerDisplay').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================
// SUCCÈS
// ============================================

// Vérifier les succès
function checkAchievements() {
    let newAchievements = false;
    
    // Premier jour
    if (appData.streak >= 1) {
        const achievement = appData.achievements.find(a => a.id === 1);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            newAchievements = true;
        }
    }
    
    // 3 jours de suite
    if (appData.streak >= 3) {
        const achievement = appData.achievements.find(a => a.id === 2);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            newAchievements = true;
        }
    }
    
    // Semaine complète
    if (appData.streak >= 7) {
        const achievement = appData.achievements.find(a => a.id === 3);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            newAchievements = true;
        }
    }
    
    // Mois complet
    if (appData.streak >= 30) {
        const achievement = appData.achievements.find(a => a.id === 4);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            newAchievements = true;
        }
    }
    
    // Journée parfaite
    if (appData.completedExercises === appData.exercises.length) {
        const achievement = appData.achievements.find(a => a.id === 6);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            newAchievements = true;
        }
    }
    
    if (newAchievements) {
        showToast('Nouveau succès débloqué !', 'success');
        updateAchievements();
        saveData();
    }
}

// ============================================
// NAVIGATION ET ÉCRANS
// ============================================

// Changer d'écran
function switchScreen(screen) {
    playClickSound();
    
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.screen').forEach(screenElement => {
        screenElement.classList.remove('active');
    });
    
    // Activer l'écran demandé
    const screenElement = document.getElementById(`${screen}Screen`);
    if (screenElement) {
        screenElement.classList.add('active');
    }
    
    // Activer le bouton correspondant
    const navBtn = document.querySelector(`.nav-btn[onclick*="${screen}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }
    
    // Mettre à jour les données si besoin
    if (screen === 'stats' || screen === 'home') {
        updateDisplay();
    }
}

// ============================================
// PARAMÈTRES
// ============================================

// Changer le thème
function setTheme(theme) {
    playClickSound();
    appData.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    saveData();
    showToast(`Thème ${theme === 'light' ? 'clair' : 'sombre'} activé`, 'success');
}

// Changer le niveau
function setLevel(level) {
    playClickSound();
    appData.settings.level = level;
    appData.currentLevel = level;
    
    // Réinitialiser les exercices du jour
    appData.completedExercises = 0;
    appData.todayCompleted = false;
    
    // Charger les nouveaux exercices
    loadExercises();
    
    // Mettre à jour l'affichage
    updateDisplay();
    
    // Sauvegarder
    saveData();
    
    showToast(`Niveau ${level} activé`, 'success');
}

// Exporter les données
function exportData() {
    playClickSound();
    const dataStr = JSON.stringify(appData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `no-zero-day-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Données exportées', 'success');
}

// Réinitialiser les données
function resetData() {
    playClickSound();
    if (confirm('⚠️ Es-tu sûr de vouloir tout réinitialiser ?')) {
        if (confirm('⚠️ Dernière chance ! Toutes tes données seront effacées.')) {
            // Annuler le rappel quotidien
            cancelDailyReminder();
            
            localStorage.clear();
            createDefaultData();
            loadExercises();
            updateDisplay();
            showToast('Données réinitialisées', 'success');
            vibrate([200, 100, 200]);
        }
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

// Initialiser les notifications
function initNotifications() {
    if (!('Notification' in window)) {
        console.log('Notifications non supportées');
        return;
    }
    
    // Si la permission est déjà accordée, programmer le rappel
    if (Notification.permission === 'granted') {
        scheduleDailyReminder();
    }
}

// Demander la permission des notifications
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Notifications non supportées par votre navigateur', 'error');
        return;
    }
    
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Notifications activées !', 'success');
                scheduleDailyReminder();
            } else {
                showToast('Notifications refusées', 'warning');
            }
        });
    } else if (Notification.permission === 'denied') {
        showToast('Notifications bloquées. Activez-les dans les paramètres du navigateur.', 'warning');
    }
}

// Programmer le rappel quotidien
function scheduleDailyReminder() {
    // Annuler le rappel précédent s'il existe
    cancelDailyReminder();
    
    if (!appData.settings.notifications) return;
    
    const [hours, minutes] = appData.settings.reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // Si l'heure est déjà passée aujourd'hui, programmer pour demain
    if (reminderTime < now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    // Programmer la notification
    reminderNotificationId = setTimeout(() => {
        showReminderNotification();
        // Re-programmer pour le jour suivant
        scheduleDailyReminder();
    }, timeUntilReminder);
    
    console.log('Rappel programmé à:', reminderTime, 'dans', Math.floor(timeUntilReminder / 1000 / 60), 'minutes');
}

// Annuler le rappel quotidien
function cancelDailyReminder() {
    if (reminderNotificationId) {
        clearTimeout(reminderNotificationId);
        reminderNotificationId = null;
    }
}

// Afficher la notification de rappel
function showReminderNotification() {
    if (!appData.settings.notifications) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    if (!appData.todayCompleted) {
        const notification = new Notification('🔥 No Zero Day - Rappel !', {
            body: 'Tu as oublié ta routine aujourd\'hui ? Ne casse pas la chaîne !',
            icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%23ff6600%22>🔥</text></svg>',
            tag: 'daily-reminder',
            requireInteraction: true,
            silent: false
        });
        
        notification.onclick = function() {
            window.focus();
            this.close();
        };
        
        // Fermer automatiquement après 10 secondes
        setTimeout(() => {
            notification.close();
        }, 10000);
    }
}

// Afficher la notification pour un nouveau jour
function showNewDayNotification() {
    if (!appData.settings.notifications) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const notification = new Notification('🔥 Nouveau jour !', {
        body: `Streak actuelle : ${appData.streak} jours. Fais ta routine aujourd'hui !`,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%2300cc00%22>🔥</text></svg>',
        tag: 'new-day',
        silent: true
    });
    
    notification.onclick = function() {
        window.focus();
        this.close();
    };
    
    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
        notification.close();
    }, 5000);
}

// Vérifier si le rappel quotidien doit être envoyé
function checkDailyReminder() {
    const now = new Date();
    const [hours, minutes] = appData.settings.reminderTime.split(':').map(Number);
    
    // Si l'heure du rappel est passée et que la journée n'est pas complétée
    if (now.getHours() >= hours && now.getMinutes() >= minutes) {
        if (!appData.todayCompleted && appData.settings.notifications) {
            // Vérifier si on a déjà notifié aujourd'hui
            const lastReminderDate = localStorage.getItem('lastReminderDate');
            const today = new Date().toISOString().split('T')[0];
            
            if (lastReminderDate !== today) {
                showReminderNotification();
                localStorage.setItem('lastReminderDate', today);
            }
        }
    }
}

// ============================================
// UTILITAIRES
// ============================================

// Afficher un message toast
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Jouer un son de succès
function playSuccessSound() {
    try {
        // Créer un son simple avec l'API Web Audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Son non supporté');
    }
}

// Jouer un son de clic
function playClickSound() {
    try {
        // Son de clic simple
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Son non supporté');
    }
}

// Faire vibrer le téléphone
function vibrate(pattern) {
    if (!appData.settings.vibration) return;
    if (!navigator.vibrate) return;
    
    try {
        navigator.vibrate(pattern);
    } catch (error) {
        console.log('Vibration non supportée');
    }
}

// Ajouter des labels ARIA pour l'accessibilité
function addAriaLabels() {
    // Labels pour les boutons sans texte
    const iconButtons = document.querySelectorAll('.icon-btn');
    iconButtons.forEach(btn => {
        if (!btn.hasAttribute('aria-label')) {
            const emoji = btn.textContent;
            const labels = {
                '📊': 'Statistiques',
                '←': 'Retour',
                '🏠': 'Accueil',
                '⚙️': 'Paramètres'
            };
            btn.setAttribute('aria-label', labels[emoji] || 'Bouton');
        }
    });
    
    // Labels pour les boutons d'exercices
    const exerciseButtons = document.querySelectorAll('.exercise-timer');
    exerciseButtons.forEach(btn => {
        if (!btn.hasAttribute('aria-label')) {
            const exerciseName = btn.closest('.exercise-item')?.querySelector('.exercise-name')?.textContent || 'exercice';
            btn.setAttribute('aria-label', `Timer pour ${exerciseName}`);
        }
    });
    
    // Labels pour les boutons du timer
    const timerButtons = document.querySelectorAll('.timer-btn');
    timerButtons.forEach((btn, index) => {
        const labels = ['Démarrer le timer', 'Mettre en pause', 'Réinitialiser'];
        btn.setAttribute('aria-label', labels[index] || 'Bouton timer');
    });
}

// Configurer les événements
function setupEventListeners() {
    // Gérer le retour en ligne/hors ligne
    window.addEventListener('online', () => {
        showToast('Connexion rétablie', 'success');
    });
    
    window.addEventListener('offline', () => {
        showToast('Mode hors ligne', 'warning');
    });
    
    // Sauvegarder quand la page se ferme
    window.addEventListener('beforeunload', () => {
        saveData();
        cancelDailyReminder();
    });
    
    // Mettre à jour les paramètres en temps réel
    const reminderTime = document.getElementById('reminderTime');
    const notificationsToggle = document.getElementById('notificationsToggle');
    
    if (reminderTime) {
        reminderTime.addEventListener('change', (e) => {
            appData.settings.reminderTime = e.target.value;
            saveData();
            
            // Re-programmer le rappel
            scheduleDailyReminder();
            
            showToast('Rappel enregistré', 'success');
        });
    }
    
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', (e) => {
            appData.settings.notifications = e.target.checked;
            saveData();
            
            if (e.target.checked && Notification.permission === 'granted') {
                scheduleDailyReminder();
            } else {
                cancelDailyReminder();
            }
            
            showToast(`Notifications ${e.target.checked ? 'activées' : 'désactivées'}`, 'success');
            
            // Si on active les notifications mais que la permission n'est pas accordée
            if (e.target.checked && Notification.permission !== 'granted') {
                setTimeout(() => {
                    requestNotificationPermission();
                }, 1000);
            }
        });
    }
    
    // Support pour les touches du clavier
    document.addEventListener('keydown', (e) => {
        // Échap pour fermer les modales
        if (e.key === 'Escape') {
            const timerCard = document.getElementById('timerCard');
            if (!timerCard.classList.contains('hidden')) {
                hideTimer();
            }
            
            const tiredCard = document.getElementById('tiredCard');
            if (!tiredCard.classList.contains('hidden')) {
                toggleTiredMode();
            }
        }
        
        // Touches numériques pour les exercices (1-6)
        if (e.key >= '1' && e.key <= '6') {
            const exerciseIndex = parseInt(e.key) - 1;
            if (appData.exercises[exerciseIndex]) {
                toggleExercise(appData.exercises[exerciseIndex].id);
            }
        }
        
        // Espace pour valider la journée
        if (e.key === ' ' && !e.target.closest('input, textarea')) {
            e.preventDefault();
            const validateBtn = document.getElementById('validateBtn');
            if (!validateBtn.disabled) {
                validateDay();
            }
        }
    });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}
