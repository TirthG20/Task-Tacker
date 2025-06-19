document.addEventListener('DOMContentLoaded', () => {
  const taskInput = document.getElementById('taskInput');
  const categorySelect = document.getElementById('categorySelect');
  const dueDateInput = document.getElementById('dueDateInput');
  const prioritySelect = document.getElementById('prioritySelect');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskList = document.getElementById('taskList');
  const filterAll = document.getElementById('filterAll');
  const filterActive = document.getElementById('filterActive');
  const filterCompleted = document.getElementById('filterCompleted');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const toggleDarkMode = document.getElementById('toggleDarkMode');
  const canvas = document.getElementById('backgroundCanvas');
  let ctx;

  try {
    ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not supported');
  } catch (e) {
    console.error('Canvas initialization failed:', e);
  }

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let filter = 'all';

  // Wave Animation
  let wave = { y: 0, amplitude: 30, frequency: 0.01, phase: 0 }; // Increased amplitude
  function initCanvas() {
    if (!canvas || !ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function animateWaves() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isDark = document.documentElement.classList.contains('dark');
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = canvas.height / 2 + wave.amplitude * Math.sin(wave.frequency * x + wave.phase);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(139, 92, 246, 0.3)'; // Bolder colors, higher opacity
    ctx.fill();
    wave.phase += 0.05;
    requestAnimationFrame(animateWaves);
  }
  if (ctx) {
    initCanvas();
    animateWaves();
    window.addEventListener('resize', initCanvas);
  }

  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  function renderTasks() {
    taskList.innerHTML = '';
    const filteredTasks = tasks.filter(task => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    });
    filteredTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    filteredTasks.forEach((task, index) => {
      const originalIndex = tasks.indexOf(task);
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isOverdue = dueDate && !task.completed && dueDate < new Date();
      const li = document.createElement('li');
      li.className = `task-card priority-${task.priority.toLowerCase()} ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
      li.innerHTML = `
        <div class="task-content">
          <span class="task-text ${task.completed ? 'completed-text' : ''}">${task.text}</span>
          <span class="badge category-${task.category.toLowerCase()}">${task.category}</span>
          <span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
          ${dueDate ? `<span class="due-date">${dueDate.toLocaleString()}</span>` : ''}
        </div>
        <div class="task-actions">
          <button data-index="${originalIndex}" class="btn-toggle">${task.completed ? 'Undo' : 'Complete'}</button>
          <button data-index="${originalIndex}" class="btn-edit">Edit</button>
          <button data-index="${originalIndex}" class="btn-delete">Delete</button>
        </div>
      `;
      taskList.appendChild(li);
    });
    saveTasks();
  }

  addTaskBtn.addEventListener('click', () => {
    const taskText = taskInput.value.trim();
    const category = categorySelect.value;
    const dueDate = dueDateInput.value;
    const priority = prioritySelect.value;
    const now = new Date();
    const selectedDate = dueDate ? new Date(dueDate) : null;

    if (!taskText || !category || !dueDate || !priority) {
      alert('Please fill in all required fields.');
      return;
    }
    if (selectedDate && selectedDate <= now) {
      alert('Due date must be in the future.');
      return;
    }

    tasks.push({ text: taskText, category, dueDate, priority, completed: false });
    taskInput.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'Medium';
    categorySelect.value = 'Work';
    renderTasks();
  });

  taskList.addEventListener('click', (e) => {
    const index = parseInt(e.target.dataset.index);
    if (e.target.classList.contains('btn-toggle')) {
      toggleTask(index);
    } else if (e.target.classList.contains('btn-edit')) {
      editTask(index);
    } else if (e.target.classList.contains('btn-delete')) {
      deleteTask(index);
    }
  });

  function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
  }

  function editTask(index) {
    const newText = prompt('Edit task:', tasks[index].text);
    const newDueDate = prompt('Edit due date (YYYY-MM-DDTHH:MM, leave blank for no due date):', tasks[index].dueDate || '');
    const newPriority = prompt('Edit priority (High, Medium, Low):', tasks[index].priority);
    const newCategory = prompt('Edit category (Work, Personal, Other):', tasks[index].category);
    const now = new Date();
    const selectedDate = newDueDate ? new Date(newDueDate) : null;

    if (newText !== null && newText.trim()) {
      if (selectedDate && selectedDate <= now) {
        alert('Due date must be in the future.');
        return;
      }
      tasks[index].text = newText.trim();
      tasks[index].dueDate = newDueDate || null;
      tasks[index].priority = ['High', 'Medium', 'Low'].includes(newPriority) ? newPriority : tasks[index].priority;
      tasks[index].category = ['Work', 'Personal', 'Other'].includes(newCategory) ? newCategory : tasks[index].category;
      renderTasks();
    }
  }

  function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
  }

  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all tasks?')) {
      tasks = [];
      renderTasks();
    }
  });

  filterAll.addEventListener('click', () => {
    filter = 'all';
    renderTasks();
    updateFilterButtons();
  });
  filterActive.addEventListener('click', () => {
    filter = 'active';
    renderTasks();
    updateFilterButtons();
  });
  filterCompleted.addEventListener('click', () => {
    filter = 'completed';
    renderTasks();
    updateFilterButtons();
  });

  function updateFilterButtons() {
    filterAll.classList.toggle('active', filter === 'all');
    filterActive.classList.toggle('active', filter === 'active');
    filterCompleted.classList.toggle('active', filter === 'completed');
  }

  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  toggleDarkMode.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    toggleDarkMode.innerHTML = document.documentElement.classList.contains('dark') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
  });

  function applySystemTheme() {
    if (!localStorage.getItem('darkMode')) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      toggleDarkMode.innerHTML = prefersDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
  }

  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
    toggleDarkMode.innerHTML = '<i class="fas fa-sun"></i>';
  } else if (localStorage.getItem('darkMode') === 'false') {
    document.documentElement.classList.remove('dark');
    toggleDarkMode.innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    applySystemTheme();
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applySystemTheme);

  function checkDueTasks() {
    const now = new Date();
    tasks.forEach((task, index) => {
      if (task.dueDate && !task.completed) {
        const dueDate = new Date(task.dueDate);
        const timeDiff = Math.abs(dueDate - now);
        if (timeDiff < 60000 && Notification.permission === 'granted') {
          new Notification(`Task Reminder: ${task.text}`, {
            body: `Due: ${dueDate.toLocaleString()} (Priority: ${task.priority})`,
          });
          tasks[index].dueDate = null;
          renderTasks();
        }
      }
    });
  }

  setInterval(checkDueTasks, 30000);
  renderTasks();
  updateFilterButtons();
  checkDueTasks();
});
