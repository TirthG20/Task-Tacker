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

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let filter = 'all';

  // Request notification permission
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  // Render tasks
  function renderTasks() {
    taskList.innerHTML = '';
    const filteredTasks = tasks.filter(task => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    });
    // Sort tasks: completed last, then by priority (High > Medium > Low)
    filteredTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    filteredTasks.forEach((task, index) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isOverdue = dueDate && !task.completed && dueDate < new Date();
      const li = document.createElement('li');
      li.className = `flex items-center justify-between p-3 border border-gray-300 rounded-lg task-enter ${
        task.completed ? 'bg-green-100' : isOverdue ? 'overdue' : ''
      }`;
      li.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}">${
            task.text
          }</span>
          <span class="text-xs px-2 py-1 rounded-full ${
            task.category === 'Work' ? 'bg-blue-200 text-blue-800' :
            task.category === 'Personal' ? 'bg-purple-200 text-purple-800' :
            'bg-gray-200 text-gray-800'
          }">${task.category}</span>
          <span class="text-xs px-2 py-1 rounded-full ${
            task.priority === 'High' ? 'bg-red-200 text-red-800' :
            task.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
            'bg-green-200 text-green-800'
          }">${task.priority}</span>
          ${dueDate ? `<span class="text-xs text-gray-500">${dueDate.toLocaleString()}</span>` : ''}
        </div>
        <div class="flex space-x-2">
          <button onclick="toggleTask(${index})" class="text-green-500 hover:text-green-700 text-sm">
            ${task.completed ? 'Undo' : 'Complete'}
          </button>
          <button onclick="editTask(${index})" class="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
          <button onclick="deleteTask(${index})" class="text-red-500 hover:text-red-700 text-sm">Delete</button>
        </div>
      `;
      taskList.appendChild(li);
    });
    saveTasks();
  }

  // Add task
  addTaskBtn.addEventListener('click', () => {
    const taskText = taskInput.value.trim();
    const category = categorySelect.value;
    const dueDate = dueDateInput.value;
    const priority = prioritySelect.value;
    if (taskText) {
      tasks.push({ text: taskText, category, dueDate: dueDate || null, priority, completed: false });
      taskInput.value = '';
      dueDateInput.value = '';
      prioritySelect.value = 'Medium';
      renderTasks();
    }
  });

  // Toggle task completion
  function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
  }

  // Edit task
  function editTask(index) {
    const newText = prompt('Edit task:', tasks[index].text);
    const newDueDate = prompt('Edit due date (YYYY-MM-DDTHH:MM, leave blank for no due date):', tasks[index].dueDate || '');
    const newPriority = prompt('Edit priority (High, Medium, Low):', tasks[index].priority);
    if (newText !== null && newText.trim()) {
      tasks[index].text = newText.trim();
      tasks[index].dueDate = newDueDate || null;
      tasks[index].priority = ['High', 'Medium', 'Low'].includes(newPriority) ? newPriority : tasks[index].priority;
      renderTasks();
    }
  }

  // Delete task
  function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
  }

  // Clear all tasks
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all tasks?')) {
      tasks = [];
      renderTasks();
    }
  });

  // Filter tasks
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

  // Update filter button styles
  function updateFilterButtons() {
    filterAll.classList.toggle('bg-blue-500', filter === 'all');
    filterAll.classList.toggle('text-white', filter === 'all');
    filterAll.classList.toggle('bg-gray-200', filter !== 'all');
    filterAll.classList.toggle('text-black', filter !== 'all');
    filterActive.classList.toggle('bg-blue-500', filter === 'active');
    filterActive.classList.toggle('text-white', filter === 'active');
    filterActive.classList.toggle('bg-gray-200', filter !== 'active');
    filterActive.classList.toggle('text-black', filter !== 'active');
    filterCompleted.classList.toggle('bg-blue-500', filter === 'completed');
    filterCompleted.classList.toggle('text-white', filter === 'completed');
    filterCompleted.classList.toggle('bg-gray-200', filter !== 'completed');
    filterCompleted.classList.toggle('text-black', filter !== 'completed');
  }

  // Save tasks to local storage
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Toggle dark mode
  toggleDarkMode.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    toggleDarkMode.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
  });

  // System theme detection
  function applySystemTheme() {
    if (!localStorage.getItem('darkMode')) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      toggleDarkMode.textContent = prefersDark ? '☀️' : '🌙';
    }
  }

  // Load dark mode preference or system theme
  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
    toggleDarkMode.textContent = '☀️';
  } else if (localStorage.getItem('darkMode') === 'false') {
    document.documentElement.classList.remove('dark');
    toggleDarkMode.textContent = '🌙';
  } else {
    applySystemTheme();
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applySystemTheme);

  // Check for due tasks and send notifications
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

  // Run check every 30 seconds
  setInterval(checkDueTasks, 30000);

  // Initial render and check
  renderTasks();
  updateFilterButtons();
  checkDueTasks();
});
